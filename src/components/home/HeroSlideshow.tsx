"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Pause, Play } from "lucide-react";

import { ResponsiveImage, type ImageSource } from "@/components/ui/ResponsiveImage";
import { Eyebrow } from "@/components/ui/SectionHeading";
import { cn } from "@/lib/cn";

export type HeroSlide = { key: string; kicker: string | null; title: string; text: string | null; image: ImageSource };

/**
 * Hero de l'accueil : texte à gauche, photo à droite, qui changent ensemble
 * toutes les 5 secondes (fondu). Le titre de la page (h1, nom de l'ONG) et
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
}: {
  slides: HeroSlide[];
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

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % slides.length), interval);
    return () => window.clearInterval(timer);
  }, [running, slides.length, interval]);

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
                {slide.text && <p className="mt-5 max-w-[34rem] text-lead text-ink">{slide.text}</p>}
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

        <div className="relative aspect-[4/3] sm:aspect-[16/9] lg:aspect-auto">
          {slides.map((slide, i) => (
            <div
              key={slide.key}
              aria-hidden={i !== index}
              className={cn(
                "absolute inset-0 transition-opacity duration-1000 ease-out motion-reduce:transition-none",
                i === index ? "opacity-100" : "opacity-0",
              )}
            >
              <ResponsiveImage
                image={slide.image}
                fill
                priority={i === 0}
                focus="50% 40%"
                sizes="(min-width: 1024px) 50vw, 100vw"
                labelPosition="bottom-right"
              />
            </div>
          ))}
          <span aria-hidden="true" className="absolute inset-y-0 left-0 z-10 hidden w-2 bg-gold lg:block" />
        </div>
      </div>
    </section>
  );
}
