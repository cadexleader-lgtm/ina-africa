import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import type {
  ActionArea,
  GalleryItem,
  OfflineDonationInstruction,
  Paginated,
  Partner,
  SiteSettings,
  TeamMember,
} from "@/lib/types/content";
import { DEFAULT_TEAM_GROUP, isTeamGroup } from "@/lib/team";
import { richTextDocSchema, type RichTextDoc } from "@/lib/validation/rich-text";
import { DEV_PREVIEW_AREAS, DEV_PREVIEW_SETTINGS, isDevPreview } from "@/server/data/dev-preview";
import { emptyPage, getReader, logReadError, pageRange, paginated, toImage } from "@/server/data/reader";
import { TAGS } from "@/server/data/tags";

// ---------------------------------------------------------------------------
// Paramètres du site
// ---------------------------------------------------------------------------

const EMPTY_SETTINGS: SiteSettings = {
  aboutHistory: null,
  vision: null,
  mission: null,
  objectives: null,
  valuesText: null,
  approach: null,
  heroKicker: null,
  heroTitle: null,
  heroText: null,
  heroImage: null,
  impactTitle: null,
  impactText: null,
  impactImage: null,
  contactEmail: null,
  contactPhone: null,
  whatsappNumber: null,
  address: null,
  socialLinks: {},
  donationMinAmount: null,
  donationSuggestedAmounts: [],
  offlineDonationInstructions: [],
  legalNotice: null,
  privacyPolicy: null,
};

function safeDoc(value: unknown): RichTextDoc | null {
  const parsed = richTextDocSchema.safeParse(value);
  return parsed.success ? (parsed.data as RichTextDoc) : null;
}

function safeSocialLinks(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object") return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string" && /^https:\/\//.test(entry[1]),
    ),
  );
}

function safeInstructions(value: unknown): OfflineDonationInstruction[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is OfflineDonationInstruction =>
      !!item &&
      typeof item === "object" &&
      (item.method === "mobile_money" || item.method === "bank_transfer") &&
      typeof item.label === "string",
  );
}

export async function getSiteSettings(): Promise<SiteSettings> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.settings);

  const db = getReader();
  if (!db) return isDevPreview() ? { ...EMPTY_SETTINGS, ...DEV_PREVIEW_SETTINGS } : EMPTY_SETTINGS;

  const { data, error } = await db
    .from("site_settings")
    .select(
      "about_history, vision, mission, objectives, values_text, approach, hero_kicker, hero_title, hero_text, hero_image_path, hero_image_alt, impact_title, impact_text, impact_image_path, impact_image_alt, contact_email, contact_phone, whatsapp_number, address, social_links, donation_min_amount, donation_suggested_amounts, offline_donation_instructions, legal_notice, privacy_policy",
    )
    .eq("id", 1)
    .maybeSingle();

  if (error || !data) {
    logReadError("site_settings", error);
    return EMPTY_SETTINGS;
  }

  return {
    aboutHistory: data.about_history,
    vision: data.vision,
    mission: data.mission,
    objectives: data.objectives,
    valuesText: data.values_text,
    approach: data.approach,
    heroKicker: data.hero_kicker,
    heroTitle: data.hero_title,
    heroText: data.hero_text,
    heroImage: toImage(data.hero_image_path, data.hero_image_alt),
    impactTitle: data.impact_title,
    impactText: data.impact_text,
    impactImage: toImage(data.impact_image_path, data.impact_image_alt),
    contactEmail: data.contact_email,
    contactPhone: data.contact_phone,
    whatsappNumber: data.whatsapp_number,
    address: data.address,
    socialLinks: safeSocialLinks(data.social_links),
    donationMinAmount: data.donation_min_amount,
    donationSuggestedAmounts: (data.donation_suggested_amounts ?? []).map(Number),
    offlineDonationInstructions: safeInstructions(data.offline_donation_instructions),
    legalNotice: safeDoc(data.legal_notice),
    privacyPolicy: safeDoc(data.privacy_policy),
  };
}

/** Découpe un texte « une ligne = un point » (missions, objectifs, approche). */
export function splitLines(text: string | null): string[] {
  return (text ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

// ---------------------------------------------------------------------------
// Domaines d'intervention
// ---------------------------------------------------------------------------

const AREA_COLUMNS = "id, slug, title, summary, description, image_path, image_alt, display_order";

type AreaRow = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  description: string | null;
  image_path: string | null;
  image_alt: string | null;
  display_order: number;
};

function toArea(row: AreaRow): ActionArea {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    description: row.description,
    image: toImage(row.image_path, row.image_alt, row.title),
    displayOrder: row.display_order,
  };
}

