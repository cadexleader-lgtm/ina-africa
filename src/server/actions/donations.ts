"use server";

import { redirect } from "next/navigation";

import { FORM_KEYS } from "@/components/forms/ids";
import { DONATE_TEXT, FORM_TEXT } from "@/content/fr/forms";
import { absoluteUrl } from "@/lib/site-url";
import {
  cleanLine,
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
import { getActiveProvider } from "@/server/payments/provider";
import { getFormsBackend } from "@/server/security/forms-backend";
import { hashIp } from "@/server/security/ip";
import { enforceRateLimit, RATE_LIMITS } from "@/server/security/rate-limit";
import { generateMerchantReference } from "@/server/security/tokens";

/*
 * Don EN LIGNE — inactif tant qu'aucun prestataire réel n'est configuré
 * (getActiveProvider() renvoie null jusqu'à la Phase 4).
 *
 * Ce que fait cette action, et SEULEMENT cela :
 *  1. refuse AVANT toute écriture s'il n'y a pas de prestataire ;
 *  2. crée un don `pending` et une transaction `pending` (référence aléatoire) ;
 *  3. demande le paiement au prestataire et redirige vers sa page.
 * Elle ne marque JAMAIS un don comme payé : seule la fonction SQL
 * confirm_payment_transaction(), appelée après vérification auprès du
 * prestataire (Phase 4), le fait.
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

function utm(value: string): string | null {
  return cleanLine(value).slice(0, 100) || null;
}

export async function startOnlineDonation(_previous: FormState, formData: FormData): Promise<FormState> {
  const T = DONATE_TEXT.online;

  // 1. Aucun prestataire réel : refus immédiat, rien n'est écrit.
  const provider = getActiveProvider();
  if (!provider) return { status: "unavailable", message: T.unavailable, respondedAt: Date.now() };

  const raw = readFields(formData, FIELDS);
  const values = echoValues(raw, ["isAnonymous", "consent"]);
  const settings = await getSiteSettings();
  const parsed = validate(donationSchema(settings.donationMinAmount), {
    ...raw,
    amount: pickDonationAmount(raw.amountChoice, raw.customAmount),
  });
  if (!parsed.ok) return invalidState(parsed.fieldErrors, values);
  if (isHoneypotFilled(formData)) return errorState(FORM_TEXT.errors.rejected, values);

  const backend = getFormsBackend();
  if (!backend) return { status: "unavailable", message: T.unavailable, values, respondedAt: Date.now() };

  const donation = parsed.data;

  const result = await runAction(async () => {
    assertFormToken(formData, FORM_KEYS.donation, backend);
    const ip = await readClientIp();
    const ipHash = hashIp(ip, backend.env.IP_HASH_SECRET);
    await enforceRateLimit(backend, "donations", ipHash, RATE_LIMITS.donations, T.rateLimited);
    await assertTurnstile(formData, backend, ip);

    // Double clic : la même clé renvoie vers le même paiement.
    const { data: previous } = await backend.db
      .from("donations")
      .select("id, payment_transactions(payment_url, status, created_at)")
      .eq("idempotency_key", donation.idempotencyKey)
      .maybeSingle<{ id: string; payment_transactions: { payment_url: string | null; status: string; created_at: string }[] }>();
    if (previous) {
      const pending = previous.payment_transactions
        .filter((tx) => tx.status === "pending" && tx.payment_url)
        .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
      if (pending?.payment_url) return { paymentUrl: pending.payment_url };
      throw new AppError("CONFLICT", FORM_TEXT.errors.refreshed);
    }

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

    // 2. Don et transaction EN ATTENTE uniquement.
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
    const { data: transaction, error: txError } = await backend.db
      .from("payment_transactions")
      .insert({
        donation_id: created.id,
        provider: provider.id,
        merchant_reference: merchantReference,
        amount: donation.amount,
        currency: "XOF",
      })
      .select("id")
      .single<{ id: string }>();
    if (txError || !transaction) {
      console.error("[ina-africa] création de la transaction impossible", txError?.code ?? "");
      throw new AppError("INTERNAL", FORM_TEXT.errors.generic);
    }

    // 3. Demande de paiement au prestataire. En cas d'échec, la tentative est close (jamais « payée »).
    const closeAttempt = async (reason: string) => {
      await backend.db.rpc("fail_payment_transaction", {
        p_transaction_id: transaction.id,
        p_status: "failed",
        p_reason: reason,
      });
    };

    let paymentUrl: string;
    let providerTransactionId: string | undefined;
    try {
      const payment = await provider.createPayment({
        merchantReference,
        amount: donation.amount,
        currency: "XOF",
        description: campaignTitle ? `Don à INA-AFRICA — ${campaignTitle}` : "Don à INA-AFRICA",
        returnUrl: absoluteUrl(`/faire-un-don/suivi?tx=${merchantReference}`),
        // Route des notifications du prestataire : écrite en Phase 4 avec l'adaptateur.
        notifyUrl: absoluteUrl("/api/paiements/notification"),
        customer: {
          name: donation.isAnonymous ? undefined : donation.donorName,
          email: donation.email,
          phone: donation.phone,
        },
      });
      paymentUrl = new URL(payment.paymentUrl).toString();
      if (!paymentUrl.startsWith("https://")) throw new Error("adresse de paiement non sécurisée");
      providerTransactionId = payment.providerTransactionId;
    } catch {
      console.error("[ina-africa] le prestataire de paiement n'a pas créé le paiement");
      await closeAttempt("Création du paiement refusée ou impossible chez le prestataire.");
      throw new AppError("PAYMENT_PROVIDER", T.providerFailed);
    }

    const { error: updateError } = await backend.db
      .from("payment_transactions")
      .update({ payment_url: paymentUrl, ...(providerTransactionId ? { provider_transaction_id: providerTransactionId } : {}) })
      .eq("id", transaction.id)
      .eq("status", "pending");
    if (updateError) {
      console.error("[ina-africa] enregistrement de l'adresse de paiement impossible", updateError.code ?? "");
      await closeAttempt("Adresse de paiement non enregistrée.");
      throw new AppError("INTERNAL", FORM_TEXT.errors.generic);
    }

    return { paymentUrl };
  });

  if (!result.ok) return failureState(result.error, values);
  // Hors de runAction : redirect() interrompt l'action par une exception prévue par Next.js.
  redirect(result.data.paymentUrl);
}
