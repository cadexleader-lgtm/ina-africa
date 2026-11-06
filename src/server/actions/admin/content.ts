"use server";

import { idInputSchema } from "@/lib/validation/admin/common";
import {
  actionAreaInputSchema,
  actionAreaUpdateSchema,
  activeToggleSchema,
  galleryItemInputSchema,
  galleryItemUpdateSchema,
  partnerInputSchema,
  partnerUpdateSchema,
  projectInputSchema,
  projectUpdateSchema,
  publishToggleSchema,
  reorderSchema,
  teamMemberInputSchema,
  teamMemberUpdateSchema,
  type GalleryItemInput,
  type ProjectInput,
} from "@/lib/validation/admin/content";
import { isEmptyDoc, type RichTextDoc } from "@/lib/validation/rich-text";
import {
  adminAction,
  deleteRow,
  insertRow,
  invalidate,
  loadRow,
  reorderRows,
  updateRow,
} from "@/server/admin/action";
import { resolveSlug } from "@/server/admin/slug";
import { TAGS } from "@/server/data/tags";
import { AppError, type ActionResult } from "@/server/errors";

/*
 * Projets, domaines d'intervention, partenaires / sponsors, équipe, galerie.
 * Gestion réservée aux admins (règles RLS « gestion admin »). Tout naît
 * non publié / inactif ; la publication et l'activation sont des actions
 * séparées. Chaque écriture invalide les étiquettes du cache public qui
 * affichent ces contenus (src/server/data/tags.ts).
 */

type Ref = { id: string };
type SlugRef = { id: string; slug: string };

// ---------------------------------------------------------------------------
// Projets
// ---------------------------------------------------------------------------

type ProjectRef = SlugRef & { is_published: boolean };

const PROJECT_REF = "id, slug, is_published";

function projectTags(...slugs: (string | undefined)[]) {
  return [TAGS.projects, ...slugs.map((slug) => (slug ? TAGS.project(slug) : undefined))];
}

function toProjectRow(data: ProjectInput) {
  return {
    title: data.title,
    slug: resolveSlug(data.slug, data.title),
    summary: data.summary,
    content: data.content,
    location: data.location,
    start_date: data.startDate,
    end_date: data.endDate,
    status: data.status,
    action_area_id: data.actionAreaId,
    is_featured: data.isFeatured,
    cover_image_path: data.coverImagePath,
    cover_image_alt: data.coverImageAlt,
    seo_title: data.seoTitle,
    seo_description: data.seoDescription,
  };
}

export async function createProject(input: unknown): Promise<ActionResult<ProjectRef>> {
  return adminAction("admin", projectInputSchema, input, async (data, { db }) => {
    const row = await insertRow<ProjectRef>(db, "projects", { ...toProjectRow(data), is_published: false }, PROJECT_REF);
    invalidate(TAGS.projects);
    return row;
  });
}

export async function updateProject(input: unknown): Promise<ActionResult<ProjectRef>> {
  return adminAction("admin", projectUpdateSchema, input, async (data, { db }) => {
    const current = await loadRow<ProjectRef>(db, "projects", data.id, PROJECT_REF);
    const row = await updateRow<ProjectRef>(db, "projects", data.id, toProjectRow(data), PROJECT_REF);
    invalidate(...projectTags(current.slug, row.slug));
    return row;
  });
}

export async function setProjectPublished(input: unknown): Promise<ActionResult<ProjectRef>> {
  return adminAction("admin", publishToggleSchema, input, async ({ id, published }, { db }) => {
    if (published) {
      const project = await loadRow<{ content: RichTextDoc; summary: string | null }>(db, "projects", id, "content, summary");
      if (isEmptyDoc(project.content) && !project.summary) {
        throw new AppError("VALIDATION", "Ajoutez un résumé ou une description avant de publier le projet.");
      }
    }
    const row = await updateRow<ProjectRef>(db, "projects", id, { is_published: published }, PROJECT_REF);
    invalidate(...projectTags(row.slug));
    return row;
  });
}

/** Les photos de la galerie liées au projet restent, sans projet. */
export async function deleteProject(input: unknown): Promise<ActionResult<Ref>> {
  return adminAction("admin", idInputSchema, input, async ({ id }, { db }) => {
    const current = await loadRow<ProjectRef>(db, "projects", id, PROJECT_REF);
    await deleteRow(db, "projects", id);
    invalidate(...projectTags(current.slug), TAGS.gallery);
    return { id };
  });
}

// ---------------------------------------------------------------------------
// Domaines d'intervention (le domaine d'un projet est affiché sur ses cartes)
// ---------------------------------------------------------------------------

