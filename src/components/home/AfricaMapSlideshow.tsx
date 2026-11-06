"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { Pause, Play } from "lucide-react";

import { AFRICA_HEIGHT, AFRICA_PATH, AFRICA_VIEWBOX, AFRICA_WIDTH, BENIN_POINT } from "@/content/africa-map";
import { cn } from "@/lib/cn";

export type MapSlide = { src: string; alt: string; credit?: string };

/**
 * Carte de l'Afrique animée (accueil) : le contour se dessine, puis des photos
 * défilent en fondu À L'INTÉRIEUR de la carte ; le Bénin est signalé par un
 * point doré.
 *
 * Accessibilité : pause au survol et au focus, bouton Pause/Lecture (contenu
 * qui bouge plus de 5 s, WCAG 2.2.2), points de navigation, AUCUN mouvement si
 * l'utilisateur a demandé à réduire les animations (première photo fixe).
 * Performance : seules la photo affichée, la précédente et la suivante sont chargées.
 */
export function AfricaMapSlideshow({ slides, interval = 5500 }: { slides: MapSlide[]; interval?: number }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [reduced, setReduced] = useState(false);
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const clipId = `afrique-${uid}`;
  const titleId = `afrique-titre-${uid}`;

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  const running = !paused && !hovered && !reduced && slides.length > 1;

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % slides.length), interval);
    return () => window.clearInterval(timer);
  }, [running, slides.length, interval]);

  if (slides.length === 0) return null;
  const current = slides[index];
  // Seules la photo précédente (fondu de sortie), l'actuelle et la suivante
  // (préchargée) sont dans la page.
  const mounted = new Set([index, (index + 1) % slides.length, (index - 1 + slides.length) % slides.length]);

  return (
    <figure
      className="relative mx-auto w-full max-w-[34rem]"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setHovered(true)}
      onBlurCapture={() => setHovered(false)}
    >
      <svg viewBox={AFRICA_VIEWBOX} role="img" aria-labelledby={titleId} className="h-auto w-full overflow-visible">
        <title id={titleId}>{`Carte de l'Afrique illustrée de photos. ${current.alt}`}</title>
        <defs>
          <clipPath id={clipId}>
            <path d={AFRICA_PATH} />
          </clipPath>
        </defs>

        {/* Ombre décalée du contour, en bleu clair (décor). */}
        <path d={AFRICA_PATH} transform="translate(18 20)" className="fill-brand-50" />

        <g clipPath={`url(#${clipId})`}>
          <rect width={AFRICA_WIDTH} height={AFRICA_HEIGHT} className="fill-brand-50" />
          {slides.map((slide, i) =>
            mounted.has(i) ? (
              <image
                key={slide.src}
                href={slide.src}
                width={AFRICA_WIDTH}
                height={AFRICA_HEIGHT}
                preserveAspectRatio="xMidYMid slice"
                className={cn(
                  "transition-opacity duration-[1400ms] ease-out motion-reduce:transition-none",
                  i === index ? "opacity-100" : "opacity-0",
                )}
              />
            ) : null,
          )}
        </g>

        {/* Bordure : se dessine à l'arrivée (aucune animation si mouvement réduit). */}
        <path
          d={AFRICA_PATH}
          pathLength={1}
          className="africa-outline fill-none stroke-gold"
          strokeWidth={7}
          strokeLinejoin="round"
        />
        <path d={AFRICA_PATH} className="fill-none stroke-white/70" strokeWidth={2} strokeLinejoin="round" />

        {/* Le Bénin. */}
        <g transform={`translate(${BENIN_POINT.x} ${BENIN_POINT.y})`}>
          <circle r={34} className="benin-pulse fill-gold/40" />
          <circle r={14} className="fill-gold stroke-white" strokeWidth={4} />
        </g>
      </svg>

      <figcaption className="mt-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <span className="min-w-0 text-small text-muted">
          <span className="font-semibold text-brand">Photo d&apos;illustration</span>
          {current.credit && (
            <>
              {" · "}
              <Link href="/credits-photos" className="text-link underline underline-offset-4 hover:text-link-strong">
                {current.credit}
              </Link>
            </>
          )}
        </span>

        {slides.length > 1 && (
          <span className="flex items-center gap-2">
            {slides.map((slide, i) => (
              <button
                key={slide.src}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Afficher la photo ${i + 1} sur ${slides.length}`}
                aria-current={i === index ? "true" : undefined}
                className={cn(
                  "h-2.5 rounded-full transition-all duration-(--duration-base)",
                  i === index ? "w-7 bg-brand" : "w-2.5 bg-line-strong hover:bg-muted",
                )}
              />
            ))}
            {!reduced && (
              <button
                type="button"
                onClick={() => setPaused((p) => !p)}
                aria-pressed={paused}
                className="ml-2 inline-flex size-9 items-center justify-center rounded-full border border-line-strong text-brand transition-colors duration-(--duration-fast) hover:bg-brand-50"
              >
                {paused ? <Play aria-hidden="true" className="size-4" /> : <Pause aria-hidden="true" className="size-4" />}
                <span className="sr-only">{paused ? "Reprendre le défilement des photos" : "Mettre en pause le défilement des photos"}</span>
              </button>
            )}
          </span>
        )}
      </figcaption>
    </figure>
  );
}
