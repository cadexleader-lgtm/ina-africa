import { z } from "zod";

import { youtubeId } from "@/lib/video";
import {
  ADMIN_MESSAGES as M,
  displayOrderField,
  flagField,
  idField,
  optionalAlt,
  optionalDateField,
  optionalIdField,
  optionalLine,
  optionalSlugField,
  optionalStoragePath,
  optionalText,
  optionalWebUrl,
  pageField,
  requireAltFor,
  requiredLine,
  requiredStoragePath,
  richDoc,
  videoProviderOf,
} from "@/lib/validation/admin/common";

/*
 * Contenus du site : articles, catégories, projets, domaines, partenaires,
 * équipe, galerie. Limites = contraintes SQL de
 * supabase/migrations/…100400_site_content.sql et …090000_frontend_content_fields.sql.
 */

const seoFields = {
  seoTitle: optionalLine(70),
  seoDescription: optionalLine(160),
};

// ---------------------------------------------------------------------------
// Articles
// ---------------------------------------------------------------------------

export const articleInputSchema = z
  .object({
    title: requiredLine(3, 200, "Indiquez le titre de l'article."),
    slug: optionalSlugField,
    excerpt: optionalText(500),
    content: richDoc,
    coverImagePath: optionalStoragePath,
    coverImageAlt: optionalAlt,
    categoryId: optionalIdField,
    ...seoFields,
  })
  .superRefine(requireAltFor("coverImagePath", "coverImageAlt"));

export type ArticleInput = z.output<typeof articleInputSchema>;

export const articleUpdateSchema = z.object({ id: idField }).and(articleInputSchema);

/** Remarque de relecture (interne, ≤ 2 000 caractères). */
export const reviewNoteSchema = z.object({
  id: idField,
  reviewNote: optionalText(2000),
});

/** Renvoi en brouillon d'un article en relecture : la remarque est obligatoire. */
export const rejectArticleSchema = z.object({
  id: idField,
  reviewNote: z.preprocess(
    (value) => (typeof value === "string" ? value.trim() : value),
    z
      .string({ error: "Expliquez à l'auteur ce qu'il faut corriger." })
      .min(3, "Expliquez à l'auteur ce qu'il faut corriger.")
      .max(2000, M.tooLong(2000)),
  ),
});

export const categoryInputSchema = z.object({
  name: requiredLine(2, 80, "Indiquez le nom de la catégorie."),
  slug: optionalSlugField,
  description: optionalText(500),
  displayOrder: displayOrderField,
});

export const categoryUpdateSchema = z.object({ id: idField }).and(categoryInputSchema);

// ---------------------------------------------------------------------------
// Projets
// ---------------------------------------------------------------------------

export const PROJECT_STATUSES = ["planned", "ongoing", "completed", "archived"] as const;

function datesInOrder<T extends Record<string, unknown>>(startKey: keyof T & string, endKey: keyof T & string) {
  return (data: T, ctx: z.RefinementCtx) => {
    const start = data[startKey];
    const end = data[endKey];
    if (typeof start === "string" && typeof end === "string" && end < start) {
      ctx.addIssue({ code: "custom", path: [endKey], message: M.dateOrder });
    }
  };
}

export const projectInputSchema = z
  .object({
    title: requiredLine(3, 200, "Indiquez le titre du projet."),
    slug: optionalSlugField,
    summary: optionalText(300),
    content: richDoc,
    location: optionalLine(200),
    startDate: optionalDateField,
    endDate: optionalDateField,
    status: z.enum(PROJECT_STATUSES, { error: "Choisissez l'état du projet." }),
    actionAreaId: optionalIdField,
    isFeatured: flagField,
    coverImagePath: optionalStoragePath,
    coverImageAlt: optionalAlt,
    ...seoFields,
  })
  .superRefine(requireAltFor("coverImagePath", "coverImageAlt"))
  .superRefine(datesInOrder("startDate", "endDate"));

export type ProjectInput = z.output<typeof projectInputSchema>;

export const projectUpdateSchema = z.object({ id: idField }).and(projectInputSchema);

// ---------------------------------------------------------------------------
// Publication / activation, ordre d'affichage
// ---------------------------------------------------------------------------

export const publishToggleSchema = z.object({ id: idField, published: flagField });

export const activeToggleSchema = z.object({ id: idField, active: flagField });

/** Nouvel ordre d'affichage : la liste complète des identifiants, dans l'ordre voulu. */
export const reorderSchema = z.object({
  ids: z
    .array(idField)
    .min(1, "La liste est vide.")
    .max(500)
    .refine((ids) => new Set(ids).size === ids.length, "Un élément apparaît deux fois."),
});

// ---------------------------------------------------------------------------
// Domaines d'intervention
// ---------------------------------------------------------------------------

