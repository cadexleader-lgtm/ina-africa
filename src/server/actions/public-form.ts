import "server-only";

import { refresh } from "next/cache";
import { headers } from "next/headers";
import { after } from "next/server";
import type { z } from "zod";

import { FORM_TEXT } from "@/content/fr/forms";
import {
  echoValues,
  readFields,
  SPAM_FIELDS,
  validate,
  type FormState,
  type FormValues,
} from "@/lib/validation/forms";
import { getEmailConfig, sendPlainEmail } from "@/server/email";
import { requestNotificationEmail, type RequestNotification, type RequestType } from "@/server/email/templates";
import { AppError, fromDatabaseError, runAction, type ActionError, type ActionResult } from "@/server/errors";
import { checkFormToken } from "@/server/security/form-token";
import { getFormsBackend, type FormsBackend } from "@/server/security/forms-backend";
import { clientIpFrom, hashIp } from "@/server/security/ip";
import { enforceRateLimit, RATE_LIMITS } from "@/server/security/rate-limit";
import { isTurnstileEnabled, verifyTurnstile } from "@/server/security/turnstile";

/*
 * Outils communs aux actions des formulaires publics. Ordre des contrôles :
 *   1. validation Zod (erreurs sous chaque champ) ;
 *   2. champ piège ;
 *   3. service configuré ? sinon réponse honnête « pas encore disponible » ;
 *   4. horodatage signé (3 s minimum, 2 h maximum) ;
 *   5. limite d'envois par empreinte d'IP ;
 *   6. Cloudflare Turnstile (si configuré) ;
 *   7. écriture (client privilégié) ;
 *   8. notification par email, APRÈS la réponse (un échec ne fait pas échouer la demande).
 */

// ---------------------------------------------------------------------------
// États renvoyés au formulaire
// ---------------------------------------------------------------------------

function now(): number {
  return Date.now();
}

export function invalidState(fieldErrors: Record<string, string>, values: FormValues): FormState {
  return {
    status: "error",
    message: FORM_TEXT.common.fixErrors(Object.keys(fieldErrors).length),
    fieldErrors,
    values,
    respondedAt: now(),
  };
}

export function errorState(message: string, values?: FormValues): FormState {
  return { status: "error", message, values, respondedAt: now() };
}

/** Service non configuré : RIEN n'a été enregistré, et on le dit. */
export function unavailableState(values?: FormValues): FormState {
  return { status: "unavailable", message: FORM_TEXT.errors.unavailable, values, respondedAt: now() };
}

export function successState(message: string): FormState {
  return { status: "success", message, respondedAt: now() };
}

/** Erreur d'une action (runAction) → état du formulaire (premier message de chaque champ). */
export function failureState(error: ActionError, values: FormValues): FormState {
  const fieldErrors = error.fieldErrors
    ? Object.fromEntries(Object.entries(error.fieldErrors).map(([name, messages]) => [name, messages[0] ?? ""]))
    : undefined;
  return { status: "error", message: error.message, fieldErrors, values, respondedAt: now() };
}

/** Résultat d'une action (runAction) → état du formulaire. */
export function stateFromResult(result: ActionResult<{ message: string }>, values: FormValues): FormState {
  return result.ok ? successState(result.data.message) : failureState(result.error, values);
}

// ---------------------------------------------------------------------------
// Contrôles anti-spam
// ---------------------------------------------------------------------------

export function isHoneypotFilled(formData: FormData): boolean {
  const value = formData.get(SPAM_FIELDS.honeypot);
  return typeof value === "string" && value.trim().length > 0;
}

export async function readClientIp(): Promise<string | null> {
  return clientIpFrom(await headers());
}

/**
 * Horodatage signé. Jeton trop récent : on demande de patienter. Jeton
 * absent, faux ou périmé : la page est réaffichée avec un nouveau jeton
 * (refresh) et la saisie est conservée.
 */
export function assertFormToken(
  formData: FormData,
  formKey: string,
  backend: FormsBackend,
  options: { missingMessage?: string } = {},
): void {
  const check = checkFormToken(formData.get(SPAM_FIELDS.token), formKey, backend.env.IP_HASH_SECRET);
  if (check === "ok") return;
  if (check === "too_fast") throw new AppError("VALIDATION", FORM_TEXT.errors.tooFast);
  if (check === "missing" && options.missingMessage) throw new AppError("VALIDATION", options.missingMessage);
  refresh();
  throw new AppError("VALIDATION", FORM_TEXT.errors.refreshed);
}

