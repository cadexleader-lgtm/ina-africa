import "server-only";

import { createHmac } from "node:crypto";

/**
 * Adresse IP du visiteur, UNIQUEMENT pour calculer une empreinte (limite
 * d'envois). L'adresse n'est jamais stockée ni journalisée en clair.
 *
 * Ordre de lecture : cf-connecting-ip (Cloudflare), puis la 1re valeur de
 * x-forwarded-for, puis x-real-ip. Une valeur qui ne ressemble pas à une
 * adresse IP est ignorée.
 */
export function clientIpFrom(headers: Pick<Headers, "get">): string | null {
  const candidates = [
    headers.get("cf-connecting-ip"),
    headers.get("x-forwarded-for")?.split(",")[0],
    headers.get("x-real-ip"),
  ];
  for (const candidate of candidates) {
    const value = candidate?.trim().toLowerCase();
    if (value && isPlausibleIp(value)) return value;
  }
  return null;
}

function isPlausibleIp(value: string): boolean {
  if (value.length > 45) return false;
  // IPv4 (a.b.c.d) ou IPv6 (hexadécimal et « : », éventuellement IPv4 à la fin).
  return /^(\d{1,3}\.){3}\d{1,3}$/.test(value) || (/^[0-9a-f:.]+$/.test(value) && value.includes(":"));
}

/**
 * Empreinte d'IP : HMAC-SHA256(IP, IP_HASH_SECRET), en hexadécimal (64 caractères).
 * Sans le secret, impossible de retrouver l'adresse (même en essayant toutes
 * les adresses IPv4). Les visiteurs sans adresse lisible partagent une même
 * empreinte : la limite d'envois s'applique quand même.
 */
export function hashIp(ip: string | null, secret: string): string {
  return createHmac("sha256", secret).update(`ina-africa:ip:${ip ?? "inconnue"}`).digest("hex");
}
