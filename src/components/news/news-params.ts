import type { SearchParamsRecord } from "@/lib/pagination";

/**
 * Lecture des paramètres de l'adresse /actualites (?categorie=, ?q=, ?page=).
 * Tout ce qui ne respecte pas le format attendu est ignoré : jamais d'erreur
 * pour une adresse bricolée.
 */

/** Même règle que la base (private.is_valid_slug). */
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const SLUG_MAX = 120;
/** Longueur maximale d'une recherche (même limite que sanitizeSearch). */
export const SEARCH_MAX = 80;
/** Au-delà, la page demandée est forcément hors liste (évite les très grands nombres). */
const PAGE_MAX = 10_000;

export function isValidSlug(value: string | null | undefined): value is string {
  return typeof value === "string" && value.length <= SLUG_MAX && SLUG.test(value);
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export type NewsParams = {
  /** Adresse d'une catégorie (format valide ; son existence est vérifiée par la page). */
  category: string | undefined;
  /** Recherche saisie (espaces resserrés, longueur limitée) ; vide = pas de recherche. */
  q: string;
  page: number;
};

export function parseNewsParams(searchParams: SearchParamsRecord): NewsParams {
  const rawCategory = first(searchParams.categorie)?.trim().toLowerCase();
  const q = (first(searchParams.q) ?? "").replace(/\s+/g, " ").trim().slice(0, SEARCH_MAX);
  const rawPage = first(searchParams.page);
  const page = rawPage && /^\d{1,6}$/.test(rawPage) ? Math.min(Math.max(1, Number(rawPage)), PAGE_MAX) : 1;
  return { category: isValidSlug(rawCategory) ? rawCategory : undefined, q, page };
}

/**
 * Paramètres à CONSERVER dans les liens (pagination, filtres) : seulement les
 * valeurs reconnues, jamais le reste de l'adresse.
 */
export function newsQuery(params: { category?: string; q?: string; page?: number }): SearchParamsRecord {
  const query: SearchParamsRecord = {};
  if (params.category) query.categorie = params.category;
  if (params.q) query.q = params.q;
  if (params.page && params.page > 1) query.page = String(params.page);
  return query;
}

/** Adresse de la liste avec ces filtres (page 1 = sans paramètre « page »). */
export function newsHref(params: { category?: string; q?: string; page?: number }): string {
  const query = new URLSearchParams(newsQuery(params) as Record<string, string>).toString();
  return query ? `/actualites?${query}` : "/actualites";
}
