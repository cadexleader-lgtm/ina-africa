"use client";

import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import { Expand, Play } from "lucide-react";

import { ResponsiveImage } from "@/components/ui/ResponsiveImage";
import { CARD_IMAGE } from "@/components/site/card-styles";
import { MediaViewer } from "@/components/pages/gallery/MediaViewer";
import { PAGES } from "@/content/fr/pages";
import { cn } from "@/lib/cn";
import { formatDate, isoDate } from "@/lib/format";
import { mediaUrl } from "@/lib/media";
import type { GalleryItem } from "@/lib/types/content";

const T = PAGES.viewer;

type MediaGalleryProps = {
  items: GalleryItem[];
  /** Afficher la légende et la date sous chaque vignette (défaut : oui). */
  showCaptions?: boolean;
  className?: string;
};

/**
 * Grille de photos et vidéos + visionneuse.
 * Sans JavaScript, chaque vignette est un simple lien vers la photo (ou la
 * vidéo) : rien n'est perdu. Avec JavaScript, le clic ouvre la visionneuse
 * (le clic molette / Ctrl+clic garde le comportement normal du lien).
 */
export function MediaGallery({ items, showCaptions = true, className }: MediaGalleryProps) {
  const [index, setIndex] = useState<number | null>(null);
  const opener = useRef<HTMLElement | null>(null);

  const close = useCallback(() => setIndex(null), []);

  // Retour du focus sur la vignette d'origine après la fermeture.
  useEffect(() => {
    if (index === null && opener.current) {
      opener.current.focus();
      opener.current = null;
    }
  }, [index]);

  const open = (event: MouseEvent<HTMLAnchorElement>, itemIndex: number) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    opener.current = event.currentTarget;
    setIndex(itemIndex);
  };

  if (items.length === 0) return null;

  return (
    <>
      <ul className={cn("grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4", className)}>
        {items.map((item, itemIndex) => (
          <li key={item.id} className="flex flex-col">
            <GalleryTile item={item} onOpen={(event) => open(event, itemIndex)} />
            {showCaptions && (item.caption || item.takenOn) && (
              <div className="mt-2.5 px-0.5">
                {item.caption && <p className="line-clamp-2 text-small text-ink">{item.caption}</p>}
                {formatDate(item.takenOn) && (
                  <p className="mt-0.5 text-small text-muted">
                    <time dateTime={isoDate(item.takenOn)}>{formatDate(item.takenOn)}</time>
                  </p>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
      <MediaViewer items={items} index={index} onChange={setIndex} onClose={close} />
    </>
  );
}

const TILE =
  "group relative block aspect-[4/3] overflow-hidden rounded-card bg-brand-50 " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus-ring-color)";

function GalleryTile({ item, onOpen }: { item: GalleryItem; onOpen: (event: MouseEvent<HTMLAnchorElement>) => void }) {
  if (item.type === "photo") {
    return (
      <a href={mediaUrl(item.image.path)} onClick={onOpen} className={TILE}>
        <span className="sr-only">{T.openPhoto} : </span>
        <ResponsiveImage
          image={item.image}
          fill
          sizes="(min-width: 1280px) 285px, (min-width: 1024px) 23vw, (min-width: 768px) 31vw, 47vw"
          imgClassName={CARD_IMAGE}
        />
        <span
          aria-hidden="true"
          className="absolute right-3 bottom-3 flex size-9 items-center justify-center rounded-full bg-white text-brand opacity-0 shadow-card transition-opacity duration-(--duration-fast) group-hover:opacity-100 group-focus-visible:opacity-100"
        >
          <Expand className="size-4" />
        </span>
      </a>
    );
  }

  return (
    <a href={item.url} onClick={onOpen} rel="noopener noreferrer" className={TILE}>
      <span className="sr-only">
        {T.openVideo}
        {item.caption ? ` : ${item.caption}` : ""}
      </span>
      {item.poster && (
        <ResponsiveImage
          image={{ ...item.poster, alt: "" }}
          fill
          sizes="(min-width: 1280px) 285px, (min-width: 1024px) 23vw, (min-width: 768px) 31vw, 47vw"
          imgClassName={CARD_IMAGE}
        />
      )}
      <span aria-hidden="true" className={cn("absolute inset-0", item.poster && "bg-brand-strong/30")} />
      <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-white text-brand shadow-overlay transition-transform duration-(--duration-fast) motion-safe:group-hover:scale-105">
          <Play className="ml-0.5 size-6 fill-current" />
        </span>
      </span>
      <span
        aria-hidden="true"
        className="absolute top-3 left-3 rounded-full bg-white px-2.5 py-1 text-small font-semibold text-brand shadow-card"
      >
        {T.video}
      </span>
    </a>
  );
}
