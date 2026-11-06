/**
 * Aides de texte pour le référencement : description courte, temps de lecture.
 */

/** Espaces et retours à la ligne ramenés à une espace simple. */
export function collapseWhitespace(text: string | null | undefined): string {
  return (text ?? "").replace(/\s+/g, " ").trim();
}

/**
 * Texte nettoyé, coupé sur un mot (jamais au milieu) avec « … » s'il dépasse
 * `max` caractères (« … » compris).
 */
export function truncateWords(text: string | null | undefined, max: number): string {
  const clean = collapseWhitespace(text);
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  const base = lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut;
  return `${base.replace(/[\s,;:.!?…-]+$/u, "")}…`;
}

/** Description pour Google et les aperçus de partage : 160 caractères au plus (longueur affichée par Google). */
export function metaDescription(text: string | null | undefined, max = 160): string {
  return truncateWords(text, max);
}

/** Nombre de mots d'un texte (les nombres et les mots composés comptent pour un). */
export function countWords(text: string | null | undefined): number {
  const clean = collapseWhitespace(text);
  if (!clean) return 0;
  return clean.split(" ").filter((word) => /[\p{L}\p{N}]/u.test(word)).length;
}

/** Vitesse de lecture moyenne retenue (mots par minute, texte en français à l'écran). */
export const WORDS_PER_MINUTE = 200;

/**
 * Temps de lecture en minutes (arrondi, 1 minimum), calculé sur le texte brut
 * de l'article. `null` si l'article n'a pas de texte (rien n'est affiché).
 */
export function readingTimeMinutes(text: string | null | undefined, wordsPerMinute = WORDS_PER_MINUTE): number | null {
  const words = countWords(text);
  if (words === 0) return null;
  return Math.max(1, Math.round(words / wordsPerMinute));
}
