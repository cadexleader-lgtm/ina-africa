import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import type { GalleryItem, Paginated, Project, ProjectStatus, ProjectSummary } from "@/lib/types/content";
import { EMPTY_DOC, richTextDocSchema, type RichTextDoc } from "@/lib/validation/rich-text";
import { emptyPage, getReader, logReadError, pageRange, paginated, toImage } from "@/server/data/reader";
import { GALLERY_COLUMNS, toGalleryItem, type GalleryRow } from "@/server/data/site";
import { TAGS } from "@/server/data/tags";

const SUMMARY_COLUMNS =
  "id, slug, title, summary, location, start_date, end_date, status, is_featured, published_at, cover_image_path, cover_image_alt, action_area:action_areas(slug, title)";

type ProjectRow = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  location: string | null;
  start_date: string | null;
  end_date: string | null;
  status: ProjectStatus;
  is_featured: boolean;
  published_at: string | null;
  cover_image_path: string | null;
  cover_image_alt: string | null;
  action_area: { slug: string; title: string } | { slug: string; title: string }[] | null;
};

function one<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function toSummary(row: ProjectRow): ProjectSummary {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    location: row.location,
    startDate: row.start_date,
    endDate: row.end_date,
    status: row.status,
    isFeatured: row.is_featured,
    publishedAt: row.published_at,
    cover: toImage(row.cover_image_path, row.cover_image_alt, row.title),
    area: one(row.action_area),
  };
}

export const PROJECTS_PAGE_SIZE = 12;

export type ProjectFilters = {
  /** Adresse d'un domaine actif. */
  area?: string;
  status?: Exclude<ProjectStatus, "archived">;
  page?: number;
};

/** Projets publiés (hors archivés), filtrables par domaine et par statut. */
export async function listProjects(filters: ProjectFilters = {}): Promise<Paginated<ProjectSummary>> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.projects);

  const db = getReader();
  if (!db) return emptyPage(PROJECTS_PAGE_SIZE);
  const range = pageRange(filters.page ?? 1, PROJECTS_PAGE_SIZE);

  // Avec un filtre de domaine, la jointure devient obligatoire (!inner).
  const columns = filters.area
    ? SUMMARY_COLUMNS.replace("action_areas(", "action_areas!inner(")
    : SUMMARY_COLUMNS;
  let query = db
    .from("projects")
    .select(columns, { count: "exact" })
    .neq("status", "archived")
    .order("published_at", { ascending: false });
  if (filters.area) query = query.eq("action_area.slug", filters.area);
  if (filters.status) query = query.eq("status", filters.status);

  const { data, error, count } = await query.range(range.from, range.to);
  if (error) {
    logReadError("projects", error);
    return emptyPage(PROJECTS_PAGE_SIZE);
  }
  const items = (data as unknown as ProjectRow[]).map(toSummary);
  return paginated(items, count ?? items.length, range.page, PROJECTS_PAGE_SIZE);
}

/** Accueil : le projet mis en avant (ou le plus récent), puis les deux suivants. */
export async function listHomeProjects(limit = 3): Promise<ProjectSummary[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.projects);

  const db = getReader();
  if (!db) return [];
  const { data, error } = await db
    .from("projects")
    .select(SUMMARY_COLUMNS)
    .neq("status", "archived")
    .order("is_featured", { ascending: false })
    .order("published_at", { ascending: false })
    .limit(limit);
  if (error) {
    logReadError("projects", error);
    return [];
  }
  return (data as unknown as ProjectRow[]).map(toSummary);
}

/** Projets publiés d'un domaine (« actions associées »). */
export async function listProjectsByArea(areaSlug: string, limit = 6): Promise<ProjectSummary[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.projects, TAGS.areas);
  const page = await listProjects({ area: areaSlug });
  return page.items.slice(0, limit);
}

export async function getProject(slug: string): Promise<Project | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.projects, TAGS.project(slug), TAGS.gallery);

  const db = getReader();
  if (!db) return null;
  const { data, error } = await db
    .from("projects")
    .select(`${SUMMARY_COLUMNS}, content, seo_title, seo_description`)
    .eq("slug", slug)
    .maybeSingle();
  if (error) logReadError("projects", error);
  if (!data) return null;

  const row = data as unknown as ProjectRow & { content: unknown; seo_title: string | null; seo_description: string | null };
  const { data: photos, error: photosError } = await db
    .from("gallery_items")
    .select(GALLERY_COLUMNS)
    .eq("project_id", row.id)
    .order("display_order");
  if (photosError) logReadError("gallery_items (projet)", photosError);

  const parsed = richTextDocSchema.safeParse(row.content);
  return {
    ...toSummary(row),
    content: parsed.success ? (parsed.data as RichTextDoc) : EMPTY_DOC,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    photos: ((photos ?? []) as GalleryRow[]).map(toGalleryItem).filter((item): item is GalleryItem => item !== null),
  };
}

/** Pour le plan du site. */
export async function listProjectSlugs(): Promise<{ slug: string; updatedAt: string | null }[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.projects);

  const db = getReader();
  if (!db) return [];
  const { data, error } = await db.from("projects").select("slug, published_at").neq("status", "archived");
  if (error) {
    logReadError("projects (plan du site)", error);
    return [];
  }
  return data.map((row) => ({ slug: row.slug, updatedAt: row.published_at }));
}
