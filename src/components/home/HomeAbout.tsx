import { Accessibility, ArrowRight, Baby, GraduationCap, HeartHandshake, type LucideIcon } from "lucide-react";

import { LinkButton } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { ResponsiveImage } from "@/components/ui/ResponsiveImage";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { Eyebrow } from "@/components/ui/SectionHeading";
import { AFRICA_PATH, AFRICA_VIEWBOX, BENIN_POINT } from "@/content/africa-map";
import { AUDIENCES, ORGANISATION_INTRO } from "@/content/fr/ina-africa";
import { HOME_PHOTOS } from "@/content/provisional-images";
import { T } from "@/content/fr/site";

const AUDIENCE_ICONS: LucideIcon[] = [HeartHandshake, GraduationCap, Baby, Accessibility];

/** Petite carte de l'Afrique : situe le Bénin (décor, le texte le dit déjà). */
function BeninBadge() {
  return (
    <div className="absolute -bottom-6 -left-4 flex items-center gap-3 rounded-card bg-white py-3 pr-5 pl-3 shadow-overlay sm:-left-6">
      <svg viewBox={AFRICA_VIEWBOX} aria-hidden="true" className="h-14 w-auto">
        <path d={AFRICA_PATH} className="fill-brand-50 stroke-brand" strokeWidth={14} strokeLinejoin="round" />
        <g transform={`translate(${BENIN_POINT.x} ${BENIN_POINT.y})`}>
          <circle r={70} className="benin-pulse fill-gold/40" />
          <circle r={34} className="fill-gold stroke-white" strokeWidth={10} />
        </g>
      </svg>
      <p className="text-small leading-tight">
        <span className="block font-semibold text-brand">Née au Bénin</span>
        <span className="text-muted">en 2017</span>
      </p>
    </div>
  );
}

/** Section 2 : présentation de l'organisation, publics accompagnés, photo. */
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
            <div className="relative">
              <div className="relative aspect-[4/5] overflow-hidden rounded-card rounded-tl-[4rem] sm:aspect-[4/3] lg:aspect-[4/5]">
                <ResponsiveImage
                  image={HOME_PHOTOS.presentation}
                  fill
                  focus="50% 50%"
                  sizes="(min-width: 1024px) 460px, 100vw"
                  labelPosition="top-left"
                />
              </div>
              <BeninBadge />
            </div>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}
