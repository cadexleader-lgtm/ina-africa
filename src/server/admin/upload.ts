import "server-only";

import { z } from "zod";

import { MEDIA_EXTENSIONS, MEDIA_RULES, type MediaMime } from "@/lib/validation/admin/media";
import { cleanLine } from "@/lib/validation/forms";

/*
 * Envoi SIGNÉ DIRECT des justificatifs de dons hors ligne (jusqu'à 10 Mo).
 *
 * Les Server Actions sont limitées à 4 Mo (limite de 4,5 Mo des fonctions
 * Vercel, voir next.config.ts) : un justificatif plus lourd ne peut pas
 * transiter par le serveur du site. Parcours :
 *  1. requestProofUpload (admin) : le serveur choisit un chemin ALÉATOIRE
 *     dans `private-documents/justificatifs/…` et demande à Supabase Storage
 *     une adresse d'envoi signée (valable 2 heures, pour ce seul chemin) ;
 *  2. le navigateur envoie le fichier directement à cette adresse ;
 *  3. finalizeProofUpload (admin) : le serveur relit la taille et les
 *     PREMIERS OCTETS du fichier stocké (type réel PDF / JPEG / PNG / WebP,
 *     ≤ 10 Mo, cohérent avec l'extension du chemin), supprime le fichier s'il
 *     est refusé, puis crée sa fiche dans `media`.
 * Le stockage refuse de lui-même les types non déclarés et les fichiers de
 * plus de 10 Mo (réglages de l'espace private-documents) ; le contrôle des
 * premiers octets est fait ici, car le type déclaré par le navigateur ne
 * prouve rien.
 */

export const PROOF_BUCKET = "private-documents" as const;
export const PROOF_FOLDER = "justificatifs" as const;
export const PROOF_RULES = MEDIA_RULES[PROOF_BUCKET];

/** Octets relus pour reconnaître le type réel (les signatures en demandent 12). */
export const HEAD_BYTES = 16;

/** Chemin produit par randomStoragePath("justificatifs", …) : rien d'autre n'est accepté à la finalisation. */
const PROOF_PATH = /^justificatifs\/\d{4}\/(0[1-9]|1[0-2])\/[0-9a-f]{32}\.(pdf|jpg|png|webp)$/;

export function isProofPath(value: unknown): value is string {
  return typeof value === "string" && PROOF_PATH.test(value);
}

/** L'extension du chemin correspond-elle au type réel du fichier ? */
export function extensionMatches(path: string, type: MediaMime): boolean {
  return path.endsWith(`.${MEDIA_EXTENSIONS[type]}`);
}

export const UPLOAD_MESSAGES = {
  badType: "Format non accepté : seuls les PDF et les images JPEG, PNG ou WebP sont acceptés.",
  tooLarge: `Ce fichier est trop lourd : ${PROOF_RULES.maxBytes / 1024 / 1024} Mo au plus.`,
  empty: "Ce fichier est vide.",
  badPath: "Envoi invalide : choisissez de nouveau le fichier.",
  notReceived: "Le fichier n'a pas été reçu. Choisissez-le de nouveau puis réessayez.",
  storage: "L'envoi du justificatif n'a pas pu être préparé. Réessayez dans un instant.",
  check: "Le justificatif n'a pas pu être vérifié. Réessayez dans un instant.",
  mismatch: "Le contenu du fichier ne correspond pas à un PDF ou à une image JPEG, PNG ou WebP.",
} as const;

const fileNameField = z.preprocess(
  (value) => (typeof value === "string" ? cleanLine(value).replace(/[\\/]/g, "-").slice(0, 255) : value),
  z.string({ error: "Nom de fichier manquant." }).min(1, "Nom de fichier manquant."),
);

/** Demande d'adresse d'envoi : type et taille ANNONCÉS (revérifiés à la finalisation). */
export const proofUploadRequestSchema = z.object({
  fileName: fileNameField,
  fileType: z
    .string({ error: UPLOAD_MESSAGES.badType })
    .refine((type) => (PROOF_RULES.types as readonly string[]).includes(type), UPLOAD_MESSAGES.badType)
    .transform((type) => type as MediaMime),
  fileSize: z
    .number({ error: UPLOAD_MESSAGES.empty })
    .int(UPLOAD_MESSAGES.empty)
    .min(1, UPLOAD_MESSAGES.empty)
    .max(PROOF_RULES.maxBytes, UPLOAD_MESSAGES.tooLarge),
});

export const proofUploadFinalizeSchema = z.object({
  path: z.string({ error: UPLOAD_MESSAGES.badPath }).refine(isProofPath, UPLOAD_MESSAGES.badPath),
  fileName: fileNameField,
});

/**
 * Lit les `count` premiers octets d'un fichier à une adresse (signée) :
 * demande une plage (Range) et, si le serveur l'ignore, coupe la lecture dès
 * que les octets voulus sont arrivés. Renvoie aussi la taille totale quand la
 * réponse l'indique (Content-Range, ou Content-Length d'une réponse complète).
 */
export async function readHead(
  url: string,
  count = HEAD_BYTES,
  fetchImpl: typeof fetch = fetch,
): Promise<{ bytes: Uint8Array; totalSize: number | null }> {
  const response = await fetchImpl(url, { headers: { Range: `bytes=0-${count - 1}` }, cache: "no-store" });
  if (response.status !== 200 && response.status !== 206) {
    await response.body?.cancel().catch(() => undefined);
    throw new Error(`lecture impossible (HTTP ${response.status})`);
  }

  const bytes = new Uint8Array(count);
  let received = 0;
  const reader = response.body?.getReader();
  if (reader) {
    try {
      while (received < count) {
        const { done, value } = await reader.read();
        if (done || !value) break;
        const slice = value.subarray(0, count - received);
        bytes.set(slice, received);
        received += slice.length;
      }
    } finally {
      await reader.cancel().catch(() => undefined);
    }
  }

  return { bytes: bytes.subarray(0, received), totalSize: totalSizeFrom(response) };
}

function totalSizeFrom(response: Response): number | null {
  const range = response.headers.get("content-range");
  const match = range ? /\/(\d+)\s*$/.exec(range) : null;
  if (match) return Number(match[1]);
  if (response.status === 200) {
    const length = Number(response.headers.get("content-length"));
    return Number.isSafeInteger(length) && length >= 0 ? length : null;
  }
  return null;
}
