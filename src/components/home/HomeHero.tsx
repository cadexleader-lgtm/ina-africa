import { ArrowRight, Users } from "lucide-react";

import { LinkButton } from "@/components/ui/Button";
import { ResponsiveImage } from "@/components/ui/ResponsiveImage";
import { Eyebrow } from "@/components/ui/SectionHeading";
import { HOME_PHOTOS } from "@/content/provisional-images";
import { ORG, T } from "@/content/fr/site";
import type { SiteSettings } from "@/lib/types/content";

/**
 * Hero : texte à gauche, grande photo nette à droite (pleine hauteur sur
 * ordinateur, sous le texte sur téléphone). La photo choisie dans
 * l'administration remplace la photo d'illustration.
 */
export function HomeHero({ settings }: { settings: SiteSettings }) {
  const image = settings.heroImage ?? HOME_PHOTOS.hero;

  return (
    <section aria-labelledby="accueil-titre" className="relative overflow-hidden bg-ivory">
      <div className="lg:grid lg:min-h-[34rem] lg:grid-cols-2 xl:min-h-[38rem]">
        <div className="px-gutter py-12 sm:py-16 lg:flex lg:flex-col lg:justify-center lg:py-16 lg:pr-12 lg:pl-[max(var(--spacing-gutter),calc(50vw-37.5rem))] xl:pr-16">
          {settings.heroKicker && <Eyebrow className="mb-5">{settings.heroKicker}</Eyebrow>}
          <h1 id="accueil-titre" className="text-h1">
            {settings.heroTitle ?? ORG.name}
          </h1>
          <p className="mt-5 font-heading text-h4 text-link">
            {ORG.name} — {ORG.fullName}
          </p>
          <span aria-hidden="true" className="mt-5 block h-1 w-20 rounded-full bg-gold" />
          {settings.heroText && <p className="mt-5 max-w-[34rem] text-lead text-ink">{settings.heroText}</p>}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <LinkButton href="/a-propos" size="lg" iconRight={<ArrowRight aria-hidden="true" />}>
              {T.home.hero.primary}
            </LinkButton>
            <LinkButton href="/nous-rejoindre" variant="secondary" size="lg" iconLeft={<Users aria-hidden="true" />}>
              {T.home.hero.secondary}
            </LinkButton>
          </div>
        </div>

        <div className="relative aspect-[4/3] sm:aspect-[16/9] lg:aspect-auto">
          <ResponsiveImage
            image={image}
            fill
            priority
            focus="50% 40%"
            sizes="(min-width: 1024px) 50vw, 100vw"
            labelPosition="bottom-right"
          />
          <span aria-hidden="true" className="absolute inset-y-0 left-0 hidden w-2 bg-gold lg:block" />
        </div>
      </div>
    </section>
  );
}