/** Cloudflare Turnstile, seulement si les deux clés sont configurées. */
export async function assertTurnstile(formData: FormData, backend: FormsBackend, ip: string | null): Promise<void> {
  if (!isTurnstileEnabled(backend.env) || !backend.env.TURNSTILE_SECRET_KEY) return;
  const ok = await verifyTurnstile(formData.get(SPAM_FIELDS.turnstile), backend.env.TURNSTILE_SECRET_KEY, ip);
  if (!ok) throw new AppError("VALIDATION", FORM_TEXT.errors.turnstile);
}

// ---------------------------------------------------------------------------
// Demandes (table contact_requests)
// ---------------------------------------------------------------------------

/** Ligne à insérer dans contact_requests (hors consentement et empreinte, ajoutés ici). */
export type RequestRow = {
  request_type: RequestType;
  full_name: string;
  email: string | null;
  phone: string | null;
  organization?: string | null;
  subject?: string | null;
  message?: string | null;
  /** Champs propres au type de demande (seulement ceux renseignés). */
  details: Record<string, string>;
};

export type RequestFormConfig<S extends z.ZodType> = {
  /** Clé du formulaire, signée dans l'horodatage (un jeton ne sert qu'à SON formulaire). */
  formKey: string;
  fields: readonly string[];
  schema: S;
  toRow: (data: z.output<S>) => RequestRow;
  /** Libellés des champs de `details`, pour l'email de notification. */
  detailLabels: Record<string, string>;
  /** Libellés des valeurs codées de `details` (ex. kind: partnership → « Partenariat »). */
  detailValueLabels?: Record<string, Record<string, string>>;
  successMessage: string;
};

/** Retire les valeurs vides d'un objet `details`. */
export function compactDetails(details: Record<string, string | undefined | null>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(details).filter((entry): entry is [string, string] => typeof entry[1] === "string" && entry[1] !== ""),
  );
}

function scheduleNotification(
  row: RequestRow,
  labels: Record<string, string>,
  valueLabels: Record<string, Record<string, string>>,
  receivedAt: Date,
) {
  after(async () => {
    const config = getEmailConfig();
    if (!config || config.notificationEmails.length === 0) return;
    const notification: RequestNotification = {
      type: row.request_type,
      fullName: row.full_name,
      email: row.email,
      phone: row.phone,
      organization: row.organization ?? null,
      subject: row.subject ?? null,
      message: row.message ?? null,
      details: Object.entries(row.details).map(([key, value]) => [labels[key] ?? key, valueLabels[key]?.[value] ?? value]),
      receivedAt,
    };
    const { subject, text } = requestNotificationEmail(notification);
    await sendPlainEmail({ to: config.notificationEmails, subject, text, replyTo: row.email ?? undefined }, config);
  });
}

/** Traite un formulaire de demande de bout en bout (voir l'ordre des contrôles en tête de fichier). */
export async function handleRequestForm<S extends z.ZodType>(formData: FormData, config: RequestFormConfig<S>): Promise<FormState> {
  const raw = readFields(formData, config.fields);
  const values = echoValues(raw, ["consent"]);

  const parsed = validate(config.schema, raw);
  if (!parsed.ok) return invalidState(parsed.fieldErrors, values);

  if (isHoneypotFilled(formData)) return errorState(FORM_TEXT.errors.rejected, values);

  const backend = getFormsBackend();
  if (!backend) return unavailableState(values);

  const result = await runAction(async () => {
    assertFormToken(formData, config.formKey, backend);

    const ip = await readClientIp();
    const ipHash = hashIp(ip, backend.env.IP_HASH_SECRET);
    await enforceRateLimit(backend, "contact_requests", ipHash, RATE_LIMITS.requests, FORM_TEXT.errors.rateLimited);
    await assertTurnstile(formData, backend, ip);

    const row = config.toRow(parsed.data);
    const receivedAt = new Date();
    const { error } = await backend.db.from("contact_requests").insert({
      ...row,
      consent_at: receivedAt.toISOString(),
      ip_hash: ipHash,
    });
    if (error) {
      // Seul le code est journalisé : le détail d'une erreur Postgres peut contenir la saisie.
      console.error("[ina-africa] enregistrement d'une demande impossible", error.code ?? "");
      throw fromDatabaseError(error);
    }

    scheduleNotification(row, config.detailLabels, config.detailValueLabels ?? {}, receivedAt);
    return { message: config.successMessage };
  });

  return stateFromResult(result, values);
}
