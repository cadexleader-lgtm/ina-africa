"use server";

import { idInputSchema, parseAdminInput } from "@/lib/validation/admin/common";
import { mediaUpdateSchema, mediaUploadFieldsSchema, type MediaBucket } from "@/lib/validation/admin/media";
import { adminAction, check, deleteRow, found, INVALID_INPUT_MESSAGE, loadRow, updateRow } from "@/server/admin/action";
import {
  assertMediaUnused,
  checkUploadedFile,
  displayFileName,
  MEDIA_MESSAGES,
  randomStoragePath,
  removeObjects,
  smallVariantPath,
  uploadObject,
} from "@/server/admin/media";
import { authorize, roleAtLeast } from "@/server/auth/guard";
import { AppError, fail, runAction, type ActionResult } from "@/server/errors";
import { createSessionClient } from "@/server/supabase/server";

/*
 * Médiathèque.
 *  - public-media (photos du site) : l'équipe (éditeur et plus) envoie et
 *    renseigne le texte alternatif ; seul un admin supprime.
 *  - private-documents (justificatifs des dons hors ligne) : admin seulement.
 * Les règles RLS du stockage et de la table `media` appliquent les mêmes
 * droits. Un fichier envoyé n'apparaît sur le site que lorsqu'un contenu
 * l'utilise : aucun cache à invalider ici.
 */

export type UploadedMedia = {
  id: string;
  bucket: MediaBucket;
  path: string;
  /** Petite version (`-sm.webp`) pour les images WebP publiques. */
  smallPath: string | null;
  fileName: string;
  fileType: string;
  fileSize: number;
};

/**
 * Envoi d'un fichier (FormData) :
 *  - `file`   : le fichier (JPEG / PNG / WebP ≤ 5 Mo ; PDF ou image ≤ 10 Mo pour un justificatif) ;
 *  - `small`  : facultatif, petite version WebP (≈ 800 px) d'une image WebP publique ;
 *  - `bucket` : "public-media" ou "private-documents" ;
 *  - `folder` : rangement (articles, projets, galerie…) ;
 *  - `altText`: texte alternatif (facultatif ici, obligatoire là où l'image est publiée).
 */
export async function uploadMedia(formData: FormData): Promise<ActionResult<UploadedMedia>> {
  const auth = await authorize("editor");
  if (!auth.ok) return auth;

  const parsed = parseAdminInput(mediaUploadFieldsSchema, {
    bucket: formData.get("bucket"),
    folder: formData.get("folder") ?? undefined,
    altText: formData.get("altText"),
  });
  if (!parsed.ok) return fail("VALIDATION", INVALID_INPUT_MESSAGE, parsed.fieldErrors);
  const { bucket, altText } = parsed.data;

  if (bucket === "private-documents" && !roleAtLeast(auth.data.role, "admin")) {
    return fail("FORBIDDEN", "Seul un administrateur peut envoyer un justificatif.");
  }
  // Les justificatifs sont toujours rangés au même endroit (et seulement eux).
  const folder =
    bucket === "private-documents" ? "justificatifs" : parsed.data.folder === "justificatifs" ? "divers" : parsed.data.folder;

  return runAction(async () => {
    const file = await checkUploadedFile(formData.get("file"), bucket);
    const path = randomStoragePath(folder, file.type);
    const smallPath = bucket === "public-media" ? smallVariantPath(path) : null;

    let small = null;
    const smallEntry = formData.get("small");
    if (smallPath && smallEntry !== null && !(typeof smallEntry === "string" && smallEntry === "")) {
      small = await checkUploadedFile(smallEntry, bucket, "small");
      if (small.type !== "image/webp") {
        throw new AppError("VALIDATION", MEDIA_MESSAGES.badSmall, { small: [MEDIA_MESSAGES.badSmall] });
      }
    }

    const db = await createSessionClient();
    await uploadObject(db, bucket, path, file);
    const uploaded = [path];
    try {
      if (smallPath) {
        // Repli : sans petite version, la grande est copiée sous le nom -sm.webp.
        await uploadObject(db, bucket, smallPath, small ?? file);
        uploaded.push(smallPath);
      }
      const row = check(
        await db
          .from("media")
          .insert({
            bucket,
            storage_path: path,
            file_name: displayFileName(file.name, file.type),
            file_type: file.type,
            file_size: file.size,
            alt_text: altText,
          })
          .select("id, file_name")
          .single(),
      ) as { id: string; file_name: string };
      return {
        id: row.id,
        bucket,
        path,
        smallPath,
        fileName: row.file_name,
        fileType: file.type,
        fileSize: file.size,
      };
    } catch (error) {
      // Pas de fichier sans fiche dans la médiathèque (au mieux : un éditeur
      // n'a pas le droit de supprimer ; le nom aléatoire reste introuvable).
      await removeObjects(db, bucket, uploaded);
      throw error;
    }
  });
}

/** Texte alternatif (et nom affiché) d'un fichier. */
export async function updateMedia(input: unknown): Promise<ActionResult<{ id: string; altText: string | null }>> {
  return adminAction("editor", mediaUpdateSchema, input, async ({ id, altText, fileName }, { db }) => {
    const values: Record<string, unknown> = { alt_text: altText };
    if (fileName) values.file_name = fileName;
    const row = await updateRow<{ id: string; alt_text: string | null }>(db, "media", id, values, "id, alt_text");
    return { id: row.id, altText: row.alt_text };
  });
}

type MediaRef = { id: string; bucket: MediaBucket; storage_path: string };

/** Suppression (admin) : refusée si le fichier est encore utilisé par un contenu ou un don. */
export async function deleteMedia(input: unknown): Promise<ActionResult<{ id: string }>> {
  return adminAction("admin", idInputSchema, input, async ({ id }, { db }) => {
    const media = await loadRow<MediaRef>(db, "media", id, "id, bucket, storage_path");
    await assertMediaUnused(db, media.bucket, media.storage_path);
    // La fiche d'abord : un fichier sans fiche est sans danger, l'inverse casserait la médiathèque.
    await deleteRow(db, "media", id);
    const small = media.bucket === "public-media" ? smallVariantPath(media.storage_path) : null;
    await removeObjects(db, media.bucket, small ? [media.storage_path, small] : [media.storage_path]);
    return { id };
  });
}

/** Adresse temporaire (5 minutes) pour consulter un justificatif (admin). */
export async function getPrivateDocumentUrl(input: unknown): Promise<ActionResult<{ url: string; expiresIn: number }>> {
  return adminAction("admin", idInputSchema, input, async ({ id }, { db }) => {
    const media = await loadRow<MediaRef>(db, "media", id, "id, bucket, storage_path");
    if (media.bucket !== "private-documents") throw new AppError("NOT_FOUND", "Justificatif introuvable.");
    const expiresIn = 300;
    const { data, error } = await db.storage.from(media.bucket).createSignedUrl(media.storage_path, expiresIn);
    if (error || !data?.signedUrl) {
      console.error("[ina-africa] adresse temporaire impossible", error?.message ?? "");
      throw new AppError("INTERNAL", "Le justificatif ne peut pas être affiché pour le moment.");
    }
    return { url: found(data.signedUrl), expiresIn };
  });
}