/** Domaines ACTIFS, dans l'ordre choisi par l'administration. */
export async function listActionAreas(): Promise<ActionArea[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.areas);

  const db = getReader();
  if (!db) return isDevPreview() ? DEV_PREVIEW_AREAS : [];
  const { data, error } = await db.from("action_areas").select(AREA_COLUMNS).order("display_order");
  if (error) {
    logReadError("action_areas", error);
    return [];
  }
  return (data as AreaRow[]).map(toArea);
}

export async function getActionArea(slug: string): Promise<ActionArea | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.areas);

  const db = getReader();
  if (!db) return isDevPreview() ? (DEV_PREVIEW_AREAS.find((area) => area.slug === slug) ?? null) : null;
  const { data, error } = await db.from("action_areas").select(AREA_COLUMNS).eq("slug", slug).maybeSingle();
  if (error) logReadError("action_areas", error);
  return data ? toArea(data as AreaRow) : null;
}

// ---------------------------------------------------------------------------
// Équipe et partenaires
// ---------------------------------------------------------------------------

export async function listTeamMembers(): Promise<TeamMember[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.team);

  const db = getReader();
  if (!db) return [];
  const { data, error } = await db
    .from("team_members")
    .select("id, full_name, position, bio, photo_path, team_group")
    .order("display_order")
    .order("full_name");
  if (error) {
    logReadError("team_members", error);
    return [];
  }
  return data.map((row) => ({
    id: row.id,
    fullName: row.full_name,
    position: row.position,
    group: isTeamGroup(row.team_group) ? row.team_group : DEFAULT_TEAM_GROUP,
    bio: row.bio,
    photo: toImage(row.photo_path, null, `Portrait de ${row.full_name}`),
  }));
}

export async function listPartners(): Promise<Partner[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.partners);

  const db = getReader();
  if (!db) return [];
  const { data, error } = await db
    .from("partners")
    .select("id, name, kind, description, logo_path, website_url")
    .order("kind")
    .order("display_order");
  if (error) {
    logReadError("partners", error);
    return [];
  }
  return data.map((row) => ({
    id: row.id,
    name: row.name,
    kind: row.kind,
    description: row.description,
    logo: toImage(row.logo_path, null, `Logo de ${row.name}`),
    websiteUrl: row.website_url,
  }));
}

// ---------------------------------------------------------------------------
// Galerie
// ---------------------------------------------------------------------------

export const GALLERY_COLUMNS = "id, item_type, image_path, image_alt, video_provider, video_url, caption, taken_on";

export type GalleryRow = {
  id: string;
  item_type: "photo" | "video";
  image_path: string | null;
  image_alt: string | null;
  video_provider: "youtube" | "facebook" | null;
  video_url: string | null;
  caption: string | null;
  taken_on: string | null;
};

export function toGalleryItem(row: GalleryRow): GalleryItem | null {
  if (row.item_type === "photo" && row.image_path) {
    return {
      id: row.id,
      type: "photo",
      image: { path: row.image_path, alt: row.image_alt ?? "" },
      caption: row.caption,
      takenOn: row.taken_on,
    };
  }
  if (row.item_type === "video" && row.video_url && row.video_provider) {
    return {
      id: row.id,
      type: "video",
      provider: row.video_provider,
      url: row.video_url,
      poster: toImage(row.image_path, row.image_alt),
      caption: row.caption,
      takenOn: row.taken_on,
    };
  }
  return null;
}

export const GALLERY_PAGE_SIZE = 24;

export async function listGalleryItems(page = 1): Promise<Paginated<GalleryItem>> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.gallery);

  const db = getReader();
  if (!db) return emptyPage(GALLERY_PAGE_SIZE);
  const range = pageRange(page, GALLERY_PAGE_SIZE);
  const { data, error, count } = await db
    .from("gallery_items")
    .select(GALLERY_COLUMNS, { count: "exact" })
    .order("display_order")
    .order("taken_on", { ascending: false, nullsFirst: false })
    .range(range.from, range.to);
  if (error) {
    logReadError("gallery_items", error);
    return emptyPage(GALLERY_PAGE_SIZE);
  }
  const items = (data as GalleryRow[]).map(toGalleryItem).filter((item): item is GalleryItem => item !== null);
  return paginated(items, count ?? items.length, range.page, GALLERY_PAGE_SIZE);
}
