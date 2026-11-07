"use server";

import { randomUUID } from "node:crypto";

import { FORM_KEYS } from "@/components/forms/ids";
import { DONATE_TEXT, FORM_TEXT } from "@/content/fr/forms";
import { TEST_REFERENCE_PREFIX, widgetPhone, type KkiapayCheckout, type PaymentCheckResult } from "@/lib/payments/checkout";
import {
  cleanLine,
  MERCHANT_REFERENCE,
  donationSchema,
  echoValues,
  pickDonationAmount,
  readFields,
  validate,
  type FormState,
} from "@/lib/validation/forms";
import {
  assertFormToken,
  assertTurnstile,
  errorState,
  invalidState,
  isHoneypotFilled,
  readClientIp,
  failureState,
} from "@/server/actions/public-form";
import { getSiteSettings } from "@/server/data/site";
import { AppError, fromDatabaseError, runAction } from "@/server/errors";
import { getKkiapayConfig, KKIAPAY_TRANSACTION_ID, verifyKkiapayTransaction, type KkiapayConfig } from "@/server/payments/kkiapay";
import { reconcileKkiapayPayment } from "@/server/payments/reconcile";
import { getFormsBackend } from "@/server/security/forms-backend";
import { hashIp } from "@/server/security/ip";
import { enforceRateLimit, RATE_LIMITS } from "@/server/security/rate-limit";
import { generateMerchantReference } from "@/server/security/tokens";

/*
 * Don EN LIGNE (KKiaPay). Inactif tant que la clé KKiaPay n'est pas
 * configurée (getActiveProvider() renvoie null).
 *
 * startOnlineDonation PRÉPARE seulement le paiement et renvoie au navigateur
 * de quoi ouvrir la fenêtre KKiaPay :
 *  - mode TEST (sandbox) : rien n'est écrit dans la base (aucun faux don) ;
 *  - mode RÉEL : un don `pending` et une transaction `pending` (référence
 *    aléatoire, transmise à KKiaPay).
 * checkOnlinePayment vérifie ensuite le paiement AUPRÈS DE KKIAPAY. Seule la
 * fonction SQL confirm_payment_transaction() marque un don comme payé.
 */

const FIELDS = [
  "amountChoice",
  "customAmount",
  "campaign",
  "isAnonymous",
  "donorName",
  "email",
  "phone",
  "donorMessage",
  "consent",
  "idempotencyKey",
  "utm_source",
  "utm_medium",
  "utm_campaign",
] as const;

/** Champs que le donateur voit (les autres sont techniques et cachés). */
const VISIBLE_FIELDS = new Set(["amount", "donorName", "email", "phone", "donorMessage", "consent", "isAnonymous"]);

function utm(value: string): string | null {
  return cleanLine(value).slice(0, 100) || null;
}


/** Ce que le widget KKiaPay reçoit (coordonnées seulement si le donateur les a données). */
function checkoutFor(
  config: KkiapayConfig,
  reference: string,
  amount: number,
  donation: { donorName?: string; email?: string; phone?: string; isAnonymous: boolean },
  campaignTitle: string | null,
): KkiapayCheckout {
  return {
    reference,
    amount,
    publicKey: config.publicKey,
    sandbox: config.mode === "sandbox",
    reason: campaignTitle ? `Don à INA-AFRICA — ${campaignTitle}`.slice(0, 120) : "Don à INA-AFRICA",
    name: donation.donorName || undefined,
    email: donation.email || undefined,
    phone: widgetPhone(donation.phone),
  };
}

