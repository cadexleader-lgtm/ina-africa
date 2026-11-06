import { z } from "zod";

import { idField, optionalAlt, optionalLine, pageField } from "@/lib/validation/admin/common";

/*
 * Médiathèque. Les règles des fichiers (types, tailles) reprennent la
 * contrainte SQL media_type_and_size_allowed et la configuration des espaces
 * de stockage (supabase/migrations/…100300_media_and_storage.sql).
 */

export const MEDIA_BUCKETS = ["public-media", "private-documents"] as const;
export type MediaBucket = (typeof MEDIA_BUCKETS)[number];

export type MediaMime = "image/jpeg" | "image/png" | "image/webp" | "application/pdf";

export const MEDIA_RULES: Record<MediaBucket, { types: readonly MediaMime[]; maxBytes: number }> = {
  "public-media": { types: ["image/jpeg", "image/png", "image/webp"], maxBytes: 5 * 1024 * 1024 },
  "private-documents": { types: ["application/pdf", "image/jpeg", "image/png", "image/webp"], maxBytes: 10 * 1024 * 1024 },
};

export const MEDIA_EXTENSIONS: Record<MediaMime, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

/** Dossiers de rangement (premier segment du chemin). */
export const MEDIA_FOLDERS = [
  "articles",
  "projets",
  "domaines",
  "partenaires",
  "equipe",
  "galerie",
  "appels",
  "site",
  "divers",
  // Espace privé : justificatifs des dons hors ligne (dossier imposé).
  "justificatifs",
] as const;

export const mediaUploadFieldsSchema = z.object({
  bucket: z.enum(MEDIA_BUCKETS, { error: "Espace de stockage invalide." }),
  folder: z.preprocess((value) => (value === "" || value === null ? undefined : value), z.enum(MEDIA_FOLDERS).default("divers")),
  altText: optionalAlt,
});

export const mediaUpdateSchema = z.object({
  id: idField,
  altText: optionalAlt,
  fileName: optionalLine(255).optional(),
});

export const mediaFiltersSchema = z.object({
  page: pageField,
  bucket: z.enum(MEDIA_BUCKETS).catch("public-media"),
});

export type MediaFilters = z.output<typeof mediaFiltersSchema>;
