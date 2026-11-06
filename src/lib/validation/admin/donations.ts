import { z } from "zod";

import {
  ADMIN_MESSAGES as M,
  amountField,
  dateField,
  flagField,
  idField,
  optionalAlt,
  optionalAmountField,
  optionalDateField,
  optionalIdField,
  optionalLine,
  optionalSlugField,
  optionalStoragePath,
  optionalText,
  pageField,
  requireAltFor,
  requiredLine,
  richDoc,
  todayIso,
} from "@/lib/validation/admin/common";
import { optionalEmailField, optionalPhoneField } from "@/lib/validation/forms";

/*
 * Appels aux dons et dons hors ligne. Limites = contraintes SQL de
 * supabase/migrations/…100600_donations.sql et contrôles de
 * record_offline_donation() / cancel_offline_donation().
 */

// ---------------------------------------------------------------------------
// Appels aux dons
// ---------------------------------------------------------------------------

export const campaignInputSchema = z
  .object({
    title: requiredLine(3, 200, "Indiquez le titre de l'appel aux dons."),
    slug: optionalSlugField,
    summary: optionalText(300),
    content: richDoc,
    coverImagePath: optionalStoragePath,
    coverImageAlt: optionalAlt,
    goalAmount: optionalAmountField,
    startsOn: optionalDateField,
    endsOn: optionalDateField,
    showProgress: flagField,
    shareMessage: optionalText(1000),
    seoTitle: optionalLine(70),
    seoDescription: optionalLine(160),
  })
  .superRefine(requireAltFor("coverImagePath", "coverImageAlt"))
  .superRefine((data, ctx) => {
    if (data.startsOn && data.endsOn && data.endsOn < data.startsOn) {
      ctx.addIssue({ code: "custom", path: ["endsOn"], message: M.dateOrder });
    }
  });

export type CampaignInput = z.output<typeof campaignInputSchema>;

export const campaignUpdateSchema = z.object({ id: idField }).and(campaignInputSchema);

// ---------------------------------------------------------------------------
// Dons hors ligne
// ---------------------------------------------------------------------------

export const OFFLINE_PAYMENT_METHODS = ["mobile_money", "bank_transfer"] as const;

export const offlineDonationSchema = z.object({
  amount: amountField,
  // Même règle que la base (current_date, UTC) : la date de réception n'est pas dans le futur.
  receivedOn: dateField
    .refine((date) => date >= "2000-01-01", M.date)
    .refine((date) => date <= todayIso(), "La date de réception ne peut pas être dans le futur."),
  paymentMethod: z.enum(OFFLINE_PAYMENT_METHODS, { error: "Choisissez le mode de réception : Mobile Money ou virement." }),
  externalReference: optionalLine(100, 3),
  operatorOrBank: optionalLine(100),
  donorName: optionalLine(120),
  donorEmail: optionalEmailField.transform((value) => value ?? null),
  donorPhone: optionalPhoneField.transform((value) => value ?? null),
  isAnonymous: flagField,
  campaignId: optionalIdField,
  /** Justificatif déjà envoyé dans l'espace privé (médiathèque). */
  proofPath: optionalStoragePath,
  donorMessage: optionalText(1000),
  /** Clé générée à l'affichage du formulaire : un double clic n'enregistre qu'un don. */
  idempotencyKey: z.uuid({ error: "Rechargez la page puis réessayez." }),
});

export type OfflineDonationInput = z.output<typeof offlineDonationSchema>;

export const cancelDonationSchema = z.object({
  id: idField,
  reason: z.preprocess(
    (value) => (typeof value === "string" ? value.trim() : value),
    z
      .string({ error: "Indiquez le motif de l'annulation." })
      .min(3, "Indiquez le motif de l'annulation.")
      .max(500, M.tooLong(500)),
  ),
});

// ---------------------------------------------------------------------------
// Liste et export des dons
// ---------------------------------------------------------------------------

export const DONATION_CHANNELS = ["online", "offline"] as const;
export const DONATION_STATUSES = ["pending", "paid", "failed", "cancelled", "refunded"] as const;

const optionalEnum = <T extends readonly [string, ...string[]]>(values: T) =>
  z.preprocess((value) => (value === "" || value === null ? undefined : value), z.enum(values).optional().catch(undefined));

export const donationFiltersSchema = z.object({
  page: pageField,
  channel: optionalEnum(DONATION_CHANNELS),
  status: optionalEnum(DONATION_STATUSES),
  campaignId: z.preprocess((value) => (value === "" || value === null ? undefined : value), z.uuid().optional().catch(undefined)),
  /** Période (date de création du don), bornes incluses. */
  from: optionalDateField.optional().catch(undefined),
  to: optionalDateField.optional().catch(undefined),
});

export type DonationFilters = z.output<typeof donationFiltersSchema>;
