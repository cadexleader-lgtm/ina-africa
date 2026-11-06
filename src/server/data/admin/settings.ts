import "server-only";

import { check, found } from "@/server/admin/action";
import { adminReader, first, toDoc } from "@/server/data/admin/reader";
import type { AdminOfflineInstruction, AdminSiteSettings } from "@/server/data/admin/types";

type SettingsRow = {
  about_history: string | null;
  vision: string | null;
  mission: string | null;
  objectives: string | null;
  values_text: string | null;
  approach: string | null;
  hero_kicker: string | null;
  hero_title: string | null;
  hero_text: string | null;
  hero_image_path: string | null;
  hero_image_alt: string | null;
  impact_title: string | null;
  impact_text: string | null;
  impact_image_path: string | null;
  impact_image_alt: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  whatsapp_number: string | null;
  address: string | null;
  social_links: unknown;
  donation_min_amount: number | null;
  donation_suggested_amounts: number[] | null;
  offline_donation_instructions: unknown;
  legal_notice: unknown;
  privacy_policy: unknown;
  updated_at: string | null;
  updated_by_profile: { full_name: string } | { full_name: string }[] | null;
};

const COLUMNS =
  "about_history, vision, mission, objectives, values_text, approach, hero_kicker, hero_title, hero_text, hero_image_path, hero_image_alt, impact_title, impact_text, impact_image_path, impact_image_alt, contact_email, contact_phone, whatsapp_number, address, social_links, donation_min_amount, donation_suggested_amounts, offline_donation_instructions, legal_notice, privacy_policy, updated_at, updated_by_profile:profiles!site_settings_updated_by_fkey(full_name)";

function stringRecord(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
  );
}

function instructions(value: unknown): AdminOfflineInstruction[] {
  return Array.isArray(value)
    ? value.filter(
        (item): item is AdminOfflineInstruction =>
          !!item && typeof item === "object" && (item.method === "mobile_money" || item.method === "bank_transfer"),
      )
    : [];
}

/** Paramètres du site, tels qu'enregistrés, pour les formulaires de l'administration. */
export async function getAdminSiteSettings(): Promise<AdminSiteSettings> {
  const { db } = await adminReader("admin");
  const row = found(
    check(await db.from("site_settings").select(COLUMNS).eq("id", 1).maybeSingle()) as unknown as SettingsRow | null,
    "Les paramètres du site sont introuvables.",
  );
  return {
    aboutHistory: row.about_history,
    vision: row.vision,
    mission: row.mission,
    objectives: row.objectives,
    valuesText: row.values_text,
    approach: row.approach,
    heroKicker: row.hero_kicker,
    heroTitle: row.hero_title,
    heroText: row.hero_text,
    heroImagePath: row.hero_image_path,
    heroImageAlt: row.hero_image_alt,
    impactTitle: row.impact_title,
    impactText: row.impact_text,
    impactImagePath: row.impact_image_path,
    impactImageAlt: row.impact_image_alt,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    whatsappNumber: row.whatsapp_number,
    address: row.address,
    socialLinks: stringRecord(row.social_links),
    donationMinAmount: row.donation_min_amount === null ? null : Number(row.donation_min_amount),
    donationSuggestedAmounts: (row.donation_suggested_amounts ?? []).map(Number),
    offlineDonationInstructions: instructions(row.offline_donation_instructions),
    legalNotice: row.legal_notice ? toDoc(row.legal_notice) : null,
    privacyPolicy: row.privacy_policy ? toDoc(row.privacy_policy) : null,
    updatedAt: row.updated_at,
    updatedByName: first(row.updated_by_profile)?.full_name ?? null,
  };
}
