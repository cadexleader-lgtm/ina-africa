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
import { APPROACH, AREAS, CONTACTS, DIRECT_DONATIONS, EXPERIENCE, HERO, HISTORY, MISSIONS, OBJECTIVES, PARTNERS, TEAM, VISION } from "@/content/fr/ina-africa";
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

/**
 * Textes officiels de l'ONG (src/content/fr/ina-africa.ts) : affichés tant
 * que l'administration n'a rien saisi, ou si la base ne répond pas. Ainsi
 * aucune page de présentation n'est vide.
 */
const OFFICIAL_SETTINGS: SiteSettings = {
  ...EMPTY_SETTINGS,
  aboutHistory: HISTORY.join("\n\n"),
  vision: VISION,
  mission: MISSIONS.join("\n"),
  objectives: OBJECTIVES.join("\n"),
  approach: APPROACH.join("\n"),
  heroKicker: HERO.kicker,
  heroTitle: HERO.title,
  heroText: HERO.text,
  impactTitle: EXPERIENCE.title,
  impactText: EXPERIENCE.intro,
  contactEmail: CONTACTS.email,
  contactPhone: CONTACTS.phone,
  whatsappNumber: CONTACTS.whatsapp,
  socialLinks: CONTACTS.social,
  donationMinAmount: DIRECT_DONATIONS.minAmount,
  donationSuggestedAmounts: DIRECT_DONATIONS.suggestedAmounts,
  offlineDonationInstructions: DIRECT_DONATIONS.instructions,
};

/** Liste de la base si elle n'est pas vide, sinon la liste officielle. */
function nonEmpty<T>(value: T[], official: T[]): T[] {
  return value.length > 0 ? value : official;
}

/** Réseaux de la base s'il y en a, sinon les réseaux officiels. */
function withOfficial(value: Record<string, string>, official: Record<string, string>): Record<string, string> {
  return Object.keys(value).length > 0 ? value : official;
}

/** Valeur saisie dans la base, sinon le texte officiel. */
function orOfficial(value: string | null | undefined, official: string | null): string | null {
  return value && value.trim() ? value : official;
}

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
  if (!db) return OFFICIAL_SETTINGS;

  const { data, error } = await db
    .from("site_settings")
    .select(
      "about_history, vision, mission, objectives, values_text, approach, hero_kicker, hero_title, hero_text, hero_image_path, hero_image_alt, impact_title, impact_text, impact_image_path, impact_image_alt, contact_email, contact_phone, whatsapp_number, address, social_links, donation_min_amount, donation_suggested_amounts, offline_donation_instructions, legal_notice, privacy_policy",
    )
    .eq("id", 1)
    .maybeSingle();

  if (error || !data) {
    logReadError("site_settings", error);
    return OFFICIAL_SETTINGS;
  }

  return {
    aboutHistory: orOfficial(data.about_history, OFFICIAL_SETTINGS.aboutHistory),
    vision: orOfficial(data.vision, OFFICIAL_SETTINGS.vision),
    mission: orOfficial(data.mission, OFFICIAL_SETTINGS.mission),
    objectives: orOfficial(data.objectives, OFFICIAL_SETTINGS.objectives),
    valuesText: data.values_text,
    approach: orOfficial(data.approach, OFFICIAL_SETTINGS.approach),
    heroKicker: orOfficial(data.hero_kicker, OFFICIAL_SETTINGS.heroKicker),
    heroTitle: orOfficial(data.hero_title, OFFICIAL_SETTINGS.heroTitle),
    heroText: orOfficial(data.hero_text, OFFICIAL_SETTINGS.heroText),
    heroImage: toImage(data.hero_image_path, data.hero_image_alt),
    impactTitle: orOfficial(data.impact_title, OFFICIAL_SETTINGS.impactTitle),
    impactText: orOfficial(data.impact_text, OFFICIAL_SETTINGS.impactText),
    impactImage: toImage(data.impact_image_path, data.impact_image_alt),
    contactEmail: orOfficial(data.contact_email, OFFICIAL_SETTINGS.contactEmail),
    contactPhone: orOfficial(data.contact_phone, OFFICIAL_SETTINGS.contactPhone),
    whatsappNumber: orOfficial(data.whatsapp_number, OFFICIAL_SETTINGS.whatsappNumber),
    address: data.address,
    socialLinks: withOfficial(safeSocialLinks(data.social_links), OFFICIAL_SETTINGS.socialLinks),
    donationMinAmount: data.donation_min_amount ?? OFFICIAL_SETTINGS.donationMinAmount,
    donationSuggestedAmounts: nonEmpty((data.donation_suggested_amounts ?? []).map(Number), OFFICIAL_SETTINGS.donationSuggestedAmounts),
    offlineDonationInstructions: nonEmpty(
      safeInstructions(data.offline_donation_instructions),
      OFFICIAL_SETTINGS.offlineDonationInstructions,
    ),
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
  const official = AREAS.find((area) => area.slug === row.slug);
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: orOfficial(row.summary, official?.summary ?? null),
    description: orOfficial(row.description, official?.description ?? null),
    actions: official?.actions ?? [],
    image: toImage(row.image_path, row.image_alt, row.title),
    displayOrder: row.display_order,
  };
}

