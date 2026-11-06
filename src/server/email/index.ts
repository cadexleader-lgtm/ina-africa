import "server-only";

import { getFormSecret, readServerEnv } from "@/server/security/forms-backend";

/**
 * Envoi d'emails par l'API Resend (simple appel HTTP, aucune dépendance).
 *  - Actif seulement si RESEND_API_KEY ET EMAIL_FROM sont configurés.
 *  - Emails en TEXTE BRUT uniquement : aucun HTML, donc aucune injection
 *    possible à partir d'une saisie de visiteur.
 *  - Un échec d'envoi est journalisé (sans donnée personnelle) et renvoie
 *    false : c'est à l'appelant de décider (une demande déjà enregistrée
 *    n'échoue pas pour autant).
 */

const RESEND_URL = "https://api.resend.com/emails";

export type EmailConfig = { apiKey: string; from: string; notificationEmails: string[] };

export function getEmailConfig(): EmailConfig | null {
  const env = readServerEnv();
  if (!env?.RESEND_API_KEY || !env.EMAIL_FROM) return null;
  return { apiKey: env.RESEND_API_KEY, from: env.EMAIL_FROM, notificationEmails: env.NOTIFICATION_EMAILS };
}

/** Vrai si l'envoi d'emails est configuré (condition d'affichage de la newsletter). */
export function isEmailConfigured(): boolean {
  return getEmailConfig() !== null;
}

/** Objet d'un email : une seule ligne (aucun retour à la ligne ni caractère de contrôle), 150 caractères au plus. */
export function safeSubject(subject: string): string {
  let out = "";
  for (const char of subject) {
    const code = char.codePointAt(0) ?? 0;
    out += code < 0x20 || code === 0x7f || code === 0x2028 || code === 0x2029 ? " " : char;
  }
  out = out.replace(/\s+/g, " ").trim();
  return out.length > 150 ? `${out.slice(0, 149)}…` : out;
}

export type PlainEmail = {
  to: string[];
  subject: string;
  text: string;
  /** Adresse de réponse (ex. l'email du visiteur pour une notification). */
  replyTo?: string;
  /** Évite un double envoi si la même requête est rejouée (en-tête Idempotency-Key de Resend). */
  idempotencyKey?: string;
};

export async function sendPlainEmail(email: PlainEmail, config = getEmailConfig()): Promise<boolean> {
  if (!config || email.to.length === 0) return false;
  try {
    const res = await fetch(RESEND_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
        ...(email.idempotencyKey ? { "Idempotency-Key": email.idempotencyKey } : {}),
      },
      body: JSON.stringify({
        from: config.from,
        to: email.to,
        subject: safeSubject(email.subject),
        text: email.text,
        ...(email.replyTo ? { reply_to: email.replyTo } : {}),
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      console.error("[ina-africa] envoi d'email refusé par Resend, statut", res.status);
      return false;
    }
    return true;
  } catch {
    console.error("[ina-africa] envoi d'email impossible (réseau ou délai dépassé)");
    return false;
  }
}

/**
 * La newsletter peut-elle être proposée ? Envoi d'emails ET enregistrement
 * (Supabase + secrets serveur) configurés : la double confirmation en dépend.
 */
export function isNewsletterAvailable(): boolean {
  return isEmailConfigured() && getFormSecret() !== null;
}
