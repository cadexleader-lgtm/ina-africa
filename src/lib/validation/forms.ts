import { z } from "zod";

import { DEFAULT_MIN_DONATION, MAX_DONATION_AMOUNT, parseAmount } from "@/lib/money";

/**
 * Validation des formulaires PUBLICS (contact, nous rejoindre, newsletter,
 * don en ligne). Partagée navigateur / serveur, mais la seule validation qui
 * compte est celle du SERVEUR (actions de src/server/actions/).
 *
 * Les limites reprennent EXACTEMENT les contraintes SQL
 * (supabase/migrations/…100500_contact_requests_and_newsletter.sql et
 * …100600_donations.sql) : une saisie acceptée ici est acceptée par la base.
 */

// ---------------------------------------------------------------------------
// État d'un formulaire (renvoyé par les actions, lu par useActionState)
// ---------------------------------------------------------------------------

export type FormValues = Record<string, string | boolean>;

export type FormState = {
  /**
   * idle : rien envoyé ; success : enregistré ; error : à corriger ou refusé ;
   * unavailable : le service n'est pas encore configuré (RIEN n'a été enregistré).
   */
  status: "idle" | "success" | "error" | "unavailable";
  message?: string;
  /** Premier message d'erreur de chaque champ (nom du champ → message). */
  fieldErrors?: Record<string, string>;
  /** Saisie renvoyée au formulaire pour ne rien perdre en cas d'erreur. */
  values?: FormValues;
  /** Horodatage de la réponse (réinitialise l'anti-robot, déplace le focus). */
  respondedAt?: number;
};

export const INITIAL_FORM_STATE: FormState = { status: "idle" };

/** Noms des champs techniques (anti-spam), communs à tous les formulaires. */
export const SPAM_FIELDS = {
  /** Champ piège, invisible : un humain le laisse vide. */
  honeypot: "ina_note_interne",
  /** Horodatage signé par le serveur au moment de l'affichage du formulaire. */
  token: "ina_jeton",
  /** Réponse de Cloudflare Turnstile (nom imposé par Turnstile). */
  turnstile: "cf-turnstile-response",
} as const;

// ---------------------------------------------------------------------------
// Limites (identiques à la base)
// ---------------------------------------------------------------------------

export const LIMITS = {
  fullName: { min: 2, max: 120 },
  email: 254,
  phone: { min: 6, max: 30 },
  organization: 200,
  subject: 200,
  message: 5000,
  // Champs de `details` (jsonb ≤ 10 000 octets au total : largement respecté)
  profession: 120,
  city: 120,
  skills: 1000,
  motivation: 2000,
  // Dons
  donorName: 120,
  donorMessage: 1000,
} as const;

// ---------------------------------------------------------------------------
// Nettoyage des saisies
// ---------------------------------------------------------------------------

/** Caractères invisibles (largeur nulle, contrôle du sens d'écriture) : jamais conservés. */
const INVISIBLE = new Set([0x200b, 0x200e, 0x200f, 0x202a, 0x202b, 0x202c, 0x202d, 0x202e, 0x2066, 0x2067, 0x2068, 0x2069, 0xfeff]);

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function stripControls(text: string, keepNewlines: boolean): string {
  let out = "";
  for (const char of text) {
    const code = char.codePointAt(0) ?? 0;
    if (INVISIBLE.has(code)) continue;
    if (code === 0x0a) {
      out += keepNewlines ? "\n" : " ";
    } else if (code === 0x09) {
      out += " ";
    } else if (code < 0x20 || code === 0x7f || (code >= 0x80 && code < 0xa0) || code === 0x2028 || code === 0x2029) {
      out += keepNewlines ? "" : " ";
    } else {
      out += char;
    }
  }
  return out;
}

/** Texte sur une ligne : caractères de contrôle et espaces superflus retirés. */
export function cleanLine(value: unknown): string {
  return stripControls(asString(value).normalize("NFC").replace(/\r\n?/g, "\n"), false)
    .replace(/\s+/g, " ")
    .trim();
}

