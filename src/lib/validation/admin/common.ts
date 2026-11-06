import { z } from "zod";

import { MAX_DONATION_AMOUNT, parseAmount } from "@/lib/money";
import { cleanLine, cleanText, SLUG } from "@/lib/validation/forms";
import { FACEBOOK_URL, richTextDocSchema, STORAGE_PATH, YOUTUBE_URL } from "@/lib/validation/rich-text";
import type { FieldErrors } from "@/server/errors";

/**
 * Briques de validation des formulaires de l'ADMINISTRATION.
 *
 * Les limites reprennent EXACTEMENT les contraintes SQL de
 * supabase/migrations : une saisie acceptée ici est acceptée par la base.
 * Les champs facultatifs vides ("" ou null) deviennent `null` (la colonne est
 * vidée) ; un champ ABSENT reste `undefined` (utile pour les mises à jour
 * partielles, ex. paramètres du site).
 *
 * Les entrées acceptées sont souples pour servir aussi bien un objet envoyé
 * par un composant client qu'un `Object.fromEntries(formData)` : booléens
 * "on" / "true", nombres en texte, contenu riche en JSON texte.
 */

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

export const ADMIN_MESSAGES = {
  required: "Ce champ est obligatoire.",
  invalid: "Valeur invalide.",
  choice: "Choix invalide.",
  id: "Identifiant invalide.",
  slug: "Adresse invalide : lettres minuscules sans accent, chiffres et tirets (ex. rentree-scolaire-2026).",
  storagePath: "Choisissez une image de la médiathèque.",
  altRequired: "Ajoutez un texte alternatif qui décrit l'image (pour les personnes malvoyantes et Google).",
  date: "Date invalide (format attendu : AAAA-MM-JJ).",
  dateOrder: "La date de fin doit être postérieure à la date de début.",
  httpsUrl: "Adresse web invalide : elle doit commencer par https://.",
  webUrl: "Adresse web invalide : elle doit commencer par https:// ou http://.",
  amount: "Indiquez un montant en francs CFA (nombre entier positif).",
  richText: "Le contenu contient des éléments non autorisés.",
  video: "Seules les vidéos YouTube ou Facebook sont acceptées (adresse https://…).",
  youtubeId: "Cette adresse YouTube n'est pas reconnue : copiez le lien de partage de la vidéo.",
  tooLong: (max: number) => `Ce texte ne doit pas dépasser ${max.toLocaleString("fr-FR")} caractères.`,
  tooShort: (min: number) => `Ce texte doit contenir au moins ${min.toLocaleString("fr-FR")} caractères.`,
} as const;

const M = ADMIN_MESSAGES;

/**
 * Messages par défaut (en français, sans jargon) pour les erreurs qui n'ont
 * pas de message propre dans le schéma.
 */
export const adminErrorMap: z.core.$ZodErrorMap = (issue) => {
  switch (issue.code) {
    case "invalid_type":
      return issue.input === undefined || issue.input === null ? M.required : M.invalid;
    case "too_big": {
      const max = Number(issue.maximum);
      if (issue.origin === "string") return M.tooLong(max);
      if (issue.origin === "array" || issue.origin === "set") return `${max.toLocaleString("fr-FR")} éléments au plus.`;
      if (issue.origin === "number" || issue.origin === "int" || issue.origin === "bigint") {
        return `La valeur ne doit pas dépasser ${max.toLocaleString("fr-FR")}.`;
      }
      return M.invalid;
    }
    case "too_small": {
      const min = Number(issue.minimum);
      if (issue.origin === "string") return min <= 1 ? M.required : M.tooShort(min);
      if (issue.origin === "array" || issue.origin === "set") return `Au moins ${min.toLocaleString("fr-FR")} élément(s).`;
      if (issue.origin === "number" || issue.origin === "int" || issue.origin === "bigint") {
        return `La valeur doit être au moins ${min.toLocaleString("fr-FR")}.`;
      }
      return M.invalid;
    }
    case "invalid_value":
    case "invalid_union":
      return M.choice;
    case "unrecognized_keys":
      return "Champ non prévu.";
    default:
      return M.invalid;
  }
};

export type AdminValidation<T> = { ok: true; data: T } | { ok: false; fieldErrors: FieldErrors };

/**
 * Valide une saisie de l'administration. En cas d'erreur, renvoie les
 * messages de chaque champ (« champ » ou « champ.sous-champ » pour les listes
 * et objets imbriqués, « _form » pour une erreur générale).
 */
export function parseAdminInput<S extends z.ZodType>(schema: S, input: unknown): AdminValidation<z.output<S>> {
  const result = schema.safeParse(input, { error: adminErrorMap });
  if (result.success) return { ok: true, data: result.data };
  const fieldErrors: FieldErrors = {};
  for (const issue of result.error.issues) {
    const key = issue.path.length ? issue.path.map(String).join(".") : "_form";
    (fieldErrors[key] ??= []).push(issue.message);
  }
  return { ok: false, fieldErrors };
}

