/* eslint-disable @next/next/no-img-element --
 * Balise <img> native VOLONTAIRE dans ce seul fichier : l'hébergeur n'est pas
 * encore choisi (pas d'optimiseur d'images Vercel garanti) et les photos sont
 * déjà optimisées à l'envoi (WebP en deux tailles, voir src/lib/media.ts).
 * srcset/sizes, dimensions (ou ratio), lazy loading et decoding sont gérés ici.
 */
import type { CSSProperties } from "react";

import { PROVISIONAL_LABEL, type ProvisionalImage } from "@/content/provisional-images";
import { cn } from "@/lib/cn";
import { responsiveImage } from "@/lib/media";
import type { ImageRef } from "@/lib/types/content";

export type ImageSource = ImageRef | ProvisionalImage;

export function isProvisional(image: ImageSource): image is ProvisionalImage {
  return "provisional" in image && image.provisional === true;
}

type ResponsiveImageProps = {
  /** Image de la médiathèque (ImageRef) ou photo provisoire (PROVISIONAL_IMAGES). Texte alternatif obligatoire. */
  image: ImageSource;
  /** Attribut `sizes` : largeur affichée selon l'écran, ex. "(min-width: 1024px) 50vw, 100vw". */
  sizes: string;
  /**
   * Ratio d'affichage, ex. "16/9", "4/3", "1/1". L'image remplit le cadre
   * (object-cover) : aucun saut de mise en page. Sans ratio, les dimensions
   * de la photo provisoire (ou width/height) sont utilisées.
   */
  aspect?: string;
  width?: number;
  height?: number;
  /**
   * L'image remplit son PARENT, qui doit être positionné (relative) et
   * dimensionné (ex. "relative size-22 sm:aspect-[4/3] sm:w-full"). Utile quand
   * le ratio change selon l'écran. Comme `fill` de next/image.
   */
  fill?: boolean;
  /** Image principale au-dessus de la ligne de flottaison (hero) : chargement immédiat, priorité haute. */
  priority?: boolean;
  fit?: "cover" | "contain";
  /** Position du sujet dans le cadre (object-position), ex. "50% 30%". */
  focus?: string;
  /** Classes du cadre (rayon, ombre, taille…). */
  className?: string;
  imgClassName?: string;
  /**
   * Mention « Photo d'illustration » pour une photo provisoire :
   * `overlay` (défaut) = pastille sur l'image ; `none` = le parent l'affiche
   * lui-même (ex. carte compacte où la pastille masquerait la photo).
   */
  provisionalLabel?: "overlay" | "none";
  labelPosition?: "bottom-left" | "bottom-right" | "top-left";
  /** Style supplémentaire du cadre (ex. clip-path calculé). */
  style?: CSSProperties;
};

const LABEL_POSITION = {
  "bottom-left": "bottom-3 left-3",
  "bottom-right": "bottom-3 right-3",
  "top-left": "top-3 left-3",
} as const;

/** Mention « Photo d'illustration » (à utiliser seule si provisionalLabel="none"). */
export function ProvisionalBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-white px-3 py-1 text-small font-medium text-muted shadow-card",
        className,
      )}
    >
      {PROVISIONAL_LABEL}
    </span>
  );
}

export function ResponsiveImage({
  image,
  sizes,
  aspect,
  width,
  height,
  fill: fillFrame = false,
  priority = false,
  fit = "cover",
  focus,
  className,
  imgClassName,
  provisionalLabel = "overlay",
  labelPosition = "bottom-left",
  style,
}: ResponsiveImageProps) {
  const provisional = isProvisional(image);
  const { src, srcSet, alt } = provisional
    ? responsiveImage(
        { path: image.path, alt: image.alt },
        { hasSmall: image.hasSmall, smallWidth: 640, largeWidth: image.width },
      )
    : responsiveImage(image);

  const intrinsicWidth = width ?? (provisional ? image.width : undefined);
  const intrinsicHeight = height ?? (provisional ? image.height : undefined);
  const fill = Boolean(aspect) || fillFrame;

  return (
    <div
      className={cn(fillFrame ? "absolute inset-0" : "relative", "overflow-hidden bg-brand-50", className)}
      style={{ ...(aspect ? { aspectRatio: aspect.replace("/", " / ") } : {}), ...style }}
    >
      <img
        src={src}
        srcSet={srcSet}
        sizes={srcSet ? sizes : undefined}
        alt={alt}
        width={intrinsicWidth}
        height={intrinsicHeight}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : undefined}
        decoding="async"
        className={cn(
          fill ? "absolute inset-0 h-full w-full" : "block h-auto w-full",
          fit === "cover" ? "object-cover" : "object-contain",
          imgClassName,
        )}
        style={focus ? { objectPosition: focus } : undefined}
      />
      {provisional && provisionalLabel === "overlay" && (
        <ProvisionalBadge className={cn("absolute", LABEL_POSITION[labelPosition])} />
      )}
    </div>
  );
}
