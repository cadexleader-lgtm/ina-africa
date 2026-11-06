import "server-only";

import { galleryFiltersSchema, projectFiltersSchema } from "@/lib/validation/admin/content";
import { check } from "@/server/admin/action";
import { sanitizeSearch } from "@/server/data/articles";
import { ADMIN_PAGE_SIZE, adminReader, isUuid, toDoc } from "@/server/data/admin/reader";
import type {
  AdminActionArea,
  AdminGalleryItem,
  AdminPartner,
  AdminProject,
  AdminProjectListItem,
  AdminTeamMember,
  Paginated,
  ProjectStatus,
} from "@/server/data/admin/types";
import { pageRange, paginated } from "@/server/data/reader";

/*
 * Projets, domaines, partenaires, équipe, galerie : lecture par toute
 * l'équipe (règles RLS « l'équipe lit tout »), modification par les admins.
 */

// ---------------------------------------------------------------------------
// Projets
// ---------------------------------------------------------------------------

type ProjectRow = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  content: unknown;
  location: string | null;
  start_date: string | null;
  end_date: string | null;
  status: ProjectStatus;
  action_area_id: string | null;
  is_featured: boolean;
  cover_image_path: string | null;
  cover_image_alt: string | null;
  seo_title: string | null;
  seo_description: string | null;
  is_published: boolean;
  published_at: string | null;
  updated_at: string;
};

export async function listAdminProjects(filters: unknown = {}): Promise<Paginated<AdminProjectListItem>> {
  const { db } = await adminReader("editor");
  const f = projectFiltersSchema.parse(filters ?? {});
  const range = pageRange(f.page, ADMIN_PAGE_SIZE);
  let query = db
    .from("projects")
    .select("id, title, slug, status, is_published, is_featured, published_at, updated_at", { count: "exact" });
  if (f.published) query = query.eq("is_published", f.published === "yes");
  const q = sanitizeSearch(f.q);
  if (q) query = query.ilike("title", `%${q}%`);
  const result = await query.order("updated_at", { ascending: false }).range(range.from, range.to);
  const rows = (check(result) ?? []) as unknown as ProjectRow[];
  const items = rows.map((row) => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    status: row.status,
    isPublished: row.is_published,
    isFeatured: row.is_featured,
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
  }));
  return paginated(items, result.count ?? items.length, range.page, ADMIN_PAGE_SIZE);
}

export async function getAdminProject(id: string): Promise<AdminProject | null> {
  const { db } = await adminReader("editor");
  if (!isUuid(id)) return null;
  const row = check(
    await db
      .from("projects")
      .select(
        "id, title, slug, summary, content, location, start_date, end_date, status, action_area_id, is_featured, cover_image_path, cover_image_alt, seo_title, seo_description, is_published, published_at, updated_at",
      )
      .eq("id", id)
      .maybeSingle(),
  ) as unknown as ProjectRow | null;
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    summary: row.summary,
    content: toDoc(row.content),
    location: row.location,
    startDate: row.start_date,
    endDate: row.end_date,
    status: row.status,
    actionAreaId: row.action_area_id,
    isFeatured: row.is_featured,
    coverImagePath: row.cover_image_path,
    coverImageAlt: row.cover_image_alt,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    isPublished: row.is_published,
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
  };
}

// ---------------------------------------------------------------------------
// Domaines d'intervention
// ---------------------------------------------------------------------------

type AreaRow = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  description: string | null;
  image_path: string | null;
  image_alt: string | null;
  display_order: number;
  is_active: boolean;
};

const AREA_COLUMNS = "id, title, slug, summary, description, image_path, image_alt, display_order, is_active";

function toArea(row: AreaRow): AdminActionArea {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    summary: row.summary,
    description: row.description,
    imagePath: row.image_path,
    imageAlt: row.image_alt,
    displayOrder: row.display_order,
    isActive: row.is_active,
  };
}

/** Tous les domaines (actifs ou non), dans l'ordre d'affichage. */
export async function listAdminActionAreas(): Promise<AdminActionArea[]> {
  const { db } = await adminReader("editor");
  const rows = check(await db.from("action_areas").select(AREA_COLUMNS).order("display_order").order("title"));
  return ((rows ?? []) as unknown as AreaRow[]).map(toArea);
}

export async function getAdminActionArea(id: string): Promise<AdminActionArea | null> {
  const { db } = await adminReader("editor");
  if (!isUuid(id)) return null;
  const row = check(await db.from("action_areas").select(AREA_COLUMNS).eq("id", id).maybeSingle());
  return row ? toArea(row as unknown as AreaRow) : null;
}

// ---------------------------------------------------------------------------
// Partenaires et sponsors
// ---------------------------------------------------------------------------

