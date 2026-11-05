import "server-only";

import { hasPublicSupabaseEnv } from "@/lib/public-env";
import type { ImageRef, Paginated } from "@/lib/types/content";
import { createPublicClient } from "@/server/supabase/public";

/**
 * Accès en LECTURE aux contenus publics, en tant que visiteur anonyme : les
 * règles RLS ne laissent voir que ce qui est publié ou actif.
 *
 * Tant que Supabase n'est pas configuré, renvoie null : les fonctions de
 * lecture renvoient alors des listes vides et les pages affichent leurs
 * états vides (jamais de faux contenu).
 */
export function getReader() {
  return hasPublicSupabaseEnv() ? createPublicClient() : null;
}

/** Journalise une erreur de lecture sans détail sensible ; la page affiche son état vide. */
export function logReadError(what: string, error: { code?: string; message?: string } | null | undefined) {
  if (error) {
    console.error(`[ina-africa] lecture publique impossible (${what})`, error.code ?? "", error.message ?? "");
  }
}

export function toImage(path: string | null | undefined, alt: string | null | undefined, fallbackAlt = ""): ImageRef | null {
  return path ? { path, alt: alt ?? fallbackAlt } : null;
}

export function pageRange(page: number, pageSize: number) {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const from = (safePage - 1) * pageSize;
  return { page: safePage, from, to: from + pageSize - 1 };
}

export function paginated<T>(items: T[], total: number, page: number, pageSize: number): Paginated<T> {
  return { items, total, page, pageSize, pageCount: Math.max(1, Math.ceil(total / pageSize)) };
}

export function emptyPage<T>(pageSize: number): Paginated<T> {
  return paginated<T>([], 0, 1, pageSize);
}