/** Texte sur plusieurs lignes : retours à la ligne conservés (3 lignes vides au plus → 1). */
export function cleanText(value: unknown): string {
  return stripControls(asString(value).normalize("NFC").replace(/\r\n?/g, "\n"), true)
    .replace(/[  ]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function countDigits(value: string): number {
  return value.replace(/\D/g, "").length;
}

// ---------------------------------------------------------------------------
// Champs
// ---------------------------------------------------------------------------

/** Même règle que le type SQL email_address (minuscules, pas d'espace, un @, un point dans le domaine). */
const SQL_EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const PHONE = /^\+?[0-9][0-9 ().-]*$/;

const MSG = {
  nameEmpty: "Indiquez votre nom.",
  nameShort: `Le nom doit contenir au moins ${LIMITS.fullName.min} caractères.`,
  nameLong: `Le nom ne doit pas dépasser ${LIMITS.fullName.max} caractères.`,
  emailEmpty: "Indiquez votre adresse email.",
  emailInvalid: "Cette adresse email n'est pas valide (exemple : prenom.nom@exemple.com).",
  emailLong: `L'adresse email ne doit pas dépasser ${LIMITS.email} caractères.`,
  phoneEmpty: "Indiquez votre numéro de téléphone.",
  phoneInvalid: "Ce numéro n'est pas valide : chiffres, espaces et « + » uniquement, entre 6 et 30 caractères.",
  reachable: "Indiquez au moins une adresse email ou un numéro de téléphone.",
  consent: "Cochez cette case pour que nous puissions traiter votre demande.",
  tooLong: (max: number) => `Ce texte ne doit pas dépasser ${max.toLocaleString("fr-FR")} caractères.`,
} as const;

export const VALIDATION_MESSAGES = MSG;

/** Ligne obligatoire. */
function requiredLine(empty: string, max: number, tooLong = MSG.tooLong(max)) {
  return z.preprocess(cleanLine, z.string().min(1, empty).max(max, tooLong));
}

/** Ligne facultative (vide → undefined). */
function optionalLine(max: number) {
  return z.preprocess((value) => cleanLine(value) || undefined, z.string().max(max, MSG.tooLong(max)).optional());
}

/** Texte long obligatoire. */
function requiredText(empty: string, max: number) {
  return z.preprocess(cleanText, z.string().min(1, empty).max(max, MSG.tooLong(max)));
}

/** Texte long facultatif. */
function optionalText(max: number) {
  return z.preprocess((value) => cleanText(value) || undefined, z.string().max(max, MSG.tooLong(max)).optional());
}

const fullName = z.preprocess(
  cleanLine,
  z
    .string()
    .min(1, MSG.nameEmpty)
    .min(LIMITS.fullName.min, MSG.nameShort)
    .max(LIMITS.fullName.max, MSG.nameLong),
);

const emailFormat = z
  .string()
  .max(LIMITS.email, MSG.emailLong)
  .pipe(z.email({ error: MSG.emailInvalid }))
  .refine((value) => SQL_EMAIL.test(value), MSG.emailInvalid);

/** Email obligatoire, TOUJOURS mis en minuscules (le type SQL refuse les majuscules). */
export const emailField = z.preprocess(
  (value) => cleanLine(value).toLowerCase(),
  z.string().min(1, MSG.emailEmpty).pipe(emailFormat),
);

/** Email facultatif (vide → undefined), en minuscules. */
export const optionalEmailField = z.preprocess(
  (value) => cleanLine(value).toLowerCase() || undefined,
  emailFormat.optional(),
);

function isValidPhone(value: string): boolean {
  return (
    value.length >= LIMITS.phone.min &&
    value.length <= LIMITS.phone.max &&
    PHONE.test(value) &&
    countDigits(value) >= LIMITS.phone.min
  );
}

export const phoneField = z.preprocess(
  cleanLine,
  z.string().min(1, MSG.phoneEmpty).refine(isValidPhone, MSG.phoneInvalid),
);

export const optionalPhoneField = z.preprocess(
  (value) => cleanLine(value) || undefined,
  z.string().refine(isValidPhone, MSG.phoneInvalid).optional(),
);

/** Case de consentement (obligatoire) : seule la valeur envoyée par une case cochée est acceptée. */
export const consentField = z.preprocess(
  (value) => value === "on" || value === "true" || value === true,
  z.literal(true, { error: MSG.consent }),
);

/** Case facultative. */
const flag = z.preprocess((value) => value === "on" || value === "true" || value === true, z.boolean());

// ---------------------------------------------------------------------------
// Schémas des formulaires
// ---------------------------------------------------------------------------

export const contactSchema = z.object({
  fullName,
  email: emailField,
  phone: optionalPhoneField,
  subject: requiredLine("Indiquez le sujet de votre message.", LIMITS.subject),
  message: requiredText("Écrivez votre message.", LIMITS.message),
  consent: consentField,
});

export const volunteerSchema = z.object({
  fullName,
  email: emailField,
  phone: phoneField,
  profession: optionalLine(LIMITS.profession),
  skills: requiredText("Indiquez vos compétences ou ce que vous aimeriez apporter.", LIMITS.skills),
  motivation: requiredText("Dites-nous en quelques mots pourquoi vous souhaitez vous engager.", LIMITS.motivation),
  consent: consentField,
});

export const membershipSchema = z.object({
  fullName,
  email: emailField,
  phone: phoneField,
  city: requiredLine("Indiquez votre ville.", LIMITS.city),
  profession: optionalLine(LIMITS.profession),
  motivation: optionalText(LIMITS.motivation),
  consent: consentField,
});

export const PARTNERSHIP_KINDS = ["partnership", "sponsorship"] as const;
export type PartnershipKind = (typeof PARTNERSHIP_KINDS)[number];

export const partnerSchema = z.object({
  fullName,
  organization: requiredLine("Indiquez le nom de votre organisation.", LIMITS.organization),
  email: emailField,
  phone: phoneField,
  partnershipKind: z.enum(PARTNERSHIP_KINDS, { error: "Choisissez le type de collaboration." }),
  message: requiredText("Présentez votre projet de collaboration en quelques lignes.", LIMITS.message),
  consent: consentField,
});

export const NEWSLETTER_SOURCES = ["footer", "page"] as const;

export const newsletterSchema = z.object({
  email: emailField,
  consent: consentField,
  source: z.enum(NEWSLETTER_SOURCES).catch("page"),
});

/** Jeton des liens de la newsletter : 32 octets aléatoires en base64url (43 caractères). */
export const NEWSLETTER_TOKEN = /^[A-Za-z0-9_-]{43}$/;

/** Référence d'un paiement (merchant_reference) : aléatoire, 24 à 100 caractères base64url. */
export const MERCHANT_REFERENCE = /^[A-Za-z0-9_-]{24,100}$/;

/** Adresse lisible (slug) : même règle que private.is_valid_slug(). */
export const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Don en ligne : le montant minimum vient de l'administration (site_settings). */
export function donationSchema(minAmount: number | null) {
  const min = minAmount && minAmount > 0 ? minAmount : DEFAULT_MIN_DONATION;
  return z
    .object({
      amount: z.preprocess(
        parseAmount,
        z
          .number({ error: "Choisissez ou indiquez un montant en francs CFA (nombre entier)." })
          .int()
          .min(min, `Le montant minimum est de ${min.toLocaleString("fr-FR")} FCFA.`)
          .max(MAX_DONATION_AMOUNT, "Ce montant est trop élevé pour un don en ligne : contactez-nous."),
      ),
      campaign: z.preprocess(
        (value) => cleanLine(value) || undefined,
        z.string().max(200).regex(SLUG).optional().catch(undefined),
      ),
      isAnonymous: flag,
      donorName: optionalLine(LIMITS.donorName),
      email: optionalEmailField,
      phone: optionalPhoneField,
      donorMessage: optionalText(LIMITS.donorMessage),
      consent: consentField,
      idempotencyKey: z.uuid({ error: "Rechargez la page puis réessayez." }),
    })
    .superRefine((data, ctx) => {
      if (!data.email && !data.phone) {
        ctx.addIssue({ code: "custom", path: ["email"], message: MSG.reachable });
      }
    });
}

/**
 * Le don choisi : bouton d'un montant suggéré (`amountChoice`) ou montant
 * libre (`customAmount`) quand « Autre montant » est choisi ou qu'aucun bouton
 * n'est coché.
 */
export function pickDonationAmount(amountChoice: unknown, customAmount: unknown): string {
  const choice = cleanLine(amountChoice);
  if (choice && choice !== "autre") return choice;
  return cleanLine(customAmount);
}

// ---------------------------------------------------------------------------
// Lecture d'un FormData et erreurs par champ
// ---------------------------------------------------------------------------

/** Champs texte d'un FormData (un fichier ou un champ absent donne « »). */
export function readFields(formData: FormData, names: readonly string[]): Record<string, string> {
  return Object.fromEntries(
    names.map((name) => {
      const value = formData.get(name);
      return [name, typeof value === "string" ? value : ""];
    }),
  );
}

/** Saisie renvoyée au formulaire (cases à cocher en booléen), bornée en longueur. */
export function echoValues(raw: Record<string, string>, checkboxes: readonly string[] = []): FormValues {
  return Object.fromEntries(
    Object.entries(raw).map(([name, value]) =>
      checkboxes.includes(name) ? [name, value === "on" || value === "true"] : [name, value.slice(0, LIMITS.message)],
    ),
  );
}

export type Validation<T> = { ok: true; data: T } | { ok: false; fieldErrors: Record<string, string> };

/** Valide une saisie ; en cas d'erreur, renvoie le PREMIER message de chaque champ. */
export function validate<S extends z.ZodType>(schema: S, input: unknown): Validation<z.output<S>> {
  const result = schema.safeParse(input);
  if (result.success) return { ok: true, data: result.data };
  const fieldErrors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = String(issue.path[0] ?? "_form");
    if (!(key in fieldErrors)) fieldErrors[key] = issue.message;
  }
  return { ok: false, fieldErrors };
}
