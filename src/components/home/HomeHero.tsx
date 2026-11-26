import { ArrowRight, Users } from "lucide-react";

import { HeroSlideshow, type HeroSlide } from "@/components/home/HeroSlideshow";
import { LinkButton } from "@/components/ui/Button";
import { HERO_SLIDES } from "@/content/fr/ina-africa";
import { ORG } from "@/content/fr/site";
import type { ResolvedSection } from "@/lib/page-content/resolve";

/**
 * Hero de l'accueil : première image puis diaporama des grands axes d'action.
 * Textes et photos : Pages du site → Accueil (sections « Haut de la page » et « Diaporama »).
 */
export function HomeHero({ top, slideshow }: { top: ResolvedSection; slideshow: ResolvedSection }) {
  const texts = slideshow.items("slides");
  const slides: HeroSlide[] = [
    {
      key: "accueil",
      kicker: top.line("kicker") || null,
      title: top.line("title") || ORG.name,
      text: top.text("text") || null,
      image: top.image("image")!,
    },
    ...HERO_SLIDES.map((slide, index) => ({
      key: slide.key,
      kicker: texts[index]?.kicker || null,
      title: texts[index]?.title ?? slide.title,
      lead: texts[index]?.lead || null,
      text: texts[index]?.text || null,
      image: slideshow.image(`image-${slide.key}`)!,
    })),
  ];

  return (
    <HeroSlideshow
      slides={slides}
      identity={`${ORG.name} : ${ORG.fullName}`}
      actions={
        <>
          <LinkButton href="/a-propos" size="lg" iconRight={<ArrowRight aria-hidden="true" />}>
            {top.line("primary")}
          </LinkButton>
          <LinkButton href="/nous-rejoindre" variant="secondary" size="lg" iconLeft={<Users aria-hidden="true" />}>
            {top.line("secondary")}
          </LinkButton>
        </>
      }
    />
  );
}
