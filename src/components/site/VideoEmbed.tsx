"use client";

import { useEffect, useRef, useState } from "react";
import { ExternalLink, Play } from "lucide-react";

import { ResponsiveImage } from "@/components/ui/ResponsiveImage";
import { cn } from "@/lib/cn";
import type { ImageRef } from "@/lib/types/content";
import { videoEmbedUrl, type VideoProvider } from "@/lib/video";
import { T } from "@/content/fr/site";

type VideoEmbedProps = {
  provider: VideoProvider;
  /** Adresse publique de la vidéo (YouTube ou Facebook uniquement). */
  url: string;
  /** Titre de la vidéo : nom accessible du lecteur. */
  title?: string;
  /** Affiche (médiathèque). Aucune image n'est chargée depuis YouTube/Facebook avant le clic. */
  poster?: ImageRef | null;
  /** Ratio, défaut "16/9". */
  aspect?: string;
  className?: string;
};

const PROVIDER_NAME: Record<VideoProvider, string> = { youtube: "YouTube", facebook: "Facebook" };

/**
 * Façade vidéo : affiche + bouton lecture. Le lecteur (iframe) n'est chargé
 * qu'au clic — rien n'est demandé à YouTube ou Facebook avant (vie privée,
 * vitesse). YouTube passe par youtube-nocookie.com.
 */
export function VideoEmbed({ provider, url, title, poster, aspect = "16/9", className }: VideoEmbedProps) {
  const [playing, setPlaying] = useState(false);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const embed = videoEmbedUrl(provider, url);
  const name = PROVIDER_NAME[provider];
  const label = title || `Vidéo ${name}`;

  useEffect(() => {
    if (playing) frameRef.current?.focus();
  }, [playing]);

  if (!embed) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 font-semibold text-link underline underline-offset-4 hover:text-link-strong"
      >
        {label} — voir sur {name}
        <ExternalLink aria-hidden="true" className="size-4" />
        <span className="sr-only"> {T.a11y.newTab}</span>
      </a>
    );
  }

  return (
    <div
      className={cn("relative overflow-hidden rounded-card bg-brand", className)}
      style={{ aspectRatio: aspect.replace("/", " / ") }}
    >
      {playing ? (
        <iframe
          ref={frameRef}
          src={embed}
          title={label}
          className="absolute inset-0 h-full w-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          className="group absolute inset-0 flex h-full w-full items-center justify-center text-white [--focus-ring-color:var(--color-white)] focus-visible:outline-offset-[-4px]"
        >
          {poster && <ResponsiveImage image={{ ...poster, alt: "" }} fill sizes="(min-width: 768px) 680px, 100vw" />}
          <span aria-hidden="true" className="absolute inset-0 bg-brand-strong/35" />
          <span className="relative flex size-18 items-center justify-center rounded-full bg-white text-brand shadow-overlay transition-transform duration-(--duration-fast) motion-safe:group-hover:scale-105">
            <Play aria-hidden="true" className="ml-1 size-7 fill-current" />
          </span>
          <span className="absolute bottom-0 left-0 max-w-full p-4 text-left text-small font-semibold">
            <span className="sr-only">{T.a11y.playVideo} : </span>
            {title && <span className="block truncate">{title}</span>}
            <span className="block font-normal text-muted-inverse">{name} — chargé au clic</span>
          </span>
        </button>
      )}
    </div>
  );
}
