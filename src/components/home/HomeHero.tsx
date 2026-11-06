import { ArrowRight, Heart } from "lucide-react";

import { AfricaMapSlideshow, type MapSlide } from "@/components/home/AfricaMapSlideshow";
import { LinkButton } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/SectionHeading";
import { ILLUSTRATIONS, shortCredit } from "@/content/illustrations";
import { ORG, T } from "@/content/fr/site";
import { mediaUrl } from "@/lib/media";
import type { SiteSettings } from "@/lib/types/content";

/**
 * Hero éditorial asymétrique : texte à gauche ; à droite, une carte de
 * l'Afrique animée dans laquelle défilent des photos (demande du client,
 * 06/11/2026). La photo choisie dans l'administration passe en premier, puis
 * les illustrations sous licence libre (crédits sur /credits-photos).
 * Textes : paramètres du site ; à défaut, le nom officiel de l'ONG.
 */
export function HomeHero({ settings }: { settings: SiteSettings }) {
  const slides: MapSlide[] = [
    ...(settings.heroImage ? [{ src: mediaUrl(settings.heroImage.path), alt: settings.heroImage.alt }] : []),
    ...ILLUSTRATIONS.map((item) => ({ src: item.path, alt: item.alt, credit: shortCredit(item) })),
  ];

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

        <div className="relative flex items-center px-gutter pb-14 lg:col-span-1 lg:col-start-3 lg:px-0 lg:py-14 lg:pl-6">
          {/* Cercles décoratifs derrière la carte. */}
          <span aria-hidden="true" className="absolute top-1/2 left-1/2 hidden size-[30rem] -translate-1/2 rounded-full border border-brand-2/30 lg:block" />
          <span aria-hidden="true" className="absolute top-1/2 left-1/2 size-[22rem] -translate-1/2 rounded-full bg-ivory sm:size-[26rem]" />
          <div className="relative w-full">
            <AfricaMapSlideshow slides={slides} />
          </div>
        </div>
      </div>
    </section>
  );
}