export async function startOnlineDonation(_previous: FormState, formData: FormData): Promise<FormState> {
  const T = DONATE_TEXT.online;

  // 1. Aucun prestataire configuré : refus immédiat, rien n'est écrit.
  const config = getKkiapayConfig();
  if (!config) return { status: "unavailable", message: T.unavailable, respondedAt: Date.now() };

  const raw = readFields(formData, FIELDS);
  // Clé anti double-soumission absente (navigateur ancien, page restée ouverte…) :
  // le serveur en crée une plutôt que de refuser le don.
  if (!raw.idempotencyKey) raw.idempotencyKey = randomUUID();
  const values = echoValues(raw, ["isAnonymous", "consent"]);
  const settings = await getSiteSettings();
  const parsed = validate(donationSchema(settings.donationMinAmount), {
    ...raw,
    amount: pickDonationAmount(raw.amountChoice, raw.customAmount),
  });
  if (!parsed.ok) {
    // Erreur sur un champ visible : le donateur la voit sous le champ.
    if (Object.keys(parsed.fieldErrors).some((name) => VISIBLE_FIELDS.has(name))) return invalidState(parsed.fieldErrors, values);
    // Champ technique (caché) : jamais de « corrigez le champ indiqué » sans champ à corriger.
    console.warn("[ina-africa] don : champ technique invalide", Object.keys(parsed.fieldErrors).join(", "));
    return errorState(FORM_TEXT.errors.refreshed, values);
  }
  if (isHoneypotFilled(formData)) return errorState(FORM_TEXT.errors.rejected, values);

  const backend = getFormsBackend();
  if (!backend) return { status: "unavailable", message: T.unavailable, values, respondedAt: Date.now() };

  const donation = parsed.data;

  const result = await runAction(async (): Promise<KkiapayCheckout> => {
    assertFormToken(formData, FORM_KEYS.donation, backend);
    const ip = await readClientIp();
    const ipHash = hashIp(ip, backend.env.IP_HASH_SECRET);
    await enforceRateLimit(backend, "donations", ipHash, RATE_LIMITS.donations, T.rateLimited);
    await assertTurnstile(formData, backend, ip);

    // Appel aux dons : le client privilégié voit TOUT, on ne garde donc que les appels actifs.
    let campaignId: string | null = null;
    let campaignTitle: string | null = null;
    if (donation.campaign) {
      const { data: campaign } = await backend.db
        .from("donation_campaigns")
        .select("id, title")
        .eq("slug", donation.campaign)
        .eq("is_active", true)
        .maybeSingle<{ id: string; title: string }>();
      if (!campaign) throw new AppError("VALIDATION", T.campaignInactive);
      campaignId = campaign.id;
      campaignTitle = campaign.title;
    }

    // 2a. MODE TEST : aucune écriture, aucun faux don dans la base.
    if (config.mode === "sandbox") {
      return checkoutFor(config, `${TEST_REFERENCE_PREFIX}${generateMerchantReference()}`, donation.amount, donation, campaignTitle);
    }

    // 2b. MODE RÉEL. Double clic : la même clé renvoie vers le même paiement en attente.
    const { data: previous } = await backend.db
      .from("donations")
      .select("id, amount, payment_transactions(merchant_reference, status, created_at)")
      .eq("idempotency_key", donation.idempotencyKey)
      .maybeSingle<{
        id: string;
        amount: number | string;
        payment_transactions: { merchant_reference: string; status: string; created_at: string }[];
      }>();
    if (previous) {
      const pending = previous.payment_transactions
        .filter((tx) => tx.status === "pending")
        .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
      if (pending) return checkoutFor(config, pending.merchant_reference, Number(previous.amount), donation, campaignTitle);
      throw new AppError("CONFLICT", FORM_TEXT.errors.refreshed);
    }

    // Don et transaction EN ATTENTE uniquement.
    const { data: created, error: donationError } = await backend.db
      .from("donations")
      .insert({
        channel: "online",
        amount: donation.amount,
        currency: "XOF",
        campaign_id: campaignId,
        donor_name: donation.donorName ?? null,
        donor_email: donation.email ?? null,
        donor_phone: donation.phone ?? null,
        is_anonymous: donation.isAnonymous,
        donor_message: donation.donorMessage ?? null,
        consent_at: new Date().toISOString(),
        ip_hash: ipHash,
        idempotency_key: donation.idempotencyKey,
        utm_source: utm(raw.utm_source),
        utm_medium: utm(raw.utm_medium),
        utm_campaign: utm(raw.utm_campaign),
      })
      .select("id")
      .single<{ id: string }>();
    if (donationError || !created) {
      console.error("[ina-africa] création du don impossible", donationError?.code ?? "");
      throw donationError ? fromDatabaseError(donationError) : new AppError("INTERNAL", FORM_TEXT.errors.generic);
    }

    const merchantReference = generateMerchantReference();
    const { error: txError } = await backend.db.from("payment_transactions").insert({
      donation_id: created.id,
      provider: "kkiapay",
      merchant_reference: merchantReference,
      amount: donation.amount,
      currency: "XOF",
    });
    if (txError) {
      console.error("[ina-africa] création de la transaction impossible", txError.code ?? "");
      throw new AppError("INTERNAL", FORM_TEXT.errors.generic);
    }

    return checkoutFor(config, merchantReference, donation.amount, donation, campaignTitle);
  });

  if (!result.ok) return failureState(result.error, values);
  return { status: "checkout", checkout: result.data, values, respondedAt: Date.now() };
}

/**
 * Vérifie un paiement terminé dans la fenêtre KKiaPay. Le navigateur ne
 * fournit que deux identifiants : statut et montant sont relus chez KKiaPay.
 */
export async function checkOnlinePayment(reference: unknown, transactionId: unknown): Promise<PaymentCheckResult> {
  const T = DONATE_TEXT.checkout;
  const config = getKkiapayConfig();
  if (!config) return { status: "error", message: T.unavailable };
  if (typeof reference !== "string" || typeof transactionId !== "string" || !KKIAPAY_TRANSACTION_ID.test(transactionId)) {
    return { status: "error", message: T.checkFailed };
  }

  // Mode TEST : vérification seule, rien n'est enregistré.
  if (config.mode === "sandbox") {
    if (!reference.startsWith(TEST_REFERENCE_PREFIX)) return { status: "error", message: T.checkFailed };
    const verified = await verifyKkiapayTransaction(config, transactionId);
    if (verified.kind === "error") return { status: "error", message: T.checkFailed };
    if (verified.kind === "not_found") return { status: "pending" };
    if (verified.status === "succeeded") return { status: "test_succeeded", amount: verified.amount };
    if (verified.status === "failed") return { status: "failed", message: T.failed };
    return { status: "pending" };
  }

  if (!MERCHANT_REFERENCE.test(reference)) return { status: "error", message: T.checkFailed };
  const backend = getFormsBackend();
  if (!backend) return { status: "error", message: T.unavailable };

  // L'identifiant KKiaPay accompagne la page de suivi : chaque actualisation revérifie le paiement.
  const trackingUrl = `/faire-un-don/suivi?tx=${encodeURIComponent(reference)}&transaction_id=${encodeURIComponent(transactionId)}`;
  const outcome = await reconcileKkiapayPayment(backend, config, reference, transactionId);
  switch (outcome) {
    case "succeeded":
      return { status: "succeeded", trackingUrl };
    case "failed":
      return { status: "failed", message: T.failed };
    case "pending":
      return { status: "pending", trackingUrl };
    default:
      // Paiement peut-être réussi mais non vérifiable maintenant : la page de suivi et la notification prendront le relais.
      return { status: "pending", trackingUrl };
  }
}
