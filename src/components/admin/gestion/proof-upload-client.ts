import { finalizeProofUpload, requestProofUpload, type FinalizedProof } from "@/server/actions/admin/proof-upload";

import { declaredProofType, proofFileProblem } from "./labels";

/*
 * Envoi d'un justificatif depuis le NAVIGATEUR (voir src/server/admin/upload.ts) :
 *  1. le serveur fournit une adresse d'envoi signée pour un chemin aléatoire ;
 *  2. le fichier part directement vers Supabase Storage (pas de limite de
 *     4 Mo des Server Actions) — autorisé par la CSP : connect-src inclut
 *     l'origine du projet Supabase (next.config.ts) ;
 *  3. le serveur relit le fichier stocké et l'enregistre (ou le supprime).
 */

export type ProofUploadResult = { ok: true; proof: FinalizedProof } | { ok: false; message: string };

const NETWORK_MESSAGE = "L'envoi a été interrompu (connexion). Vérifiez votre connexion puis réessayez.";

function putFile(url: string, file: File, contentType: string, onProgress?: (fraction: number) => void): Promise<number> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("PUT", url);
    request.setRequestHeader("content-type", contentType);
    request.setRequestHeader("cache-control", "max-age=3600");
    request.setRequestHeader("x-upsert", "false");
    // Clé PUBLIQUE du projet (comme le client Supabase officiel) : le jeton de l'adresse signée fait l'autorisation.
    const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (publishableKey) request.setRequestHeader("apikey", publishableKey);
    request.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) onProgress(event.loaded / event.total);
    };
    request.onload = () => resolve(request.status);
    request.onerror = () => reject(new Error("network"));
    request.onabort = () => reject(new Error("abort"));
    request.send(file);
  });
}

function storageMessage(status: number): string {
  if (status === 413) return "Ce fichier est trop lourd : 10 Mo au plus.";
  if (status === 415 || status === 400) return "Ce fichier n'a pas été accepté : envoyez un PDF ou une image JPEG, PNG ou WebP.";
  if (status === 401 || status === 403) return "L'autorisation d'envoi a expiré. Choisissez de nouveau le fichier.";
  return "L'envoi du justificatif a échoué. Réessayez dans un instant.";
}

export async function uploadProof(file: File, onProgress?: (fraction: number) => void): Promise<ProofUploadResult> {
  const problem = proofFileProblem(file);
  if (problem) return { ok: false, message: problem };

  const ticket = await requestProofUpload({
    fileName: file.name,
    fileType: declaredProofType(file),
    fileSize: file.size,
  });
  if (!ticket.ok) {
    const fieldMessage = Object.values(ticket.error.fieldErrors ?? {})[0]?.[0];
    return { ok: false, message: fieldMessage ?? ticket.error.message };
  }

  let status: number;
  try {
    status = await putFile(ticket.data.signedUrl, file, ticket.data.contentType, onProgress);
  } catch {
    return { ok: false, message: NETWORK_MESSAGE };
  }
  if (status < 200 || status >= 300) return { ok: false, message: storageMessage(status) };

  const finalized = await finalizeProofUpload({ path: ticket.data.path, fileName: file.name });
  if (!finalized.ok) {
    const fieldMessage = finalized.error.fieldErrors?.file?.[0];
    return { ok: false, message: fieldMessage ?? finalized.error.message };
  }
  return { ok: true, proof: finalized.data };
}
