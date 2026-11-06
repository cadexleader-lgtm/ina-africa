import "server-only";

import { AppError } from "@/server/errors";
import type { FormsBackend } from "@/server/security/forms-backend";

/**
 * Limite d'envois par empreinte d'IP : on compte les lignes de la dernière
 * heure portant la même empreinte (client privilégié, aucune table dédiée).
 */
export const RATE_LIMITS = {
  /** Demandes (contact, bénévole, adhésion, partenariat) : 5 par heure. */
  requests: 5,
  /** Inscriptions à la newsletter (emails de confirmation) : 3 par heure. */
  newsletter: 3,
  /** Tentatives de don en ligne : 5 par heure. */
  donations: 5,
} as const;

const WINDOW_MS = 60 * 60 * 1000;

type CountedTable = "contact_requests" | "newsletter_subscribers" | "donations";

/** Nombre de lignes de la dernière heure pour cette empreinte. */
export async function countRecent(
  backend: FormsBackend,
  table: CountedTable,
  ipHash: string,
  column: "created_at" | "confirmation_sent_at" = "created_at",
  now = Date.now(),
): Promise<number> {
  const since = new Date(now - WINDOW_MS).toISOString();
  const { count, error } = await backend.db
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte(column, since);
  if (error) {
    console.error(`[ina-africa] comptage des envois impossible (${table})`, error.code ?? "");
    throw new AppError("INTERNAL", "Une erreur est survenue. Réessayez dans un instant.");
  }
  return count ?? 0;
}

/** Lève RATE_LIMITED si la limite est atteinte. */
export async function enforceRateLimit(
  backend: FormsBackend,
  table: CountedTable,
  ipHash: string,
  limit: number,
  message: string,
  column: "created_at" | "confirmation_sent_at" = "created_at",
): Promise<void> {
  if ((await countRecent(backend, table, ipHash, column)) >= limit) {
    throw new AppError("RATE_LIMITED", message);
  }
}
