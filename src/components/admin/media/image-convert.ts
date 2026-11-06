/*
 * Préparation des photos AVANT l'envoi (navigateur de l'administration) :
 * conversion en WebP, en deux tailles (≈ 2000 px et ≈ 800 px de large, sans
 * jamais agrandir), comme l'attend src/lib/media.ts (`<nom>.webp` +
 * `<nom>-sm.webp`). Aucune bibliothèque : createImageBitmap + <canvas>.
 *
 * Les fonctions de calcul (tailles, budget d'envoi) sont pures et testées
 * (tests/unit/admin-ui-contenus.test.ts).
 */

export const LARGE_WIDTH = 2000;
export const SMALL_WIDTH = 800;

/**
 * Limite d'un envoi : `experimental.serverActions.bodySizeLimit` = 4 Mo
 * (next.config.ts). Marge pour l'enveloppe du formulaire (noms des champs,
 * texte alternatif).
 */
export const MAX_ACTION_BYTES = 4 * 1024 * 1024;
export const UPLOAD_BUDGET_BYTES = MAX_ACTION_BYTES - 64 * 1024;

/** Qualités WebP essayées dans l'ordre si le fichier est trop lourd. */
export const WEBP_QUALITIES = [0.82, 0.72, 0.6] as const;

export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export const CONVERT_MESSAGES = {
  badType: "Format non accepté : choisissez une photo JPEG, PNG ou WebP.",
  unreadable: "Cette photo ne peut pas être lue par le navigateur. Enregistrez-la en JPEG puis réessayez.",
  tooHeavy: (size: string) =>
    `La photo reste trop lourde après réduction (${size}) : 4 Mo au plus. Choisissez une photo plus petite ou recadrée.`,
} as const;

/** Dimensions réduites à `maxWidth` de large, proportions gardées, JAMAIS agrandies. */
export function scaledSize(width: number, height: number, maxWidth: number): { width: number; height: number } {
  if (!(width > 0) || !(height > 0)) return { width: 0, height: 0 };
  if (width <= maxWidth) return { width: Math.round(width), height: Math.round(height) };
  return { width: maxWidth, height: Math.max(1, Math.round((height * maxWidth) / width)) };
}

/** Vrai si la petite version est utile (la photo est plus large que la petite taille). */
export function needsSmallVersion(width: number): boolean {
  return width > SMALL_WIDTH;
}

/** L'envoi (grande + petite version) tient-il dans la limite des Server Actions ? */
export function fitsUploadBudget(...sizes: number[]): boolean {
  return sizes.reduce((total, size) => total + size, 0) <= UPLOAD_BUDGET_BYTES;
}

export function isAcceptedImageType(type: string): boolean {
  return (ACCEPTED_IMAGE_TYPES as readonly string[]).includes(type);
}

export type PreparedImage = {
  /** Fichier principal (WebP ≈ 2000 px ; ou l'original si le navigateur ne sait pas produire du WebP). */
  file: File;
  /** Petite version WebP (≈ 800 px), absente si inutile ou impossible. */
  small: File | null;
  width: number;
  height: number;
  converted: boolean;
};

export type PrepareResult = { ok: true; image: PreparedImage } | { ok: false; message: string };

function baseName(name: string): string {
  return name.replace(/\.[^.]+$/, "").slice(0, 200) || "photo";
}

async function drawToWebp(bitmap: ImageBitmap, maxWidth: number, quality: number): Promise<Blob | null> {
  const size = scaledSize(bitmap.width, bitmap.height, maxWidth);
  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;
  const context = canvas.getContext("2d");
  if (!context) return null;
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(bitmap, 0, 0, size.width, size.height);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", quality));
  canvas.width = 0;
  canvas.height = 0;
  // Un navigateur sans encodeur WebP renvoie du PNG : refusé ici.
  return blob && blob.type === "image/webp" ? blob : null;
}

/** Taille lisible (« 1,2 Mo »). */
function readableSize(bytes: number): string {
  return `${(bytes / 1024 / 1024).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} Mo`;
}

/**
 * Prépare une photo pour l'envoi. Navigateur uniquement.
 *  1. type JPEG / PNG / WebP ;
 *  2. lecture (orientation de l'appareil photo respectée) ;
 *  3. WebP ≈ 2000 px + ≈ 800 px, qualité réduite si besoin pour tenir dans 4 Mo ;
 *  4. sans WebP possible : l'original s'il tient dans la limite (sans petite version).
 */
export async function prepareImage(source: File): Promise<PrepareResult> {
  if (!isAcceptedImageType(source.type)) return { ok: false, message: CONVERT_MESSAGES.badType };

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(source, { imageOrientation: "from-image" });
  } catch {
    return { ok: false, message: CONVERT_MESSAGES.unreadable };
  }

  try {
    const name = baseName(source.name);
    let lastSize = 0;
    for (const quality of WEBP_QUALITIES) {
      const large = await drawToWebp(bitmap, LARGE_WIDTH, quality);
      if (!large) break;
      const small = needsSmallVersion(bitmap.width) ? await drawToWebp(bitmap, SMALL_WIDTH, quality) : null;
      lastSize = large.size + (small?.size ?? 0);
      if (fitsUploadBudget(large.size, small?.size ?? 0)) {
        const size = scaledSize(bitmap.width, bitmap.height, LARGE_WIDTH);
        return {
          ok: true,
          image: {
            file: new File([large], `${name}.webp`, { type: "image/webp" }),
            small: small ? new File([small], `${name}-sm.webp`, { type: "image/webp" }) : null,
            width: size.width,
            height: size.height,
            converted: true,
          },
        };
      }
    }
    if (lastSize > 0) return { ok: false, message: CONVERT_MESSAGES.tooHeavy(readableSize(lastSize)) };

    // Pas d'encodeur WebP dans ce navigateur : l'original, s'il tient dans la limite.
    if (!fitsUploadBudget(source.size)) return { ok: false, message: CONVERT_MESSAGES.tooHeavy(readableSize(source.size)) };
    return {
      ok: true,
      image: { file: source, small: null, width: bitmap.width, height: bitmap.height, converted: false },
    };
  } finally {
    bitmap.close();
  }
}
