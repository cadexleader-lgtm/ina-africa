import { ArrowRight, Heart } from "lucide-react";

import { LinkButton } from "@/components/ui/Button";
import { ResponsiveImage } from "@/components/ui/ResponsiveImage";
import { Eyebrow } from "@/components/ui/SectionHeading";
import { PROVISIONAL_IMAGES } from "@/content/provisional-images";
import { ORG, T } from "@/content/fr/site";
import type { SiteSettings } from "@/lib/types/content";

/**
 * Hero éditorial asymétrique : texte à gauche, grande photo à droite jusqu'au
 * bord de l'écran (grille « breakout », sans 100vw → aucun débordement), bord
 * gauche courbe. Pas de carrousel. Textes : paramètres du site ; à défaut, le
 * nom officiel de l'ONG (jamais de slogan inventé).
 */
export function HomeHero({ settings }: { settings: SiteSettings }) {
  const image = settings.heroImage ?? PROVISIONAL_IMAGES.formationTechnique;

  return (
    <section aria-labelledby="accueil-titre" className="overflow-hidden bg-white">
      <div className="lg:grid lg:min-h-[36rem] lg:grid-cols-[minmax(var(--spacing-gutter),1fr)_minmax(0,40rem)_minmax(0,35rem)_minmax(var(--spacing-gutter),1fr)]">
        <div className="mx-auto box-content max-w-site px-gutter pt-12 pb-10 sm:pt-16 lg:col-start-2 lg:mx-0 lg:flex lg:max-w-none lg:flex-col lg:justify-center lg:px-0 lg:py-20 lg:pr-12">
          {settings.heroKicker && <Eyebrow className="mb-6">{settings.heroKicker}</Eyebrow>}
          <h1 id="accueil-titre" className="text-h1">
            {settings.heroTitle ?? ORG.name}
          </h1>
          <span aria-hidden="true" className="mt-6 block h-1 w-20 rounded-full bg-gold" />
          {(settings.heroText || !settings.heroTitle) && (
            <p className="mt-6 max-w-[32rem] text-lead text-ink">{settings.heroText ?? ORG.fullName}</p>
          )}
          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <LinkButton href="/a-propos" size="lg" iconRight={<ArrowRight aria-hidden="true" />}>
              {T.home.hero.primary}
            </LinkButton>
            <LinkButton href="/faire-un-don" variant="secondary" size="lg" iconLeft={<Heart aria-hidden="true" />}>
              {T.home.hero.secondary}
            </LinkButton>
          </div>
        </div>

        <div className="relative px-gutter lg:col-span-2 lg:col-start-3 lg:px-0 lg:py-10">
          {/* Trait d'accent qui suit la courbe de la photo (décoratif). */}
          <span
            aria-hidden="true"
            className="absolute inset-y-4 -left-4 hidden w-40 rounded-[9rem_0_0_9rem/50%_0_0_50%] border-l-[3px] border-brand-2 lg:block"
          />
          <div className="relative aspect-[4/3] overflow-hidden rounded-card rounded-tl-[4.5rem] sm:aspect-[16/10] lg:aspect-auto lg:h-full lg:min-h-[32rem] lg:rounded-[9rem_0_0_9rem/50%_0_0_50%]">
            <ResponsiveImage image={image} fill priority sizes="(min-width: 1024px) 55vw, 100vw" labelPosition="bottom-right" />
          </div>
        </div>
      </div>
    </section>
  );
}