const AREA_TAGS = [TAGS.areas, TAGS.projects];
type AreaRef = SlugRef & { is_active: boolean };
const AREA_REF = "id, slug, is_active";

function toAreaRow(data: {
  title: string;
  slug: string | null;
  summary: string | null;
  description: string | null;
  imagePath: string | null;
  imageAlt: string | null;
  displayOrder: number;
}) {
  return {
    title: data.title,
    slug: resolveSlug(data.slug, data.title),
    summary: data.summary,
    description: data.description,
    image_path: data.imagePath,
    image_alt: data.imageAlt,
    display_order: data.displayOrder,
  };
}

export async function createActionArea(input: unknown): Promise<ActionResult<AreaRef>> {
  return adminAction("admin", actionAreaInputSchema, input, async (data, { db }) => {
    const row = await insertRow<AreaRef>(db, "action_areas", { ...toAreaRow(data), is_active: false }, AREA_REF);
    invalidate(...AREA_TAGS);
    return row;
  });
}

export async function updateActionArea(input: unknown): Promise<ActionResult<AreaRef>> {
  return adminAction("admin", actionAreaUpdateSchema, input, async (data, { db }) => {
    const row = await updateRow<AreaRef>(db, "action_areas", data.id, toAreaRow(data), AREA_REF);
    invalidate(...AREA_TAGS);
    return row;
  });
}

export async function setActionAreaActive(input: unknown): Promise<ActionResult<AreaRef>> {
  return adminAction("admin", activeToggleSchema, input, async ({ id, active }, { db }) => {
    const row = await updateRow<AreaRef>(db, "action_areas", id, { is_active: active }, AREA_REF);
    invalidate(...AREA_TAGS);
    return row;
  });
}

export async function reorderActionAreas(input: unknown): Promise<ActionResult<null>> {
  return adminAction("admin", reorderSchema, input, async ({ ids }, { db }) => {
    await reorderRows(db, "action_areas", ids);
    invalidate(...AREA_TAGS);
    return null;
  });
}

/** Les projets du domaine restent, sans domaine. */
export async function deleteActionArea(input: unknown): Promise<ActionResult<Ref>> {
  return adminAction("admin", idInputSchema, input, async ({ id }, { db }) => {
    await deleteRow(db, "action_areas", id);
    invalidate(...AREA_TAGS);
    return { id };
  });
}

// ---------------------------------------------------------------------------
// Partenaires et sponsors
// ---------------------------------------------------------------------------

type ActiveRef = Ref & { is_active: boolean };
const ACTIVE_REF = "id, is_active";

function toPartnerRow(data: {
  name: string;
  kind: "partner" | "sponsor";
  description: string | null;
  logoPath: string | null;
  websiteUrl: string | null;
  displayOrder: number;
}) {
  return {
    name: data.name,
    kind: data.kind,
    description: data.description,
    logo_path: data.logoPath,
    website_url: data.websiteUrl,
    display_order: data.displayOrder,
  };
}

export async function createPartner(input: unknown): Promise<ActionResult<ActiveRef>> {
  return adminAction("admin", partnerInputSchema, input, async (data, { db }) => {
    const row = await insertRow<ActiveRef>(db, "partners", { ...toPartnerRow(data), is_active: false }, ACTIVE_REF);
    invalidate(TAGS.partners);
    return row;
  });
}

export async function updatePartner(input: unknown): Promise<ActionResult<ActiveRef>> {
  return adminAction("admin", partnerUpdateSchema, input, async (data, { db }) => {
    const row = await updateRow<ActiveRef>(db, "partners", data.id, toPartnerRow(data), ACTIVE_REF);
    invalidate(TAGS.partners);
    return row;
  });
}

export async function setPartnerActive(input: unknown): Promise<ActionResult<ActiveRef>> {
  return adminAction("admin", activeToggleSchema, input, async ({ id, active }, { db }) => {
    const row = await updateRow<ActiveRef>(db, "partners", id, { is_active: active }, ACTIVE_REF);
    invalidate(TAGS.partners);
    return row;
  });
}

export async function reorderPartners(input: unknown): Promise<ActionResult<null>> {
  return adminAction("admin", reorderSchema, input, async ({ ids }, { db }) => {
    await reorderRows(db, "partners", ids);
    invalidate(TAGS.partners);
    return null;
  });
}

export async function deletePartner(input: unknown): Promise<ActionResult<Ref>> {
  return adminAction("admin", idInputSchema, input, async ({ id }, { db }) => {
    await deleteRow(db, "partners", id);
    invalidate(TAGS.partners);
    return { id };
  });
}

