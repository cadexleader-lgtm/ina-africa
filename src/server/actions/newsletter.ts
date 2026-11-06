"use server";

import { FORM_KEYS } from "@/components/forms/ids";
import { FORM_TEXT } from "@/content/fr/forms";
import { absoluteUrl } from "@/lib/site-url";
import {
  cleanLine,
  echoValues,
  NEWSLETTER_TOKEN,
  newsletterSchema,
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
  stateFromResult,
  unavailableState,
} from "@/server/actions/public-form";
import { getEmailConfig, sendPlainEmail } from "@/server/email";
import { newsletterConfirmationEmail } from "@/server/email/templates";
import { AppError, runAction } from "@/server/errors";
import { issueFormToken } from "@/server/security/form-token";
import { getFormsBackend, getFormSecret, type FormsBackend } from "@/server/security/forms-backend";
import { hashIp } from "@/server/security/ip";
import { enforceRateLimit, RATE_LIMITS } from "@/server/security/rate-limit";
import { generateLinkToken, hashLinkToken } from "@/server/security/tokens";

/*
 * Lettre d'information avec DOUBLE CONFIRMATION :
 *  1. inscription → jetons aléatoires, seules leurs EMPREINTES sont stockées,
 *     email de confirmation avec un lien absolu ;
 *  2. la réponse est la même que l'adresse soit nouvelle ou déjà inscrite
 *     (aucune information sur les inscrits ne fuit) ;
 *  3. les pages /newsletter/confirmer et /newsletter/desinscription n'agissent
 *     qu'au clic sur leur bouton (les filtres de messagerie ouvrent les liens).
 */

const T = FORM_TEXT.newsletter;

/** Durée de validité d'un lien de confirmation. */
const CONFIRMATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
/** Pas plus d'un email de confirmation par adresse et par période. */
const RESEND_COOLDOWN_MS = 10 * 60 * 1000;

const FORM_KEY = FORM_KEYS.newsletter;

/** Newsletter utilisable : base configurée ET envoi d'emails configuré. */
function getNewsletterBackend(): FormsBackend | null {
  return getEmailConfig() ? getFormsBackend() : null;
}

/**
 * Horodatage signé pour le formulaire du pied de page (présent sur toutes les
 * pages, qui restent statiques) : demandé par le navigateur quand le visiteur
 * commence à remplir le champ. Ne donne accès à rien d'autre.
 */
export async function requestNewsletterToken(): Promise<string | null> {
  const secret = getFormSecret();
  return secret && getEmailConfig() ? issueFormToken(FORM_KEY, secret) : null;
}

type Subscriber = { id: string; status: "pending" | "subscribed" | "unsubscribed"; confirmation_sent_at: string | null };

async function sendConfirmation(confirmToken: string, unsubscribeToken: string, email: string): Promise<boolean> {
  const { subject, text } = newsletterConfirmationEmail({
    confirmUrl: absoluteUrl(`/newsletter/confirmer?token=${confirmToken}`),
    unsubscribeUrl: absoluteUrl(`/newsletter/desinscription?token=${unsubscribeToken}`),
  });
  return sendPlainEmail({ to: [email], subject, text });
}

export async function subscribeNewsletter(_previous: FormState, formData: FormData): Promise<FormState> {
  const raw = readFields(formData, ["email", "consent", "source"]);
  const values = echoValues({ email: raw.email, consent: raw.consent }, ["consent"]);

  const parsed = validate(newsletterSchema, raw);
  if (!parsed.ok) return invalidState(parsed.fieldErrors, values);
  if (isHoneypotFilled(formData)) return errorState(FORM_TEXT.errors.rejected, values);

  const backend = getNewsletterBackend();
  if (!backend) return unavailableState(values);

  const { email, source } = parsed.data;

  const result = await runAction(async () => {
    // Formulaire du pied de page sans JavaScript : pas d'horodatage → page dédiée.
    assertFormToken(formData, FORM_KEY, backend, { missingMessage: source === "footer" ? T.noJs : undefined });

    const ip = await readClientIp();
    const ipHash = hashIp(ip, backend.env.IP_HASH_SECRET);
    await enforceRateLimit(
      backend,
      "newsletter_subscribers",
      ipHash,
      RATE_LIMITS.newsletter,
      FORM_TEXT.errors.rateLimited,
      "confirmation_sent_at",
    );
    await assertTurnstile(formData, backend, ip);

    const { data: existing, error: readError } = await backend.db
      .from("newsletter_subscribers")
      .select("id, status, confirmation_sent_at")
      .eq("email", email)
      .maybeSingle<Subscriber>();
    if (readError) {
      console.error("[ina-africa] lecture newsletter impossible", readError.code ?? "");
      throw new AppError("INTERNAL", FORM_TEXT.errors.generic);
    }

    // Déjà inscrit : rien à faire, même réponse qu'une nouvelle inscription.
    if (existing?.status === "subscribed") return { message: T.success };

    // Email de confirmation envoyé il y a peu : pas de nouvel envoi (protège la boîte de la personne).
    const lastSent = existing?.confirmation_sent_at ? Date.parse(existing.confirmation_sent_at) : 0;
    if (existing?.status === "pending" && Date.now() - lastSent < RESEND_COOLDOWN_MS) return { message: T.success };

    const confirmToken = generateLinkToken();
    const unsubscribeToken = generateLinkToken();
    const sentAt = new Date().toISOString();
    const fields = {
      status: "pending" as const,
      consent_at: sentAt,
      confirmation_token_hash: hashLinkToken(confirmToken),
      confirmation_sent_at: sentAt,
      unsubscribe_token_hash: hashLinkToken(unsubscribeToken),
      source,
      ip_hash: ipHash,
    };

    const write = existing
      ? await backend.db.from("newsletter_subscribers").update(fields).eq("id", existing.id)
      : await backend.db.from("newsletter_subscribers").insert({ email, ...fields });
    if (write.error) {
      // Deux inscriptions simultanées de la même adresse : la première suffit.
      if (write.error.code === "23505") return { message: T.success };
      console.error("[ina-africa] inscription newsletter impossible", write.error.code ?? "");
      throw new AppError("INTERNAL", FORM_TEXT.errors.generic);
    }

    if (!(await sendConfirmation(confirmToken, unsubscribeToken, email))) {
      // Rien n'est parti : on libère le délai d'attente pour permettre un nouvel essai.
      await backend.db.from("newsletter_subscribers").update({ confirmation_sent_at: null }).eq("email", email);
      throw new AppError("INTERNAL", T.sendFailed);
    }
    return { message: T.success };
  });

  return stateFromResult(result, values);
}

