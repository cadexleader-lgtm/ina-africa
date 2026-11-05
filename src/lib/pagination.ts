/**
 * Pagination : adresses qui CONSERVENT les autres paramètres de recherche
 * (catégorie, recherche, domaine…) et fenêtre de numéros à afficher.
 */

export type SearchParamsRecord = Record<string, string | string[] | undefined>;

/** Adresse de la page `page` ; la page 1 n'a pas de paramètre (adresse canonique). */
export function pageHref(
  basePath: string,
  page: number,
  searchParams: SearchParamsRecord = {},
  paramName = "page",
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (key === paramName || value === undefined) continue;
    for (const item of Array.isArray(value) ? value : [value]) {
      if (item !== "") params.append(key, item);
    }
  }
  if (page > 1) params.set(paramName, String(page));
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

/**
 * Numéros à afficher autour de la page courante, avec des trous (`null`)
 * représentés par « … ». Ex. page 5 sur 12 → [1, null, 4, 5, 6, null, 12].
 */
export function pageWindow(page: number, pageCount: number, radius = 1): (number | null)[] {
  if (pageCount <= 1) return [1];
  const current = Math.min(Math.max(1, page), pageCount);
  const pages = new Set<number>([1, pageCount]);
  for (let p = current - radius; p <= current + radius; p++) {
    if (p >= 1 && p <= pageCount) pages.add(p);
  }
  const sorted = [...pages].sort((a, b) => a - b);
  const result: (number | null)[] = [];
  sorted.forEach((p, index) => {
    const previous = sorted[index - 1];
    if (previous !== undefined && p - previous === 2) result.push(previous + 1);
    else if (previous !== undefined && p - previous > 2) result.push(null);
    result.push(p);
  });
  return result;
}