// ---------------------------------------------------------------------------
// Équipe
// ---------------------------------------------------------------------------

function toTeamRow(data: {
  fullName: string;
  position: string;
  bio: string | null;
  photoPath: string | null;
  displayOrder: number;
}) {
  return {
    full_name: data.fullName,
    position: data.position,
    bio: data.bio,
    photo_path: data.photoPath,
    display_order: data.displayOrder,
  };
}

export async function createTeamMember(input: unknown): Promise<ActionResult<ActiveRef>> {
  return adminAction("admin", teamMemberInputSchema, input, async (data, { db }) => {
    const row = await insertRow<ActiveRef>(db, "team_members", { ...toTeamRow(data), is_active: false }, ACTIVE_REF);
    invalidate(TAGS.team);
    return row;
  });
}

export async function updateTeamMember(input: unknown): Promise<ActionResult<ActiveRef>> {
  return adminAction("admin", teamMemberUpdateSchema, input, async (data, { db }) => {
    const row = await updateRow<ActiveRef>(db, "team_members", data.id, toTeamRow(data), ACTIVE_REF);
    invalidate(TAGS.team);
    return row;
  });
}

export async function setTeamMemberActive(input: unknown): Promise<ActionResult<ActiveRef>> {
  return adminAction("admin", activeToggleSchema, input, async ({ id, active }, { db }) => {
    const row = await updateRow<ActiveRef>(db, "team_members", id, { is_active: active }, ACTIVE_REF);
    invalidate(TAGS.team);
    return row;
  });
}

export async function reorderTeamMembers(input: unknown): Promise<ActionResult<null>> {
  return adminAction("admin", reorderSchema, input, async ({ ids }, { db }) => {
    await reorderRows(db, "team_members", ids);
    invalidate(TAGS.team);
    return null;
  });
}

export async function deleteTeamMember(input: unknown): Promise<ActionResult<Ref>> {
  return adminAction("admin", idInputSchema, input, async ({ id }, { db }) => {
    await deleteRow(db, "team_members", id);
    invalidate(TAGS.team);
    return { id };
  });
}

// ---------------------------------------------------------------------------
// Galerie (les photos d'un projet sont affichées sur sa page : étiquette gallery)
// ---------------------------------------------------------------------------

type GalleryRef = Ref & { is_published: boolean };
const GALLERY_REF = "id, is_published";

function toGalleryRow(data: GalleryItemInput) {
  return {
    item_type: data.itemType,
    image_path: data.imagePath,
    image_alt: data.imageAlt,
    video_provider: data.videoProvider,
    video_url: data.videoUrl,
    caption: data.caption,
    taken_on: data.takenOn,
    project_id: data.projectId,
    display_order: data.displayOrder,
  };
}

export async function createGalleryItem(input: unknown): Promise<ActionResult<GalleryRef>> {
  return adminAction("admin", galleryItemInputSchema, input, async (data, { db }) => {
    const row = await insertRow<GalleryRef>(db, "gallery_items", { ...toGalleryRow(data), is_published: false }, GALLERY_REF);
    invalidate(TAGS.gallery);
    return row;
  });
}

export async function updateGalleryItem(input: unknown): Promise<ActionResult<GalleryRef>> {
  return adminAction("admin", galleryItemUpdateSchema, input, async (data, { db }) => {
    const row = await updateRow<GalleryRef>(db, "gallery_items", data.id, toGalleryRow(data), GALLERY_REF);
    invalidate(TAGS.gallery);
    return row;
  });
}

export async function setGalleryItemPublished(input: unknown): Promise<ActionResult<GalleryRef>> {
  return adminAction("admin", publishToggleSchema, input, async ({ id, published }, { db }) => {
    const row = await updateRow<GalleryRef>(db, "gallery_items", id, { is_published: published }, GALLERY_REF);
    invalidate(TAGS.gallery);
    return row;
  });
}

export async function reorderGalleryItems(input: unknown): Promise<ActionResult<null>> {
  return adminAction("admin", reorderSchema, input, async ({ ids }, { db }) => {
    await reorderRows(db, "gallery_items", ids);
    invalidate(TAGS.gallery);
    return null;
  });
}

export async function deleteGalleryItem(input: unknown): Promise<ActionResult<Ref>> {
  return adminAction("admin", idInputSchema, input, async ({ id }, { db }) => {
    await deleteRow(db, "gallery_items", id);
    invalidate(TAGS.gallery);
    return { id };
  });
}