function readLinkToken(formData: FormData): string | null {
  const token = cleanLine(formData.get("token"));
  return NEWSLETTER_TOKEN.test(token) ? token : null;
}

/** Confirmation (bouton de /newsletter/confirmer) : compare l'empreinte du jeton reçu. */
export async function confirmNewsletter(_previous: FormState, formData: FormData): Promise<FormState> {
  const token = readLinkToken(formData);
  if (!token) return errorState(T.confirmInvalid);
  const backend = getFormsBackend();
  if (!backend) return unavailableState();

  const result = await runAction(async () => {
    const tokenHash = hashLinkToken(token);
    const { data, error } = await backend.db
      .from("newsletter_subscribers")
      .select("id, status, confirmation_sent_at")
      .eq("confirmation_token_hash", tokenHash)
      .maybeSingle<Subscriber>();
    if (error) throw new AppError("INTERNAL", FORM_TEXT.errors.generic);
    if (!data || data.status !== "pending") throw new AppError("NOT_FOUND", T.confirmInvalid);

    const sentAt = data.confirmation_sent_at ? Date.parse(data.confirmation_sent_at) : 0;
    if (Date.now() - sentAt > CONFIRMATION_TTL_MS) throw new AppError("VALIDATION", T.confirmExpired);

    const { error: updateError } = await backend.db
      .from("newsletter_subscribers")
      .update({ status: "subscribed", confirmed_at: new Date().toISOString(), confirmation_token_hash: null })
      .eq("id", data.id)
      .eq("confirmation_token_hash", tokenHash)
      .eq("status", "pending");
    if (updateError) {
      console.error("[ina-africa] confirmation newsletter impossible", updateError.code ?? "");
      throw new AppError("INTERNAL", FORM_TEXT.errors.generic);
    }
    return { message: T.confirmSuccess };
  });
  return stateFromResult(result, {});
}

/** Désinscription (bouton de /newsletter/desinscription). Idempotente. */
export async function unsubscribeNewsletter(_previous: FormState, formData: FormData): Promise<FormState> {
  const token = readLinkToken(formData);
  if (!token) return errorState(T.unsubscribeInvalid);
  const backend = getFormsBackend();
  if (!backend) return unavailableState();

  const result = await runAction(async () => {
    const tokenHash = hashLinkToken(token);
    const { data, error } = await backend.db
      .from("newsletter_subscribers")
      .select("id, status, confirmation_sent_at")
      .eq("unsubscribe_token_hash", tokenHash)
      .maybeSingle<Subscriber>();
    if (error) throw new AppError("INTERNAL", FORM_TEXT.errors.generic);
    if (!data) throw new AppError("NOT_FOUND", T.unsubscribeInvalid);
    if (data.status === "unsubscribed") return { message: T.unsubscribeSuccess };

    const { error: updateError } = await backend.db
      .from("newsletter_subscribers")
      .update({ status: "unsubscribed", unsubscribed_at: new Date().toISOString(), confirmation_token_hash: null })
      .eq("id", data.id)
      .eq("unsubscribe_token_hash", tokenHash);
    if (updateError) {
      console.error("[ina-africa] désinscription newsletter impossible", updateError.code ?? "");
      throw new AppError("INTERNAL", FORM_TEXT.errors.generic);
    }
    return { message: T.unsubscribeSuccess };
  });
  return stateFromResult(result, {});
}
