import { slugify } from "@/lib/validation/admin/common";
import { cleanLine, cleanText } from "@/lib/validation/forms";

/*
 * Fonctions PURES des formulaires de l'administration (testées dans
 * tests/unit/admin-ui-contenus.test.ts) : compteur de caractères, adresse
 * lisible calculée depuis le titre, erreurs par champ, listes « une ligne =
 * un point ».
 */

export type FieldErrorsMap = Record<string, string[] | undefined>;

// ---------------------------------------------------------------------------
// Compteur de caractères (même nettoyage que le serveur)
// ---------------------------------------------------------------------------

export type CharCount = {
  /** Caractères comptés, après le nettoyage fait par le serveur. */
  count: number;
  max: number;
  remaining: number;
  over: boolean;
  /** Proche de la limite (90 % atteints) : le message est annoncé. */
  near: boolean;
  /** Texte affiché et lu (« 120 caractères sur 160 »). */
  label: string;
};

/**
 * Compte les caractères comme la validation du serveur : `cleanLine` pour un
 * champ sur une ligne (espaces multiples réduits), `cleanText` pour un texte
 * long (retours à la ligne conservés).
 */
export function countChars(value: string, max: number, multiline = false): CharCount {
  const cleaned = multiline ? cleanText(value) : cleanLine(value);
  // Même mesure que la validation (longueur JavaScript de la chaîne).
  const count = cleaned.length;
  const remaining = max - count;
  const over = remaining < 0;
  const fmt = (n: number) => n.toLocaleString("fr-FR");
  const label = over
    ? `${fmt(count)} caractères sur ${fmt(max)} : ${fmt(-remaining)} de trop`
    : `${fmt(count)} caractère${count > 1 ? "s" : ""} sur ${fmt(max)}`;
  return { count, max, remaining, over, near: count >= Math.floor(max * 0.9), label };
}

// ---------------------------------------------------------------------------
// Adresse lisible (slug) calculée depuis le titre, modifiable
// ---------------------------------------------------------------------------

export { slugify };

/**
 * Nouvelle adresse quand le titre change : elle suit le titre tant que la
 * personne ne l'a pas modifiée elle-même (`edited`). Une adresse déjà
 * enregistrée (contenu existant) n'est jamais recalculée : les liens partagés
 * resteraient cassés.
 */
export function nextSlug(params: { title: string; slug: string; edited: boolean; locked: boolean }): string {
  if (params.edited || params.locked) return params.slug;
  return slugify(params.title);
}

/** Saisie de l'adresse : minuscules, sans accent, espaces → tirets (le tiret final est gardé pendant la frappe). */
export function normalizeSlugInput(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+/, "")
    .slice(0, 120);
}

// ---------------------------------------------------------------------------
// Erreurs par champ (ActionResult.error.fieldErrors)
// ---------------------------------------------------------------------------

/** Premier message d'erreur d'un champ (« champ » ou « liste.0.sous-champ »). */
export function fieldError(errors: FieldErrorsMap | undefined, key: string): string | null {
  return errors?.[key]?.[0] ?? null;
}

/** Erreurs qui ne correspondent à aucun champ affiché (affichées en haut du formulaire). */
export function unmatchedErrors(errors: FieldErrorsMap | undefined, shownKeys: readonly string[]): string[] {
  if (!errors) return [];
  const shown = new Set(shownKeys);
  return Object.entries(errors)
    .filter(([key]) => !shown.has(key))
    .flatMap(([, messages]) => messages ?? []);
}

/** Nombre de champs en erreur. */
export function errorCount(errors: FieldErrorsMap | undefined): number {
  return errors ? Object.values(errors).filter((messages) => messages && messages.length > 0).length : 0;
}

// ---------------------------------------------------------------------------
// Listes « une ligne = un point » (missions, objectifs, approche…)
// ---------------------------------------------------------------------------

/** Points d'une liste saisie ligne par ligne (lignes vides ignorées, puces retirées). */
export function linesToPoints(value: string | null | undefined): string[] {
  return (value ?? "")
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*(?:[-•*–]|\d+[.)])\s+/, "").trim())
    .filter(Boolean);
}

// ---------------------------------------------------------------------------
// Montants suggérés (paramètres des dons)
// ---------------------------------------------------------------------------

/** Montants affichés dans le champ : « 1 000 ; 5 000 ». */
export function amountsToText(amounts: number[]): string {
  return amounts.map((amount) => String(amount)).join(" ; ");
}

// ---------------------------------------------------------------------------
// Ordre d'affichage
// ---------------------------------------------------------------------------

/** Nouvel ordre après le déplacement d'un élément d'un cran (null si impossible). */
export function moveItem<T>(items: readonly T[], index: number, direction: -1 | 1): T[] | null {
  const target = index + direction;
  if (index < 0 || index >= items.length || target < 0 || target >= items.length) return null;
  const next = [...items];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}
