import { Accessibility, ArrowRight, Baby, GraduationCap, HeartHandshake, type LucideIcon } from "lucide-react";

import { AfricaMapSlideshow, type MapSlide } from "@/components/home/AfricaMapSlideshow";
import { LinkButton } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { Eyebrow } from "@/components/ui/SectionHeading";
import { AUDIENCES, ORGANISATION_INTRO } from "@/content/fr/ina-africa";
import { ILLUSTRATIONS, shortCredit } from "@/content/illustrations";
import { T } from "@/content/fr/site";

/** Photos libres du Bénin qui défilent dans la carte (crédits sur /credits-photos). */
const MAP_SLIDES: MapSlide[] = ILLUSTRATIONS.map((item) => ({ src: item.path, alt: item.alt, credit: shortCredit(item) }));

const AUDIENCE_ICONS: LucideIcon[] = [HeartHandshake, GraduationCap, Baby, Accessibility];

/** Section 2 : présentation de l'organisation, publics accompagnés, carte de l'Afrique animée (photos du Bénin). */
export function HomeAbout() {
  return (
    <Section labelledBy="accueil-presentation">
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
          <Reveal className="lg:col-span-7">
            <Eyebrow className="mb-4">{T.home.about.label}</Eyebrow>
            <h2 id="accueil-presentation" className="text-h2">
              {T.home.about.title}
            </h2>
            <div className="mt-6 space-y-4 text-body text-ink">
              {ORGANISATION_INTRO.map((paragraph) => (
                <p key={paragraph.slice(0, 32)}>{paragraph}</p>
              ))}
            </div>

            <h3 className="mt-8 text-h4">Les publics que nous accompagnons</h3>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {AUDIENCES.map((audience, index) => {
                const Icon = AUDIENCE_ICONS[index % AUDIENCE_ICONS.length];
                return (
                  <li key={audience.title} className="flex gap-3 rounded-card bg-ivory p-4">
                    <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-brand-2">
                      <Icon className="size-5" strokeWidth={1.75} />
                    </span>
                    <span>
                      <span className="block font-semibold text-brand">{audience.title}</span>
                      <span className="text-small text-muted">{audience.text}</span>
                    </span>
                  </li>
                );
              })}
            </ul>

            <LinkButton href="/a-propos" variant="secondary" className="mt-8" iconRight={<ArrowRight aria-hidden="true" />}>
              {T.home.about.more}
            </LinkButton>
          </Reveal>

          <Reveal delay={120} className="lg:col-span-5">
            <AfricaMapSlideshow slides={MAP_SLIDES} />
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}
