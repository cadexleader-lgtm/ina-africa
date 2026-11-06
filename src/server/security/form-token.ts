import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Horodatage SIGNÉ d'un formulaire (anti-robot) : le serveur le pose dans un
 * champ caché au moment où il affiche le formulaire. À l'envoi :
 *  - moins de 3 secondes : refus (un robot remplit tout instantanément) ;
 *  - plus de 2 heures : refus (jeton périmé, la page est rechargée) ;
 *  - signature fausse ou jeton d'un autre formulaire : refus.
 * Signature : HMAC-SHA256 avec IP_HASH_SECRET (jamais envoyé au navigateur).
 */

export const MIN_FILL_MS = 3_000;
export const MAX_TOKEN_AGE_MS = 2 * 60 * 60 * 1000;
/** Tolérance d'horloge entre serveurs. */
const CLOCK_SKEW_MS = 60_000;

export type FormTokenCheck = "ok" | "missing" | "invalid" | "too_fast" | "expired";

function sign(formKey: string, issuedAt: number, secret: string): string {
  return createHmac("sha256", secret).update(`ina-africa:form:${formKey}:${issuedAt}`).digest("base64url");
}

/** Jeton « <horodatage en base 36>.<signature> » pour le formulaire `formKey`. */
export function issueFormToken(formKey: string, secret: string, now = Date.now()): string {
  return `${now.toString(36)}.${sign(formKey, now, secret)}`;
}

export function checkFormToken(token: unknown, formKey: string, secret: string, now = Date.now()): FormTokenCheck {
  if (typeof token !== "string" || token.length === 0) return "missing";
  if (token.length > 120) return "invalid";

  const match = /^([0-9a-z]{1,12})\.([A-Za-z0-9_-]{43})$/.exec(token);
  if (!match) return "invalid";

  const issuedAt = parseInt(match[1], 36);
  if (!Number.isSafeInteger(issuedAt)) return "invalid";

  const expected = Buffer.from(sign(formKey, issuedAt, secret));
  const received = Buffer.from(match[2]);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return "invalid";

  const age = now - issuedAt;
  if (age < -CLOCK_SKEW_MS) return "invalid";
  if (age < MIN_FILL_MS) return "too_fast";
  if (age > MAX_TOKEN_AGE_MS) return "expired";
  return "ok";
}
