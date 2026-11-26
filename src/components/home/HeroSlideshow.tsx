"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Heart, Pause, Play } from "lucide-react";

import { ResponsiveImage, type ImageSource } from "@/components/ui/ResponsiveImage";
import { Eyebrow } from "@/components/ui/SectionHeading";
import { cn } from "@/lib/cn";

export type HeroSlide = {
  key: string;
  kicker: string | null;
  title: string;
  /** Phrase d'accroche, en gras au-dessus du texte. */
  lead?: string | null;
  text: string | null;
  image: ImageSource;
};

/**
 * Durée d'affichage d'une diapositive : au moins `interval`, plus longtemps
 * pour un long texte (environ 35 ms par caractère), 16 s au plus.
 */
export function slideDuration(slide: Pick<HeroSlide, "title" | "lead" | "text">, interval: number): number {
  const length = slide.title.length + (slide.lead?.length ?? 0) + (slide.text?.length ?? 0);
  return Math.min(16_000, Math.max(interval, length * 35));
}

/**
 * Hero de l'accueil : texte à gauche, photo à droite, qui changent ensemble
 * toutes les 5 secondes au moins (fondu ; plus longtemps pour un long texte,
 * voir slideDuration). Le titre de la page (h1, nom de l'ONG) et
 * les boutons restent fixes.
 *
 * Accessibilité : pause au survol et au focus, bouton Pause/Lecture (WCAG
 * 2.2.2), points de navigation, aucune rotation si l'utilisateur a demandé à
 * réduire les animations. Les diapositives cachées sont inertes.
 */
