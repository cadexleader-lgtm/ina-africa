import "server-only";

import {
  MEDIA_EXTENSIONS,
  MEDIA_RULES,
  type MediaBucket,
  type MediaMime,
} from "@/lib/validation/admin/media";
import { cleanLine } from "@/lib/validation/forms";
import { check, type SessionDb } from "@/server/admin/action";
import { detectFileType } from "@/server/admin/file-type";
import { AppError } from "@/server/errors";

/*
 * Envoi et suppression des fichiers de la médiathèque.
 *
 * Convention des images publiques (src/lib/media.ts) : une image WebP
 * `<nom>.webp` est servie avec sa petite version `<nom>-sm.webp` (srcset).
 *  - Le navigateur de l'administration convertit les photos en WebP (≈ 2000
 *    et ≈ 800 px) et envoie les deux fichiers : `file` et `small`.
 *  - Si la petite version manque, la grande est copiée sous le nom `-sm` :
 *    le srcset ne pointe jamais vers un fichier absent.
 *  - Une image JPEG ou PNG (navigateur sans conversion WebP) est gardée
 *    telle quelle : son adresse ne finit pas par .webp, le site n'annonce
 *    donc pas de petite version (aucune adresse cassée).
 * Aucune dépendance de traitement d'image côté serveur.
 */

export const MEDIA_MESSAGES = {
  missing: "Choisissez un fichier à envoyer.",
  tooLarge: (bucket: MediaBucket) =>
    `Ce fichier est trop lourd : ${MEDIA_RULES[bucket].maxBytes / 1024 / 1024} Mo au plus.`,
  badType: (bucket: MediaBucket) =>
    bucket === "public-media"
      ? "Format non accepté : seules les images JPEG, PNG ou WebP sont acceptées."
      : "Format non accepté : seuls les PDF et les images JPEG, PNG ou WebP sont acceptés.",
  badSmall: "La petite version de l'image doit être une image WebP.",
  storage: "L'envoi du fichier a échoué. Réessayez dans un instant.",
} as const;

export type CheckedFile = { bytes: Uint8Array; type: MediaMime; size: number; name: string };

function isFile(value: FormDataEntryValue | null): value is File {
  return typeof value === "object" && value !== null && typeof (value as Blob).arrayBuffer === "function";
}

/**
 * Contrôle un fichier reçu : présent, taille dans la limite de l'espace,
 * type RÉEL (premiers octets) accepté par cet espace. Le type annoncé par le
 * navigateur et l'extension ne sont pas pris en compte.
 */
export async function checkUploadedFile(
  value: FormDataEntryValue | null,
  bucket: MediaBucket,
  field = "file",
): Promise<CheckedFile> {
  if (!isFile(value) || value.size === 0) {
    throw new AppError("VALIDATION", MEDIA_MESSAGES.missing, { [field]: [MEDIA_MESSAGES.missing] });
  }
  const rules = MEDIA_RULES[bucket];
  if (value.size > rules.maxBytes) {
    throw new AppError("VALIDATION", MEDIA_MESSAGES.tooLarge(bucket), { [field]: [MEDIA_MESSAGES.tooLarge(bucket)] });
  }
  const bytes = new Uint8Array(await value.arrayBuffer());
  const type = detectFileType(bytes);
  if (!type || !rules.types.includes(type)) {
    throw new AppError("VALIDATION", MEDIA_MESSAGES.badType(bucket), { [field]: [MEDIA_MESSAGES.badType(bucket)] });
  }
  return { bytes, type, size: bytes.byteLength, name: value.name };
}

/** Nom affiché dans la médiathèque (nom d'origine nettoyé). */
export function displayFileName(name: string, type: MediaMime): string {
  const cleaned = cleanLine(name).replace(/[\\/]/g, "-").slice(0, 255);
  return cleaned || `fichier.${MEDIA_EXTENSIONS[type]}`;
}

/**
 * Chemin de stockage ALÉATOIRE (une photo non publiée ne peut pas être
 * devinée), conforme à private.is_valid_storage_path() :
 * `<dossier>/<année>/<mois>/<32 caractères hexadécimaux>.<extension>`.
 */
export function randomStoragePath(folder: string, type: MediaMime, now = new Date()): string {
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const random = crypto.randomUUID().replace(/-/g, "");
  return `${folder}/${year}/${month}/${random}.${MEDIA_EXTENSIONS[type]}`;
}

/** Petite version d'une image WebP (même règle que src/lib/media.ts). */
export function smallVariantPath(path: string): string | null {
  return /\.webp$/i.test(path) ? path.replace(/\.webp$/i, "-sm.webp") : null;
}

export async function uploadObject(db: SessionDb, bucket: MediaBucket, path: string, file: { bytes: Uint8Array; type: MediaMime }) {
  const { error } = await db.storage.from(bucket).upload(path, new Blob([file.bytes as BlobPart], { type: file.type }), {
    contentType: file.type,
    upsert: false,
    cacheControl: "31536000",
  });
  if (error) {
    console.error("[ina-africa] envoi vers le stockage impossible", error.message ?? "");
    throw new AppError("INTERNAL", MEDIA_MESSAGES.storage);
  }
}

/** Suppression au mieux (un fichier orphelin au nom aléatoire est sans danger). */
export async function removeObjects(db: SessionDb, bucket: MediaBucket, paths: string[]) {
  const { error } = await db.storage.from(bucket).remove(paths);
  if (error) console.error("[ina-africa] suppression dans le stockage impossible", error.message ?? "");
}

/** Colonnes du site qui référencent une image de public-media. */
const PUBLIC_REFERENCES: { table: string; column: string; label: string }[] = [
  { table: "articles", column: "cover_image_path", label: "un article" },
  { table: "projects", column: "cover_image_path", label: "un projet" },
  { table: "donation_campaigns", column: "cover_image_path", label: "un appel aux dons" },
  { table: "action_areas", column: "image_path", label: "un domaine d'intervention" },
  { table: "partners", column: "logo_path", label: "un partenaire" },
  { table: "team_members", column: "photo_path", label: "un membre de l'équipe" },
  { table: "gallery_items", column: "image_path", label: "la galerie" },
  { table: "site_settings", column: "hero_image_path", label: "la page d'accueil" },
  { table: "site_settings", column: "impact_image_path", label: "la page d'accueil" },
];

/**
 * Refuse la suppression d'un fichier encore utilisé (image d'un contenu,
 * justificatif d'un don). Les images insérées DANS un texte riche ne sont
 * pas recherchées : la médiathèque le signale à l'admin.
 */
export async function assertMediaUnused(db: SessionDb, bucket: MediaBucket, path: string) {
  const references =
    bucket === "private-documents"
      ? [{ table: "donations", column: "proof_path", label: "un don" }]
      : PUBLIC_REFERENCES;
  const results = await Promise.all(
    references.map((ref) => db.from(ref.table).select("id", { count: "exact", head: true }).eq(ref.column, path)),
  );
  const usedBy = references.filter((_, index) => {
    const result = results[index];
    check(result);
    return (result.count ?? 0) > 0;
  });
  if (usedBy.length > 0) {
    const labels = [...new Set(usedBy.map((ref) => ref.label))].join(", ");
    throw new AppError("CONFLICT", `Ce fichier est utilisé par ${labels} : retirez-le d'abord.`);
  }
}
