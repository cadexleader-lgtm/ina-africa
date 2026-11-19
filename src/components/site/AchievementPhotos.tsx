"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Images } from "lucide-react";

import { ResponsiveImage } from "@/components/ui/ResponsiveImage";
import { MediaViewer } from "@/components/pages/gallery/MediaViewer";
import type { GalleryItem } from "@/lib/types/content";

/**
 * Photos d'une action de l'ONG : la première en couverture de la carte ; un
 * clic ouvre la visionneuse plein écran (précédent / suivant, Échap).
 * Sans JavaScript, la couverture est un lien vers la photo en grand.
 */
export function AchievementPhotos({ title, photos }: { title: string; photos: { path: string; alt: string }[] }) {
  const items = useMemo<GalleryItem[]>(
    () => photos.map((photo, index) => ({ id: `${index}`, type: "photo", image: photo, caption: title, takenOn: null })),
    [photos, title],
  );
  const [index, setIndex] = useState<number | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const close = useCallback(() => setIndex(null), []);

  // Retour du focus sur la couverture après la fermeture.
  useEffect(() => {
    if (index === null && opener.current) {
      opener.current.focus();
      opener.current = null;
    }
  }, [index]);

  const cover = photos[0];
  if (!cover) return null;

  return (
    <>
      <a
        href={cover.path}
        onClick={(event) => {
          if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
          event.preventDefault();
          opener.current = event.currentTarget;
          setIndex(0);
        }}
        className="group/photos relative -mx-6 -mt-6 mb-5 block cursor-zoom-in overflow-hidden rounded-t-card"
      >
        <ResponsiveImage
          image={cover}
          aspect="16/10"
          sizes="(min-width: 1024px) 380px, (min-width: 768px) 50vw, 100vw"
          imgClassName="transition-transform duration-500 group-hover/photos:scale-[1.03] motion-reduce:transition-none"
        />
        <span className="absolute right-3 bottom-3 inline-flex items-center gap-1.5 rounded-full bg-brand px-3 py-1 text-small font-semibold text-white shadow-card">
          <Images aria-hidden="true" className="size-4" />
          Voir les {photos.length} photos
        </span>
      </a>
      <MediaViewer items={items} index={index} onChange={setIndex} onClose={close} />
    </>
  );
}
