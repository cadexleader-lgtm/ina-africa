import "server-only";

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Jetons aléatoires (liens de la newsletter, références de paiement).
 * Seule l'EMPREINTE d'un jeton de lien est stockée : une fuite de la base ne
 * permet ni de confirmer ni de désinscrire quelqu'un.
 */

/** Jeton de lien : 32 octets aléatoires → 43 caractères base64url. */
export function generateLinkToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Empreinte SHA-256 (hexadécimal, 64 caractères) d'un jeton de lien. */
export function hashLinkToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

/** Compare deux empreintes hexadécimales en temps constant. */
export function sameHash(a: string, b: string): boolean {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");
  return left.length === right.length && timingSafeEqual(left, right);
}

/**
 * Notre référence de paiement (merchant_reference), envoyée au prestataire et
 * présente dans l'adresse de la page de suivi : 24 octets aléatoires →
 * 32 caractères base64url, impossible à deviner.
 */
export function generateMerchantReference(): string {
  return randomBytes(24).toString("base64url");
}