/** Les 7 domaines officiels, affichés tant qu'aucun domaine n'est activé dans l'administration. */
const OFFICIAL_AREAS: ActionArea[] = AREAS.map((area, index) => ({
  id: `officiel-${area.slug}`,
  slug: area.slug,
  title: area.title,
  summary: area.summary,
  description: area.description,
  actions: area.actions,
  image: null,
  displayOrder: index + 1,
}));

/** Domaines ACTIFS, dans l'ordre choisi par l'administration. */
export async function listActionAreas(): Promise<ActionArea[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.areas);

  const db = getReader();
  if (!db) return OFFICIAL_AREAS;
  const { data, error } = await db.from("action_areas").select(AREA_COLUMNS).order("display_order");
  if (error) {
    logReadError("action_areas", error);
    return OFFICIAL_AREAS;
  }
  const areas = (data as AreaRow[]).map(toArea);
  return areas.length > 0 ? areas : OFFICIAL_AREAS;
}

/** Un domaine publié (ou officiel, tant qu'aucun n'est activé), ou null. */
export async function getActionArea(slug: string): Promise<ActionArea | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.areas);

  const areas = await listActionAreas();
  return areas.find((area) => area.slug === slug) ?? null;
}

// ---------------------------------------------------------------------------
// Équipe et partenaires
// ---------------------------------------------------------------------------

/** Composition officielle des instances, affichée tant que l'équipe n'est pas publiée dans l'administration. */
const OFFICIAL_TEAM: TeamMember[] = TEAM.map((member, index) => ({
  id: `officiel-${index + 1}`,
  fullName: member.fullName,
  position: member.position,
  group: member.group,
  bio: member.bio,
  photo: null,
}));

export async function listTeamMembers(): Promise<TeamMember[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.team);

  const db = getReader();
  if (!db) return OFFICIAL_TEAM;
  const { data, error } = await db
    .from("team_members")
    .select("id, full_name, position, bio, photo_path, team_group")
    .order("display_order")
    .order("full_name");
  if (error) {
    logReadError("team_members", error);
    return OFFICIAL_TEAM;
  }
  if (data.length === 0) return OFFICIAL_TEAM;
  return data.map((row) => ({
    id: row.id,
    fullName: row.full_name,
    position: row.position,
    group: isTeamGroup(row.team_group) ? row.team_group : DEFAULT_TEAM_GROUP,
    bio: row.bio,
    photo: toImage(row.photo_path, null, `Portrait de ${row.full_name}`),
  }));
}

/** Partenaires et sponsors transmis par l'ONG, affichés tant qu'aucun n'est publié dans l'administration. */
const OFFICIAL_PARTNERS: Partner[] = PARTNERS.map((name, index) => ({
  id: `officiel-${index + 1}`,
  name,
  kind: "partner",
  description: null,
  logo: null,
  websiteUrl: null,
}));

export async function listPartners(): Promise<Partner[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.partners);

  const db = getReader();
  if (!db) return OFFICIAL_PARTNERS;
  const { data, error } = await db
    .from("partners")
    .select("id, name, kind, description, logo_path, website_url")
    .order("kind")
    .order("display_order");
  if (error) {
    logReadError("partners", error);
    return OFFICIAL_PARTNERS;
  }
  if (data.length === 0) return OFFICIAL_PARTNERS;
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