// ---------------------------------------------------------------------------
// Nettoyage
// ---------------------------------------------------------------------------

const isEmpty = (value: unknown) => value === null || value === undefined || (typeof value === "string" && value.trim() === "");

/** Texte sur une ligne, vide → null. */
function lineOrNull(value: unknown): string | null {
  if (isEmpty(value)) return null;
  return typeof value === "string" ? cleanLine(value) || null : (value as never);
}

/** Texte sur plusieurs lignes, vide → null. */
function textOrNull(value: unknown): string | null {
  if (isEmpty(value)) return null;
  return typeof value === "string" ? cleanText(value) || null : (value as never);
}

// ---------------------------------------------------------------------------
// Champs texte
// ---------------------------------------------------------------------------

/** Ligne obligatoire (min / max comme dans la base). */
export function requiredLine(min: number, max: number, emptyMessage: string = M.required) {
  return z.preprocess(
    (value) => (typeof value === "string" ? cleanLine(value) : value),
    z
      .string({ error: emptyMessage })
      .min(1, emptyMessage)
      .min(min, M.tooShort(min))
      .max(max, M.tooLong(max)),
  );
}

/** Ligne facultative : vide → null. */
export function optionalLine(max: number, min = 1) {
  return z.preprocess(
    lineOrNull,
    z
      .string()
      .min(min, M.tooShort(min))
      .max(max, M.tooLong(max))
      .nullable(),
  );
}

/** Texte long facultatif (retours à la ligne conservés) : vide → null. */
export function optionalText(max: number) {
  return z.preprocess(textOrNull, z.string().max(max, M.tooLong(max)).nullable());
}

// ---------------------------------------------------------------------------
// Identifiants, adresses, chemins
// ---------------------------------------------------------------------------

export const idField = z.uuid({ error: M.id });

export const optionalIdField = z.preprocess((value) => (isEmpty(value) ? null : value), z.uuid({ error: M.id }).nullable());

/** Objet { id } (actions qui ne prennent qu'un identifiant). */
export const idInputSchema = z.object({ id: idField });

/** Action sans paramètre. */
export const noInputSchema = z.object({});

/**
 * Adresse lisible (slug) facultative : vide → null (l'action la calcule à
 * partir du titre). Même règle que private.is_valid_slug().
 */
export const optionalSlugField = z.preprocess(
  (value) => (isEmpty(value) ? null : typeof value === "string" ? value.trim() : value),
  z.string().max(120, M.tooLong(120)).regex(SLUG, M.slug).nullable(),
);

/** Calcule une adresse lisible à partir d'un titre (« Rentrée 2026 ! » → « rentree-2026 »). */
export function slugify(title: string): string {
  return title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/œ/gi, "oe")
    .replace(/æ/gi, "ae")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120)
    .replace(/-+$/g, "");
}

/** Chemin d'un fichier de la médiathèque (même règle que private.is_valid_storage_path()). */
export const optionalStoragePath = z.preprocess(
  (value) => (isEmpty(value) ? null : typeof value === "string" ? value.trim() : value),
  z
    .string()
    .max(300, M.storagePath)
    .regex(STORAGE_PATH, M.storagePath)
    .refine((path) => !path.includes(".."), M.storagePath)
    .nullable(),
);

/** Chemin obligatoire (photo de la galerie). */
export const requiredStoragePath = z.preprocess(
  (value) => (typeof value === "string" ? value.trim() : value),
  z
    .string({ error: M.storagePath })
    .min(1, M.storagePath)
    .max(300, M.storagePath)
    .regex(STORAGE_PATH, M.storagePath)
    .refine((path) => !path.includes(".."), M.storagePath),
);

/** Texte alternatif d'une image (≤ 300 caractères dans la base). */
export const optionalAlt = optionalLine(300);

/** Une image renseignée doit avoir son texte alternatif (règle appliquée partout dans l'administration). */
export function requireAltFor<T extends Record<string, unknown>>(pathKey: keyof T & string, altKey: keyof T & string) {
  return (data: T, ctx: z.RefinementCtx) => {
    if (data[pathKey] && !data[altKey]) {
      ctx.addIssue({ code: "custom", path: [altKey], message: M.altRequired });
    }
  };
}

function isWebUrl(value: string, httpsOnly: boolean): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  const protocolOk = httpsOnly ? url.protocol === "https:" : url.protocol === "https:" || url.protocol === "http:";
  return protocolOk && !url.username && !url.password && url.hostname.includes(".") && !/\s/.test(value);
}

/** Adresse web https:// facultative (réseaux sociaux). */
export const optionalHttpsUrl = z.preprocess(
  lineOrNull,
  z
    .string()
    .max(500, M.tooLong(500))
    .refine((value) => isWebUrl(value, true), M.httpsUrl)
    .nullable(),
);

