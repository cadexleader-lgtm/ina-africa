"use server";

import { siteSettingsInputSchema, type SiteSettingsInput } from "@/lib/validation/admin/settings";
import { adminAction, invalidate, updateRow } from "@/server/admin/action";
import { TAGS } from "@/server/data/tags";
import type { ActionResult } from "@/server/errors";

/*
 * Paramètres du site (admin) : une seule ligne (id = 1), mise à jour
 * PARTIELLE (seuls les champs envoyés changent). Les pages légales sont
 * enregistrées après richTextDocSchema ; les réseaux sociaux n'acceptent que
 * des adresses https://.
 */

const COLUMNS: Record<keyof SiteSettingsInput, string> = {
  aboutHistory: "about_history",
  vision: "vision",
  mission: "mission",
  objectives: "objectives",
  valuesText: "values_text",
  approach: "approach",
  heroKicker: "hero_kicker",
  heroTitle: "hero_title",
  heroText: "hero_text",
  heroImagePath: "hero_image_path",
  heroImageAlt: "hero_image_alt",
  impactTitle: "impact_title",
  impactText: "impact_text",
  impactImagePath: "impact_image_path",
  impactImageAlt: "impact_image_alt",
  contactEmail: "contact_email",
  contactPhone: "contact_phone",
  whatsappNumber: "whatsapp_number",
  address: "address",
  socialLinks: "social_links",
  donationMinAmount: "donation_min_amount",
  donationSuggestedAmounts: "donation_suggested_amounts",
  offlineDonationInstructions: "offline_donation_instructions",
  legalNotice: "legal_notice",
  privacyPolicy: "privacy_policy",
};

function toSettingsRow(data: SiteSettingsInput): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) row[COLUMNS[key as keyof SiteSettingsInput]] = value;
  }
  return row;
}

export async function updateSiteSettings(input: unknown): Promise<ActionResult<{ updatedAt: string }>> {
  return adminAction("admin", siteSettingsInputSchema, input, async (data, { db }) => {
    const row = await updateRow<{ updated_at: string }>(db, "site_settings", "1", toSettingsRow(data), "updated_at");
    invalidate(TAGS.settings);
    return { updatedAt: row.updated_at };
  });
}