export const actionAreaInputSchema = z
  .object({
    title: requiredLine(2, 120, "Indiquez le nom du domaine."),
    slug: optionalSlugField,
    summary: optionalText(300),
    description: optionalText(5000),
    imagePath: optionalStoragePath,
    imageAlt: optionalAlt,
    displayOrder: displayOrderField,
  })
  .superRefine(requireAltFor("imagePath", "imageAlt"));

export const actionAreaUpdateSchema = z.object({ id: idField }).and(actionAreaInputSchema);

// ---------------------------------------------------------------------------
// Partenaires et sponsors
// ---------------------------------------------------------------------------

export const PARTNER_KINDS = ["partner", "sponsor"] as const;

export const partnerInputSchema = z.object({
  name: requiredLine(2, 160, "Indiquez le nom du partenaire."),
  kind: z.enum(PARTNER_KINDS, { error: "Choisissez : partenaire ou sponsor." }),
  description: optionalText(2000),
  logoPath: optionalStoragePath,
  websiteUrl: optionalWebUrl,
  displayOrder: displayOrderField,
});

export const partnerUpdateSchema = z.object({ id: idField }).and(partnerInputSchema);

// ---------------------------------------------------------------------------
// Équipe
// ---------------------------------------------------------------------------

export const teamMemberInputSchema = z.object({
  fullName: requiredLine(2, 120, "Indiquez le nom de la personne."),
  position: requiredLine(2, 120, "Indiquez la fonction de la personne."),
  bio: optionalText(2000),
  photoPath: optionalStoragePath,
  displayOrder: displayOrderField,
});

export const teamMemberUpdateSchema = z.object({ id: idField }).and(teamMemberInputSchema);

// ---------------------------------------------------------------------------
// Galerie : photo de la médiathèque OU vidéo YouTube / Facebook
// ---------------------------------------------------------------------------

const galleryCommon = {
  caption: optionalText(500),
  takenOn: optionalDateField,
  projectId: optionalIdField,
  displayOrder: displayOrderField,
};

const galleryPhotoSchema = z.object({
  itemType: z.literal("photo"),
  imagePath: requiredStoragePath,
  imageAlt: optionalAlt,
  ...galleryCommon,
});

const videoUrlField = z.preprocess(
  (value) => (typeof value === "string" ? value.trim() : value),
  z
    .string({ error: M.video })
    .min(1, M.video)
    .max(500, M.tooLong(500))
    .refine((url) => videoProviderOf(url) !== null, M.video)
    .refine((url) => videoProviderOf(url) !== "youtube" || youtubeId(url) !== null, M.youtubeId),
);

const galleryVideoSchema = z.object({
  itemType: z.literal("video"),
  videoUrl: videoUrlField,
  /** Image d'aperçu facultative (de la médiathèque). */
  imagePath: optionalStoragePath,
  imageAlt: optionalAlt,
  ...galleryCommon,
});

export const galleryItemInputSchema = z
  .discriminatedUnion("itemType", [galleryPhotoSchema, galleryVideoSchema], {
    error: "Choisissez : photo ou vidéo.",
  })
  .superRefine(requireAltFor("imagePath", "imageAlt"))
  .transform((item) => ({
    ...item,
    // Le fournisseur est déduit de l'adresse : jamais fourni par le navigateur.
    videoProvider: item.itemType === "video" ? videoProviderOf(item.videoUrl) : null,
    videoUrl: item.itemType === "video" ? item.videoUrl : null,
  }));

export type GalleryItemInput = z.output<typeof galleryItemInputSchema>;

export const galleryItemUpdateSchema = z.object({ id: idField }).and(galleryItemInputSchema);

// ---------------------------------------------------------------------------
// Filtres des listes de l'administration (paramètres d'adresse : jamais d'erreur,
// une valeur invalide est simplement ignorée)
// ---------------------------------------------------------------------------

export const ARTICLE_STATUSES = ["draft", "in_review", "published", "archived"] as const;

const ignoreInvalid = <T extends z.ZodType>(schema: T) =>
  z.preprocess((value) => (value === "" || value === null ? undefined : value), schema.optional().catch(undefined));

const searchField = ignoreInvalid(z.string().max(200));

export const articleFiltersSchema = z.object({
  page: pageField,
  status: ignoreInvalid(z.enum(ARTICLE_STATUSES)),
  categoryId: ignoreInvalid(z.uuid()),
  q: searchField,
  /** Seulement mes articles. */
  mine: flagField.catch(false),
});

export type ArticleFilters = z.output<typeof articleFiltersSchema>;

export const projectFiltersSchema = z.object({
  page: pageField,
  published: ignoreInvalid(z.enum(["yes", "no"])),
  q: searchField,
});

export type ProjectFilters = z.output<typeof projectFiltersSchema>;

export const galleryFiltersSchema = z.object({
  page: pageField,
  projectId: ignoreInvalid(z.uuid()),
});

export type GalleryFilters = z.output<typeof galleryFiltersSchema>;
