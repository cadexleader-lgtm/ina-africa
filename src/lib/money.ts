/**
 * Montants en francs CFA (XOF) : toujours des ENTIERS (la base refuse les
 * centimes, voir supabase/migrations/…100600_donations.sql).
 * Fonctions pures, utilisables côté serveur et navigateur.
 */

/** Plafond d'un don (même règle que la base : amount <= 1 000 000 000). */
export const MAX_DONATION_AMOUNT = 1_000_000_000;

/** Montant minimum par défaut si l'administration n'en a pas fixé. */
export const DEFAULT_MIN_DONATION = 100;

const NUMBER = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });

/** Espace insécable : un montant ne se coupe jamais en fin de ligne. */
const NBSP = " ";

/** « 25 000 FCFA » (espaces insécables). */
export function formatFcfa(amount: number): string {
  const value = Number.isFinite(amount) ? Math.round(amount) : 0;
  return `${NUMBER.format(value).replace(/[\s  ]/g, NBSP)}${NBSP}FCFA`;
}

/**
 * Lit un montant saisi par un visiteur : « 25 000 », « 25000 », « 25.000 »,
 * « 25 000 FCFA ». Renvoie un entier positif, ou null si la saisie n'est pas
 * un nombre entier de francs.
 */
export function parseAmount(input: unknown): number | null {
  if (typeof input === "number") return Number.isSafeInteger(input) && input > 0 ? input : null;
  if (typeof input !== "string") return null;
  const cleaned = input
    .trim()
    .replace(/\s*(f\s*cfa|fcfa|xof|f)\s*$/i, "")
    .replace(/[\s  .]/g, "");
  if (!/^\d{1,10}$/.test(cleaned)) return null;
  const value = Number(cleaned);
  return Number.isSafeInteger(value) && value > 0 ? value : null;
}

/**
 * Avancement d'un appel aux dons, en pourcentage entier (0 à 100) pour la
 * jauge. null s'il n'y a pas d'objectif.
 */
export function progressPercent(total: number, goal: number | null): number | null {
  if (!goal || goal <= 0) return null;
  const ratio = Math.floor((Math.max(0, total) / goal) * 100);
  return Math.min(100, ratio);
}