export function HeroSlideshow({
  slides,
  identity,
  actions,
  interval = 5000,
  gallery,
  galleryCaptions = [],
  galleryAction,
  galleryInterval = 6000,
}: {
  slides: HeroSlide[];
  /**
   * Photos du grand fond, qui défilent à leur propre rythme (fondu enchaîné
   * et zoom lent). Sans cette liste : la photo de chaque diapositive.
   */
  gallery?: ImageSource[];
  /** Phrase affichée sur chaque photo du fond (même ordre). */
  galleryCaptions?: string[];
  /** Appel au don posé sur les photos. */
  galleryAction?: { label: string; note: string; href: string };
  galleryInterval?: number;
  /** Nom de l'ONG (h1), fixe. */
  identity: string;
  actions: ReactNode;
  interval?: number;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  const running = !paused && !hovered && !reduced && slides.length > 1;
  const photos = gallery && gallery.length > 0 ? gallery : slides.map((slide) => slide.image);
  const ownPhotos = Boolean(gallery && gallery.length > 0);
  const [photoIndex, setPhotoIndex] = useState(0);
  const shownPhoto = ownPhotos ? photoIndex : index;
  const photosRunning = ownPhotos && !paused && !reduced && photos.length > 1;

  useEffect(() => {
    if (!photosRunning) return;
    const timer = window.setTimeout(() => setPhotoIndex((i) => (i + 1) % photos.length), galleryInterval);
    return () => window.clearTimeout(timer);
  }, [photosRunning, photoIndex, photos.length, galleryInterval]);

  useEffect(() => {
    if (!running) return;
    const current = slides[index];
    const timer = window.setTimeout(
      () => setIndex((i) => (i + 1) % slides.length),
      current ? slideDuration(current, interval) : interval,
    );
    return () => window.clearTimeout(timer);
  }, [running, slides, index, interval]);

  return (
    <section
      aria-labelledby="accueil-titre"
      aria-roledescription="carrousel"
      className="relative overflow-hidden bg-ivory"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setHovered(true)}
      onBlurCapture={() => setHovered(false)}
    >
      <div className="lg:grid lg:min-h-[34rem] lg:grid-cols-2 xl:min-h-[38rem]">
        <div className="px-gutter py-12 sm:py-16 lg:flex lg:flex-col lg:justify-center lg:py-16 lg:pr-12 lg:pl-[max(var(--spacing-gutter),calc(50vw-37.5rem))] xl:pr-16">
          <h1 id="accueil-titre" className="font-heading text-h4 text-link">
            {identity}
          </h1>

          {/* Toutes les diapositives dans la même case : la hauteur reste celle de la plus longue. */}
          <div className="mt-5 grid" aria-live={running ? "off" : "polite"}>
            {slides.map((slide, i) => (
              <div
                key={slide.key}
                role="group"
                aria-roledescription="diapositive"
                aria-label={`${i + 1} sur ${slides.length}`}
                aria-hidden={i !== index}
                inert={i !== index}
                className={cn(
                  "[grid-area:1/1] transition-[opacity,translate] duration-700 ease-out motion-reduce:transition-none",
                  i === index ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0",
                )}
              >
                {slide.kicker && <Eyebrow className="mb-4">{slide.kicker}</Eyebrow>}
                <p className="font-heading text-h1 text-brand">{slide.title}</p>
                <span aria-hidden="true" className="mt-5 block h-1 w-20 rounded-full bg-gold" />
                {slide.lead && <p className="mt-5 max-w-[34rem] text-lead font-semibold text-brand">{slide.lead}</p>}
                {slide.text && (
                  // Sur téléphone, un long texte est limité à quelques lignes : le diaporama tient dans l'écran.
                  <p
                    className={cn(
                      "max-w-[34rem] text-ink",
                      slide.lead ? "mt-3 line-clamp-4 text-body md:line-clamp-none" : "mt-5 text-lead",
                    )}
                  >
                    {slide.text}
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">{actions}</div>

          {slides.length > 1 && (
            <div className="mt-8 flex items-center gap-2">
              {slides.map((slide, i) => (
                <button
                  key={slide.key}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`Afficher le message ${i + 1} sur ${slides.length}`}
                  aria-current={i === index ? "true" : undefined}
                  className={cn(
                    "h-2.5 rounded-full transition-all duration-(--duration-base)",
                    i === index ? "w-8 bg-brand" : "w-2.5 bg-line-strong hover:bg-muted",
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
                  <span className="sr-only">{paused ? "Reprendre le défilement" : "Mettre en pause le défilement"}</span>
                </button>
              )}
            </div>
          )}
        </div>

        <div className="relative aspect-[4/3] overflow-hidden bg-brand sm:aspect-[16/9] lg:aspect-auto">
          {photos.map((photo, i) => (
            <div
              key={`${photo.path}-${i}`}
              aria-hidden={i !== shownPhoto}
              className={cn(
                "absolute inset-0 transition-[opacity,filter] duration-[1600ms] ease-out motion-reduce:transition-none",
                i === shownPhoto ? "opacity-100 blur-0" : "opacity-0 blur-[2px]",
              )}
            >
              {/* Zoom et déplacement lents, en sens alternés d'une photo à l'autre. */}
              <div
                className={cn(
                  "absolute inset-0 motion-safe:animate-[kenburns-a_14s_ease-in-out_infinite_alternate]",
                  i % 2 === 1 && "motion-safe:animate-[kenburns-b_14s_ease-in-out_infinite_alternate]",
                )}
              >
                <ResponsiveImage
                  image={photo}
                  fill
                  priority={i === 0}
                  focus="50% 40%"
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  labelPosition="bottom-right"
                />
              </div>
            </div>
          ))}
          {/* Voile sombre en bas, façon cinéma : la phrase et le bouton restent lisibles. */}
          <span
            aria-hidden="true"
            className={cn(
              "absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t to-transparent",
              ownPhotos ? "h-3/4 from-black/80 via-black/35 lg:h-full lg:via-black/30" : "h-28 from-black/45",
            )}
          />
          {ownPhotos && (
            <span aria-hidden="true" className="absolute inset-0 z-10 hidden bg-gradient-to-r from-black/55 via-black/20 to-transparent lg:block" />
          )}
          {ownPhotos && (
            <div className="absolute inset-x-0 bottom-14 z-20 px-6 sm:bottom-16 lg:top-[max(2rem,calc(100svh-27rem))] lg:bottom-auto lg:px-10">
              {/* Ordinateur : placé dans la partie visible dès l'arrivée (le bandeau est plus haut que l'écran). */}
              <div className="grid">
                {photos.map((photo, i) =>
                  galleryCaptions[i] ? (
                    <p
                      key={`legende-${photo.path}-${i}`}
                      aria-hidden={i !== shownPhoto}
                      className={cn(
                        "[grid-area:1/1] max-w-[30rem] font-heading text-h3 leading-tight font-semibold text-white [text-shadow:0_2px_18px_rgb(0_0_0/0.65)] sm:text-h2",
                        "transition-[opacity,translate] duration-1000 ease-out motion-reduce:transition-none",
                        i === shownPhoto ? "translate-y-0 opacity-100 delay-500" : "translate-y-4 opacity-0",
                      )}
                    >
                      {galleryCaptions[i]}
                    </p>
                  ) : null,
                )}
              </div>
              {galleryAction && (
                <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
                  <a
                    href={galleryAction.href}
                    className="inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3 font-semibold text-brand shadow-overlay transition-transform duration-(--duration-fast) hover:scale-[1.03] motion-safe:animate-[pulse-soft_2.8s_ease-in-out_infinite]"
                  >
                    <Heart aria-hidden="true" className="size-5 fill-brand" />
                    {galleryAction.label}
                  </a>
                  <span className="text-small font-medium text-white/90">{galleryAction.note}</span>
                </div>
              )}
            </div>
          )}
          {ownPhotos && photos.length > 1 && (
            <div aria-hidden="true" className="absolute bottom-4 left-6 z-20 flex items-center gap-3 font-heading text-small font-semibold text-white lg:left-10">
              <span className="tabular-nums">
                {String(shownPhoto + 1).padStart(2, "0")} / {String(photos.length).padStart(2, "0")}
              </span>
              <span className="relative h-1 w-24 overflow-hidden rounded-full bg-white/30">
                <span
                  key={`${shownPhoto}-${photosRunning}`}
                  className={cn(
                    "absolute inset-y-0 left-0 rounded-full bg-gold",
                    photosRunning ? "animate-[hero-progress_linear_forwards]" : "w-full",
                  )}
                  style={photosRunning ? { animationDuration: `${galleryInterval}ms` } : undefined}
                />
              </span>
            </div>
          )}
          <span aria-hidden="true" className="absolute inset-y-0 left-0 z-10 hidden w-2 bg-gold lg:block" />
        </div>
      </div>
    </section>
  );
}
