import { ArrowRight, Users } from "lucide-react";

import { HeroSlideshow, type HeroSlide } from "@/components/home/HeroSlideshow";
import { LinkButton } from "@/components/ui/Button";
import { HERO_SLIDES } from "@/content/fr/ina-africa";
import { ORG } from "@/content/fr/site";
import { HOME_PHOTOS } from "@/content/provisional-images";
import type { ResolvedSection } from "@/lib/page-content/resolve";

/**
 * Hero de l'accueil : première image puis diaporama des grands axes d'action.
 * Textes et photos : Pages du site → Accueil (sections « Haut de la page » et « Diaporama »).
 */
export function HomeHero({ top, slideshow, photos }: { top: ResolvedSection; slideshow: ResolvedSection; photos: ResolvedSection }) {
  const gallery = HOME_PHOTOS.heroGallery.map((_, index) => photos.image(`photo-${index + 1}`)).filter((photo) => photo !== null);
  const fallback = gallery[0]!;
  const captions = HOME_PHOTOS.heroGallery.map((_, index) => photos.line(`caption-${index + 1}`)).filter((_, index) => photos.image(`photo-${index + 1}`) !== null);
  const texts = slideshow.items("slides");
  const slides: HeroSlide[] = [
    {
      key: "accueil",
      kicker: top.line("kicker") || null,
      title: top.line("title") || ORG.name,
      text: top.text("text") || null,
      image: fallback,
    },
    ...HERO_SLIDES.map((slide, index) => ({
      key: slide.key,
      kicker: texts[index]?.kicker || null,
      title: texts[index]?.title ?? slide.title,
      lead: texts[index]?.lead || null,
      text: texts[index]?.text || null,
      image: fallback,
    })),
  ];

  return (
    <HeroSlideshow
      slides={slides}
      gallery={gallery}
      galleryCaptions={captions}
      galleryAction={{ label: photos.line("action"), note: photos.line("actionNote"), href: "/faire-un-don" }}
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
