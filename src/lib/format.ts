/**
 * Formats d'affichage en français (déterministes : utilisables au rendu
 * statique, aucune lecture de l'heure courante).
 */

const DATE_FORMAT = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Africa/Porto-Novo",
});

/** « 5 novembre 2026 ». Renvoie null si la date est absente ou invalide. */
export function formatDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : DATE_FORMAT.format(date);
}

/** Valeur de l'attribut `dateTime` d'une balise <time> (AAAA-MM-JJ). */
export function isoDate(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString().slice(0, 10);
}