/** Adresse web http(s):// facultative (site d'un partenaire, même règle que la base). */
export const optionalWebUrl = z.preprocess(
  lineOrNull,
  z
    .string()
    .max(500, M.tooLong(500))
    .refine((value) => isWebUrl(value, false), M.webUrl)
    .nullable(),
);

/** Adresse d'une vidéo YouTube / Facebook (mêmes règles que la base et le contenu riche). */
export function videoProviderOf(url: string): "youtube" | "facebook" | null {
  if (YOUTUBE_URL.test(url)) return "youtube";
  if (FACEBOOK_URL.test(url)) return "facebook";
  return null;
}

// ---------------------------------------------------------------------------
// Dates, nombres, cases à cocher
// ---------------------------------------------------------------------------

const DATE = /^\d{4}-\d{2}-\d{2}$/;

function isRealDate(value: string): boolean {
  if (!DATE.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export const dateField = z.preprocess(
  (value) => (typeof value === "string" ? value.trim() : value),
  z.string({ error: M.date }).refine(isRealDate, M.date),
);

export const optionalDateField = z.preprocess(
  (value) => (isEmpty(value) ? null : typeof value === "string" ? value.trim() : value),
  z.string().refine(isRealDate, M.date).nullable(),
);

/** Date du jour (UTC, comme `current_date` dans la base). */
export function todayIso(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/** Case à cocher : true, "true", "on", "1" → vrai ; absent → faux. */
export const flagField = z.preprocess(
  (value) => value === true || value === "true" || value === "on" || value === "1",
  z.boolean(),
);

/** Ordre d'affichage (entier). */
export const displayOrderField = z.preprocess(
  (value) => (isEmpty(value) ? 0 : typeof value === "string" ? Number(value) : value),
  z.number({ error: M.invalid }).int(M.invalid).min(-100000).max(100000),
);

/** Montant en francs CFA (entier > 0, ≤ plafond de la base). */
export const amountField = z.preprocess(
  (value) => parseAmount(value) ?? (isEmpty(value) ? undefined : Number.NaN),
  z
    .number({ error: M.amount })
    .int(M.amount)
    .min(1, M.amount)
    .max(MAX_DONATION_AMOUNT, `Le montant ne doit pas dépasser ${MAX_DONATION_AMOUNT.toLocaleString("fr-FR")} FCFA.`),
);

export const optionalAmountField = z.preprocess(
  (value) => (isEmpty(value) ? null : (parseAmount(value) ?? Number.NaN)),
  z
    .number({ error: M.amount })
    .int(M.amount)
    .min(1, M.amount)
    .max(MAX_DONATION_AMOUNT, `Le montant ne doit pas dépasser ${MAX_DONATION_AMOUNT.toLocaleString("fr-FR")} FCFA.`)
    .nullable(),
);

/** Page d'une liste (1 par défaut). */
export const pageField = z.preprocess(
  (value) => (isEmpty(value) ? 1 : typeof value === "string" ? Number(value) : value),
  z.number().int().min(1).max(100000).catch(1),
);

// ---------------------------------------------------------------------------
// Contenu riche
// ---------------------------------------------------------------------------

function parseJsonIfString(value: unknown): unknown {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

/** Messages du schéma du contenu riche déjà rédigés pour l'utilisateur. */
const RICH_TEXT_MESSAGES = new Set([
  "Lien non autorisé",
  "Image hors de la médiathèque",
  "Chemin invalide",
  "Texte alternatif obligatoire",
  "Vidéo YouTube ou Facebook uniquement",
  "Contenu trop long",
]);

function checkRichDoc(value: unknown, ctx: z.RefinementCtx) {
  const parsed = richTextDocSchema.safeParse(value);
  if (parsed.success) return parsed.data;
  const known = parsed.error.issues.find((issue) => RICH_TEXT_MESSAGES.has(issue.message));
  ctx.addIssue({ code: "custom", message: known ? `${M.richText} ${known.message}.` : M.richText });
  return z.NEVER;
}

/**
 * Document de l'éditeur visuel. La sortie est celle de
 * `richTextDocSchema.safeParse()` (éléments inconnus retirés) : c'est ELLE
 * qui est enregistrée, jamais l'entrée brute.
 */
export const richDoc = z.preprocess(
  (value) => (isEmpty(value) ? { type: "doc", content: [] } : parseJsonIfString(value)),
  z.unknown().transform(checkRichDoc),
);

/** Document facultatif (pages légales) : vide → null. */
export const optionalRichDoc = z.preprocess(
  (value) => (isEmpty(value) ? null : parseJsonIfString(value)),
  z.unknown().transform((value, ctx) => (value === null ? null : checkRichDoc(value, ctx))),
);