type PartnerRow = {
  id: string;
  name: string;
  kind: "partner" | "sponsor";
  description: string | null;
  logo_path: string | null;
  website_url: string | null;
  display_order: number;
  is_active: boolean;
};

const PARTNER_COLUMNS = "id, name, kind, description, logo_path, website_url, display_order, is_active";

function toPartner(row: PartnerRow): AdminPartner {
  return {
    id: row.id,
    name: row.name,
    kind: row.kind,
    description: row.description,
    logoPath: row.logo_path,
    websiteUrl: row.website_url,
    displayOrder: row.display_order,
    isActive: row.is_active,
  };
}

export async function listAdminPartners(): Promise<AdminPartner[]> {
  const { db } = await adminReader("editor");
  const rows = check(await db.from("partners").select(PARTNER_COLUMNS).order("kind").order("display_order").order("name"));
  return ((rows ?? []) as unknown as PartnerRow[]).map(toPartner);
}

export async function getAdminPartner(id: string): Promise<AdminPartner | null> {
  const { db } = await adminReader("editor");
  if (!isUuid(id)) return null;
  const row = check(await db.from("partners").select(PARTNER_COLUMNS).eq("id", id).maybeSingle());
  return row ? toPartner(row as unknown as PartnerRow) : null;
}

// ---------------------------------------------------------------------------
// Équipe
// ---------------------------------------------------------------------------

type TeamRow = {
  id: string;
  full_name: string;
  position: string;
  bio: string | null;
  photo_path: string | null;
  display_order: number;
  is_active: boolean;
};

const TEAM_COLUMNS = "id, full_name, position, bio, photo_path, display_order, is_active";

function toTeamMember(row: TeamRow): AdminTeamMember {
  return {
    id: row.id,
    fullName: row.full_name,
    position: row.position,
    bio: row.bio,
    photoPath: row.photo_path,
    displayOrder: row.display_order,
    isActive: row.is_active,
  };
}

export async function listAdminTeamMembers(): Promise<AdminTeamMember[]> {
  const { db } = await adminReader("editor");
  const rows = check(await db.from("team_members").select(TEAM_COLUMNS).order("display_order").order("full_name"));
  return ((rows ?? []) as unknown as TeamRow[]).map(toTeamMember);
}

export async function getAdminTeamMember(id: string): Promise<AdminTeamMember | null> {
  const { db } = await adminReader("editor");
  if (!isUuid(id)) return null;
  const row = check(await db.from("team_members").select(TEAM_COLUMNS).eq("id", id).maybeSingle());
  return row ? toTeamMember(row as unknown as TeamRow) : null;
}

// ---------------------------------------------------------------------------
// Galerie
// ---------------------------------------------------------------------------

type GalleryRow = {
  id: string;
  item_type: "photo" | "video";
  image_path: string | null;
  image_alt: string | null;
  video_provider: "youtube" | "facebook" | null;
  video_url: string | null;
  caption: string | null;
  taken_on: string | null;
  project_id: string | null;
  display_order: number;
  is_published: boolean;
};

const GALLERY_COLUMNS =
  "id, item_type, image_path, image_alt, video_provider, video_url, caption, taken_on, project_id, display_order, is_published";

function toGalleryItem(row: GalleryRow): AdminGalleryItem {
  return {
    id: row.id,
    itemType: row.item_type,
    imagePath: row.image_path,
    imageAlt: row.image_alt,
    videoProvider: row.video_provider,
    videoUrl: row.video_url,
    caption: row.caption,
    takenOn: row.taken_on,
    projectId: row.project_id,
    displayOrder: row.display_order,
    isPublished: row.is_published,
  };
}

export async function listAdminGalleryItems(filters: unknown = {}): Promise<Paginated<AdminGalleryItem>> {
  const { db } = await adminReader("editor");
  const f = galleryFiltersSchema.parse(filters ?? {});
  const range = pageRange(f.page, ADMIN_PAGE_SIZE);
  let query = db.from("gallery_items").select(GALLERY_COLUMNS, { count: "exact" });
  if (f.projectId) query = query.eq("project_id", f.projectId);
  const result = await query
    .order("display_order")
    .order("taken_on", { ascending: false, nullsFirst: false })
    .range(range.from, range.to);
  const items = ((check(result) ?? []) as unknown as GalleryRow[]).map(toGalleryItem);
  return paginated(items, result.count ?? items.length, range.page, ADMIN_PAGE_SIZE);
}

export async function getAdminGalleryItem(id: string): Promise<AdminGalleryItem | null> {
  const { db } = await adminReader("editor");
  if (!isUuid(id)) return null;
  const row = check(await db.from("gallery_items").select(GALLERY_COLUMNS).eq("id", id).maybeSingle());
  return row ? toGalleryItem(row as unknown as GalleryRow) : null;
}
