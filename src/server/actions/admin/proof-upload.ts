"use server";

import { adminAction, check, databaseError } from "@/server/admin/action";
import { detectFileType } from "@/server/admin/file-type";
import { displayFileName, randomStoragePath, removeObjects } from "@/server/admin/media";
import {
  extensionMatches,
  PROOF_BUCKET,
  PROOF_FOLDER,
  PROOF_RULES,
  proofUploadFinalizeSchema,
  proofUploadRequestSchema,
  readHead,
  UPLOAD_MESSAGES,
} from "@/server/admin/upload";
import { AppError, type ActionResult } from "@/server/errors";

/*
 * Justificatifs des dons hors ligne : envoi signé direct vers Supabase
 * Storage (voir src/server/admin/upload.ts). Réservé aux administrateurs ;
 * les règles RLS du stockage (private-documents : admin seulement)
 * s'appliquent à la demande d'adresse, à la relecture et à la suppression.
 */

export type ProofUploadTicket = {
  /** Chemin aléatoire choisi par le serveur (à renvoyer à la finalisation). */
  path: string;
  /** Adresse d'envoi signée (PUT), valable pour ce seul chemin. */
  signedUrl: string;
  /** Type à annoncer à l'envoi (le stockage refuse les types non autorisés). */
  contentType: string;
};

export async function requestProofUpload(input: unknown): Promise<ActionResult<ProofUploadTicket>> {
  return adminAction("admin", proofUploadRequestSchema, input, async ({ fileType }, { db }) => {
    const path = randomStoragePath(PROOF_FOLDER, fileType);
    const { data, error } = await db.storage.from(PROOF_BUCKET).createSignedUploadUrl(path);
    if (error || !data?.signedUrl) {
      console.error("[ina-africa] adresse d'envoi signée impossible", error?.message ?? "");
      throw new AppError("INTERNAL", UPLOAD_MESSAGES.storage);
    }
    return { path, signedUrl: data.signedUrl, contentType: fileType };
  });
}

export type FinalizedProof = { id: string; path: string; fileName: string; fileType: string; fileSize: number };

type MediaRow = { id: string; storage_path: string; file_name: string; file_type: string; file_size: number };

function refuse(message: string): AppError {
  return new AppError("VALIDATION", message, { file: [message] });
}

/**
 * Vérifie le fichier reçu (taille, type réel lu dans ses premiers octets)
 * et crée sa fiche dans la médiathèque privée. Un fichier refusé est
 * supprimé. Rappeler la finalisation d'un fichier déjà enregistré renvoie
 * sa fiche (double clic, nouvel essai après une coupure).
 */
export async function finalizeProofUpload(input: unknown): Promise<ActionResult<FinalizedProof>> {
  return adminAction("admin", proofUploadFinalizeSchema, input, async ({ path, fileName }, { db }) => {
    const toResult = (row: MediaRow): FinalizedProof => ({
      id: row.id,
      path: row.storage_path,
      fileName: row.file_name,
      fileType: row.file_type,
      fileSize: Number(row.file_size),
    });
    const columns = "id, storage_path, file_name, file_type, file_size";

    const existing = check(
      await db.from("media").select(columns).eq("bucket", PROOF_BUCKET).eq("storage_path", path).maybeSingle(),
    ) as MediaRow | null;
    if (existing) return toResult(existing);

    const storage = db.storage.from(PROOF_BUCKET);
    const info = await storage.info(path);
    if (info.error || !info.data) throw new AppError("NOT_FOUND", UPLOAD_MESSAGES.notReceived, { file: [UPLOAD_MESSAGES.notReceived] });

    const signed = await storage.createSignedUrl(path, 60);
    if (signed.error || !signed.data?.signedUrl) {
      console.error("[ina-africa] relecture du justificatif impossible", signed.error?.message ?? "");
      throw new AppError("INTERNAL", UPLOAD_MESSAGES.check);
    }
    let head: Awaited<ReturnType<typeof readHead>>;
    try {
      head = await readHead(signed.data.signedUrl);
    } catch (error) {
      console.error("[ina-africa] relecture du justificatif impossible", error instanceof Error ? error.message : "");
      throw new AppError("INTERNAL", UPLOAD_MESSAGES.check);
    }

    const size = typeof info.data.size === "number" ? info.data.size : head.totalSize;
    const type = detectFileType(head.bytes);
    let problem: string | null = null;
    if (size === null || size <= 0) problem = size === 0 ? UPLOAD_MESSAGES.empty : UPLOAD_MESSAGES.check;
    else if (size > PROOF_RULES.maxBytes) problem = UPLOAD_MESSAGES.tooLarge;
    else if (!type || !PROOF_RULES.types.includes(type)) problem = UPLOAD_MESSAGES.mismatch;
    else if (!extensionMatches(path, type)) problem = UPLOAD_MESSAGES.mismatch;

    if (problem || !type || size === null) {
      await removeObjects(db, PROOF_BUCKET, [path]);
      throw refuse(problem ?? UPLOAD_MESSAGES.check);
    }

    const inserted = await db
      .from("media")
      .insert({
        bucket: PROOF_BUCKET,
        storage_path: path,
        file_name: displayFileName(fileName, type),
        file_type: type,
        file_size: size,
        alt_text: null,
      })
      .select(columns)
      .single();
    if (inserted.error) {
      // Finalisation simultanée (double clic) : la fiche existe déjà, le fichier est gardé.
      if (inserted.error.code === "23505") {
        const again = check(
          await db.from("media").select(columns).eq("bucket", PROOF_BUCKET).eq("storage_path", path).maybeSingle(),
        ) as MediaRow | null;
        if (again) return toResult(again);
      }
      await removeObjects(db, PROOF_BUCKET, [path]);
      throw databaseError(inserted.error);
    }
    return toResult(inserted.data as MediaRow);
  });
}
