import { ArrowRight, Users } from "lucide-react";

import { HeroSlideshow, type HeroSlide } from "@/components/home/HeroSlideshow";
import { LinkButton } from "@/components/ui/Button";
import { HERO_SLIDES } from "@/content/fr/ina-africa";
import { HOME_PHOTOS } from "@/content/provisional-images";
import { ORG, T } from "@/content/fr/site";
import type { SiteSettings } from "@/lib/types/content";

/**
 * Hero de l'accueil : la première diapositive reprend les paramètres du site
 * (titre, texte, photo choisis dans l'administration), les suivantes
 * présentent les grands axes d'action (contenu officiel).
 */
export function HomeHero({ settings }: { settings: SiteSettings }) {
  const slides: HeroSlide[] = [
    {
      key: "accueil",
      kicker: settings.heroKicker,
      title: settings.heroTitle ?? ORG.name,
      text: settings.heroText,
      image: settings.heroImage ?? HOME_PHOTOS.hero,
    },
    ...HERO_SLIDES.map((slide) => ({
      key: slide.key,
      kicker: slide.kicker,
      title: slide.title,
      text: slide.text,
      image: HOME_PHOTOS.heroSlides[slide.key],
    })),
  ];

  return (
    <HeroSlideshow
      slides={slides}
      identity={`${ORG.name} — ${ORG.fullName}`}
      actions={
        <>
          <LinkButton href="/a-propos" size="lg" iconRight={<ArrowRight aria-hidden="true" />}>
            {T.home.hero.primary}
          </LinkButton>
          <LinkButton href="/nous-rejoindre" variant="secondary" size="lg" iconLeft={<Users aria-hidden="true" />}>
            {T.home.hero.secondary}
          </LinkButton>
        </>
      }
    />
  );
}
