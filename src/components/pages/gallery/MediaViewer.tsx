/* eslint-disable @next/next/no-img-element --
 * Variante locale de ResponsiveImage pour la visionneuse : la photo doit être
 * affichée ENTIÈRE (object-contain) sur fond sombre, sans connaître ses
 * dimensions, alors que ResponsiveImage pose toujours un fond clair
 * (bg-brand-50) autour de l'image. Mêmes adresses (responsiveImage de
 * src/lib/media.ts : WebP en deux tailles), même texte alternatif obligatoire.
 */
"use client";

import { useEffect, useId, useRef, type KeyboardEvent, type TouchEvent } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

import { useModalDialog } from "@/components/ui/Modal";
import { VideoEmbed } from "@/components/site/VideoEmbed";
import { viewerAnnouncement, wrapIndex } from "@/components/pages/page-helpers";
import { PAGES } from "@/content/fr/pages";
import { cn } from "@/lib/cn";
import { formatDate, isoDate } from "@/lib/format";
import { responsiveImage } from "@/lib/media";
import type { GalleryItem } from "@/lib/types/content";

const T = PAGES.viewer;

/**
 * Boutons précédent/suivant : sous la photo sur téléphone (ils ne la masquent
 * pas), sur les côtés dès 640 px (positionnés par rapport à la visionneuse).
 */
const NAV_BUTTON =
  "z-10 inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-white text-brand shadow-overlay " +
  "transition-colors duration-(--duration-fast) hover:bg-brand-50 [--focus-ring-color:var(--color-white)] " +
  "sm:absolute sm:top-1/2 sm:-translate-y-1/2";

type MediaViewerProps = {
  items: GalleryItem[];
  /** Élément affiché ; null = visionneuse fermée. */
  index: number | null;
  onChange: (index: number) => void;
  onClose: () => void;
};

/**
 * Visionneuse plein écran accessible (élément <dialog> natif piloté par
 * useModalDialog) :
 *  - Échap ferme ; Tab reste dans la visionneuse ; le focus revient sur la
 *    vignette d'origine (géré par MediaGallery) ;
 *  - flèches gauche/droite (et glisser sur écran tactile) : élément précédent/suivant ;
 *  - chaque changement est annoncé aux lecteurs d'écran ;
 *  - vidéos par façade (chargées au clic, jamais avant).
 */
export function MediaViewer({ items, index, onChange, onClose }: MediaViewerProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const touchStart = useRef<number | null>(null);
  const titleId = useId();
  const hintId = useId();
  const open = index !== null && items.length > 0;
  const handlers = useModalDialog(ref, open, onClose);

  const total = items.length;
  const current = open ? wrapIndex(index, total) : null;
  const item = current !== null ? items[current] : null;
  const multiple = total > 1;

  // À l'ouverture : focus sur « Fermer » (premier contrôle, toujours présent).
  useEffect(() => {
    if (open) closeRef.current?.focus();
  }, [open]);

  const go = (delta: number) => {
    if (current !== null && multiple) onChange(wrapIndex(current + delta, total));
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      go(1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      go(-1);
    } else {
      handlers.onKeyDown(event);
    }
  };

  const onTouchStart = (event: TouchEvent) => {
    touchStart.current = event.touches[0]?.clientX ?? null;
  };
  const onTouchEnd = (event: TouchEvent) => {
    const start = touchStart.current;
    const end = event.changedTouches[0]?.clientX;
    touchStart.current = null;
    if (start === null || end === undefined || Math.abs(end - start) < 50) return;
    go(end < start ? 1 : -1);
  };

  const date = item ? formatDate(item.takenOn) : null;

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={hintId}
      {...handlers}
      onKeyDown={onKeyDown}
      className={cn(
        "on-dark m-0 size-full max-h-none max-w-none overflow-hidden bg-brand-strong p-0 text-white",
        "open:flex open:flex-col open:motion-safe:animate-[backdrop-in_var(--duration-base)_var(--ease-out)]",
      )}
    >
      <h2 id={titleId} className="sr-only">
        {T.dialogLabel}
      </h2>
      <p id={hintId} className="sr-only">
        {multiple ? T.hint : T.close}
      </p>
      <p aria-live="polite" className="sr-only">
        {item && current !== null ? viewerAnnouncement(item, current, total) : ""}
      </p>

      {item && current !== null && (
        <>
          <div className="flex shrink-0 items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:py-4">
            <p aria-hidden="true" className="text-small font-semibold tabular-nums text-muted-inverse">
              {multiple ? T.position(current + 1, total) : ""}
            </p>
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              className="inline-flex size-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors duration-(--duration-fast) hover:bg-white hover:text-brand"
            >
              <X aria-hidden="true" className="size-5" />
              <span className="sr-only">{T.close}</span>
            </button>
          </div>

          <div
            className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-2 sm:px-20"
            onClick={(event) => {
              if (event.target === event.currentTarget) onClose();
            }}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            {item.type === "photo" ? (
              <ViewerImage key={item.id} path={item.image.path} alt={item.image.alt} />
            ) : (
              <div className="w-[min(100%,calc((100dvh_-_13rem)*16/9))] max-w-5xl">
                <VideoEmbed key={item.id} provider={item.provider} url={item.url} title={item.caption ?? undefined} poster={item.poster} />
              </div>
            )}

          </div>

          <div className="flex min-h-20 shrink-0 items-center gap-3 px-4 pt-3 pb-5 sm:block sm:px-20 sm:pb-6">
            {multiple && (
              <button type="button" onClick={() => go(-1)} className={cn(NAV_BUTTON, "sm:left-5")}>
                <ChevronLeft aria-hidden="true" className="size-6" />
                <span className="sr-only">{T.previous}</span>
              </button>
            )}
            <div className="min-w-0 flex-1 text-center">
              {item.caption && <p className="mx-auto max-w-measure text-body text-white">{item.caption}</p>}
              {date && (
                <p className="mt-1 text-small text-muted-inverse">
                  <time dateTime={isoDate(item.takenOn)}>{date}</time>
                </p>
              )}
            </div>
            {multiple && (
              <button type="button" onClick={() => go(1)} className={cn(NAV_BUTTON, "sm:right-5")}>
                <ChevronRight aria-hidden="true" className="size-6" />
                <span className="sr-only">{T.next}</span>
              </button>
            )}
          </div>
        </>
      )}
    </dialog>
  );
}

/** Photo entière, centrée, sur fond sombre (voir l'en-tête du fichier). */
function ViewerImage({ path, alt }: { path: string; alt: string }) {
  const { src, srcSet } = responsiveImage({ path, alt });
  return (
    <div className="pointer-events-none absolute inset-x-4 inset-y-0 sm:inset-x-20">
      <img
        src={src}
        srcSet={srcSet}
        sizes={srcSet ? "100vw" : undefined}
        alt={alt}
        decoding="async"
        className="pointer-events-auto absolute inset-0 m-auto max-h-full max-w-full object-contain"
      />
    </div>
  );
}
