import { z } from "zod";

import { MAX_DONATION_AMOUNT, parseAmount } from "@/lib/money";
import {
  ADMIN_MESSAGES as M,
  optionalAlt,
  optionalAmountField,
  optionalHttpsUrl,
  optionalLine,
  optionalRichDoc,
  optionalStoragePath,
  optionalText,
} from "@/lib/validation/admin/common";
import { optionalEmailField } from "@/lib/validation/forms";

/*
 * Paramètres du site (ligne unique de site_settings). Mise à jour PARTIELLE :
 * seuls les champs envoyés sont modifiés (un formulaire par section :
 * textes, accueil, coordonnées, dons, pages légales). Un champ envoyé vide
 * est vidé. Limites = contraintes SQL.
 */

/** Réseaux sociaux proposés dans l'administration (adresses https:// uniquement). */
export const SOCIAL_NETWORKS = ["facebook", "instagram", "linkedin", "youtube", "x", "tiktok", "whatsapp"] as const;
export type SocialNetwork = (typeof SOCIAL_NETWORKS)[number];

const socialLinksSchema = z
  .object(Object.fromEntries(SOCIAL_NETWORKS.map((name) => [name, optionalHttpsUrl.optional()])) as Record<
    SocialNetwork,
    z.ZodOptional<typeof optionalHttpsUrl>
  >)
  .strict()
  .transform((links) =>
    // Seuls les réseaux renseignés sont enregistrés.
    Object.fromEntries(Object.entries(links).filter((entry): entry is [string, string] => typeof entry[1] === "string")),
  );

export const OFFLINE_METHODS = ["mobile_money", "bank_transfer"] as const;

const offlineInstructionSchema = z.object({
  method: z.enum(OFFLINE_METHODS, { error: "Choisissez : Mobile Money ou virement bancaire." }),
  label: z.preprocess(
    (value) => (typeof value === "string" ? value.trim() : value),
    z.string({ error: "Indiquez un intitulé (ex. MTN Mobile Money)." }).min(2, "Indiquez un intitulé (ex. MTN Mobile Money).").max(80, M.tooLong(80)),
  ),
  holder: optionalLine(120),
  number: optionalLine(60),
  note: optionalText(300),
});

const offlineInstructionsSchema = z
  .array(offlineInstructionSchema)
  .max(6, "6 moyens de paiement hors ligne au plus.")
  .transform((items) =>
    // Format lu par le site : clés facultatives absentes plutôt que null.
    items.map((item) => Object.fromEntries(Object.entries(item).filter(([, value]) => value !== null))),
  );

const suggestedAmountsSchema = z.preprocess(
  (value) => {
    if (typeof value === "string") value = value.split(/[;,\n]/).filter((part) => part.trim() !== "");
    return Array.isArray(value) ? value.map((item) => parseAmount(item) ?? Number.NaN) : value;
  },
  z
    .array(
      z
        .number({ error: M.amount })
        .int(M.amount)
        .min(1, M.amount)
        .max(MAX_DONATION_AMOUNT, M.amount),
    )
    .max(8, "8 montants suggérés au plus.")
    .transform((amounts) => [...new Set(amounts)].sort((a, b) => a - b)),
);

/** Numéro WhatsApp : chiffres seulement, indicatif compris (même règle que la base). */
const whatsappField = z.preprocess(
  (value) => {
    if (value === null || value === undefined) return null;
    if (typeof value !== "string") return value;
    const compact = value.replace(/[\s().-]/g, "");
    return compact === "" ? null : compact;
  },
  z
    .string()
    .regex(/^\+?[0-9]{8,15}$/, "Numéro WhatsApp invalide : indicatif et numéro, 8 à 15 chiffres (ex. +22990000000).")
    .nullable(),
);

const contactPhoneField = z.preprocess(
  (value) => (typeof value === "string" ? value.trim() || null : value),
  z
    .string()
    .max(30, M.tooLong(30))
    .regex(/^\+?[0-9][0-9 ().-]*$/, "Numéro invalide : chiffres, espaces et « + » uniquement.")
    .nullable(),
);

const emailOrNull = z.preprocess((value) => (value === null ? "" : value), optionalEmailField).transform((value) => value ?? null);

export const siteSettingsInputSchema = z
  .object({
    // Présentation (À propos). Missions, objectifs, approche : une ligne = un point.
    aboutHistory: optionalText(10000),
    vision: optionalText(5000),
    mission: optionalText(5000),
    objectives: optionalText(5000),
    valuesText: optionalText(5000),
    approach: optionalText(5000),
    // Accueil
    heroKicker: optionalLine(80),
    heroTitle: optionalLine(120),
    heroText: optionalText(400),
    heroImagePath: optionalStoragePath,
    heroImageAlt: optionalAlt,
    impactTitle: optionalLine(120),
    impactText: optionalText(1500),
    impactImagePath: optionalStoragePath,
    impactImageAlt: optionalAlt,
    // Coordonnées et réseaux
    contactEmail: emailOrNull,
    contactPhone: contactPhoneField,
    whatsappNumber: whatsappField,
    address: optionalText(500),
    socialLinks: socialLinksSchema,
    // Dons
    donationMinAmount: optionalAmountField,
    donationSuggestedAmounts: suggestedAmountsSchema,
    offlineDonationInstructions: offlineInstructionsSchema,
    // Pages légales (contenu riche)
    legalNotice: optionalRichDoc,
    privacyPolicy: optionalRichDoc,
  })
  .partial()
  .strict()
  .superRefine((data, ctx) => {
    // Les paramètres sont publics : une image n'y entre qu'avec son texte alternatif.
    for (const [pathKey, altKey] of [
      ["heroImagePath", "heroImageAlt"],
      ["impactImagePath", "impactImageAlt"],
    ] as const) {
      if (data[pathKey] && !data[altKey]) {
        ctx.addIssue({ code: "custom", path: [altKey], message: M.altRequired });
      }
    }
    const min = data.donationMinAmount;
    if (min && data.donationSuggestedAmounts?.some((amount) => amount < min)) {
      ctx.addIssue({
        code: "custom",
        path: ["donationSuggestedAmounts"],
        message: "Les montants suggérés doivent être au moins égaux au montant minimum.",
      });
    }
  })
  .refine((data) => Object.keys(data).length > 0, "Aucune modification à enregistrer.");

export type SiteSettingsInput = z.output<typeof siteSettingsInputSchema>;
