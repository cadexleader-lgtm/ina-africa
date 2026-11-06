/* eslint-disable @next/next/no-img-element --
 * Aperçus de l'administration : petite version déjà optimisée de la
 * médiathèque (`-sm.webp`) ou aperçu local (adresse blob:) avant l'envoi.
 */
import { cn } from "@/lib/cn";
import { mediaUrl } from "@/lib/media";

/** Adresse de la petite version d'une image de la médiathèque (WebP), sinon de l'image elle-même. */
export function thumbUrl(path: string): string {
  return mediaUrl(/\.webp$/i.test(path) ? path.replace(/\.webp$/i, "-sm.webp") : path);
}

/** Vignette d'une image (chemin de la médiathèque ou adresse locale `blob:`). */
export function MediaThumb({
  path,
  src,
  alt,
  className,
  fit = "cover",
}: {
  path?: string | null;
  src?: string | null;
  alt: string;
  className?: string;
  fit?: "cover" | "contain";
}) {
  const url = src ?? (path ? thumbUrl(path) : null);
  if (!url) return null;
  return (
    <img
      src={url}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={cn("block size-full bg-ivory", fit === "cover" ? "object-cover" : "object-contain", className)}
    />
  );
}
