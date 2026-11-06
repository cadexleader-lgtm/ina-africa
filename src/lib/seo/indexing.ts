import type { Metadata } from "next";

/**
 * Indexation par les moteurs de recherche.
 *
 * Tant que la variable d'environnement SITE_INDEXABLE ne vaut pas EXACTEMENT
 * "true", le site est en construction : robots.txt interdit tout et chaque
 * page porte « noindex, nofollow ». La valeur est lue au moment de la
 * compilation pour les pages prérendues : la changer demande un nouveau build.
 */
export function isSiteIndexable(env: Record<string, string | undefined> = process.env): boolean {
  return env.SITE_INDEXABLE === "true";
}

/**
 * Balise robots d'une page.
 *  - site non indexable : `noindex, nofollow` (quoi qu'on demande) ;
 *  - `noindex: true` : page à ne pas indexer (résultats de recherche, liste
 *    vide, contenu pas encore rédigé) mais dont les liens peuvent être suivis ;
 *  - sinon : `index, follow`.
 */
export function pageRobots(
  { noindex = false }: { noindex?: boolean } = {},
  indexable: boolean = isSiteIndexable(),
): NonNullable<Metadata["robots"]> {
  if (!indexable) return { index: false, follow: false };
  if (noindex) return { index: false, follow: true };
  return { index: true, follow: true };
}
