import "server-only";

import { getTurnstileSiteKey } from "@/lib/public-env";
import type { ServerEnv } from "@/server/env";

/**
 * Cloudflare Turnstile (anti-robot), FACULTATIF : appliqué seulement si la
 * clé publique (NEXT_PUBLIC_TURNSTILE_SITE_KEY) ET la clé secrète
 * (TURNSTILE_SECRET_KEY) sont configurées. Sinon, ignoré sans erreur.
 * Vérifié côté serveur auprès de Cloudflare : la réponse du navigateur seule
 * ne prouve rien.
 */
const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export function isTurnstileEnabled(env: Pick<ServerEnv, "TURNSTILE_SECRET_KEY">): boolean {
  return Boolean(env.TURNSTILE_SECRET_KEY && getTurnstileSiteKey());
}

/** Vrai seulement si Cloudflare confirme la réponse. En cas de doute (réseau, format), refuse. */
export async function verifyTurnstile(response: unknown, secret: string, ip: string | null): Promise<boolean> {
  if (typeof response !== "string" || response.length === 0 || response.length > 2048) return false;
  try {
    const body = new URLSearchParams({ secret, response });
    if (ip) body.set("remoteip", ip);
    const res = await fetch(SITEVERIFY_URL, {
      method: "POST",
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { success?: unknown };
    return data.success === true;
  } catch {
    console.error("[ina-africa] vérification anti-robot impossible (réseau)");
    return false;
  }
}
