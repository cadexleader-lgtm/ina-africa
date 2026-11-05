import type { ImageRef } from "@/lib/types/content";

/**
 * Adresses des images.
 *
 * Convention d'envoi (administration) : chaque photo est convertie en WebP
 * dans le navigateur, en deux tailles stockées côte à côte dans `public-media` :
 *   <nom>.webp     grande (≈ 2000 px de large au plus)
 *   <nom>-sm.webp  petite (≈ 800 px)
 * Les photos provisoires locales (`/images/...`) suivent la même convention
 * quand une petite version existe.
 */

const SMALL_WIDTH = 800;
const LARGE_WIDTH = 2000;

function supabaseUrl(): string | undefined {
  return process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
}

/** Adresse publique d'un fichier (stockage public-media ou fichier local /images/...). */
export function mediaUrl(path: string): string {
  if (path.startsWith("/")) return path;
  const base = supabaseUrl();
  return base ? `${base}/storage/v1/object/public/public-media/${path}` : `/missing-media/${path}`;
}

function smallVariant(path: string): string | null {
  return /\.webp$/i.test(path) ? path.replace(/\.webp$/i, "-sm.webp") : null;
}

/**
 * `src` + `srcSet` pour une image responsive.
 * `hasSmall` = la petite version existe (toujours vrai pour les envois de
 * l'administration ; à préciser pour les photos locales).
 */
export function responsiveImage(
  image: ImageRef,
  options: { hasSmall?: boolean; smallWidth?: number; largeWidth?: number } = {},
) {
  const hasSmall = options.hasSmall ?? !image.path.startsWith("/");
  const small = hasSmall ? smallVariant(image.path) : null;
  const smallWidth = options.smallWidth ?? SMALL_WIDTH;
  const largeWidth = options.largeWidth ?? LARGE_WIDTH;
  return {
    src: mediaUrl(image.path),
    srcSet: small ? `${mediaUrl(small)} ${smallWidth}w, ${mediaUrl(image.path)} ${largeWidth}w` : undefined,
    alt: image.alt,
  };
}
