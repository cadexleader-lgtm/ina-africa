import Link from "next/link";
import { ArrowRight, Check, FileCheck2, MapPin, Users } from "lucide-react";

import { Container } from "@/components/ui/Container";
import { ResponsiveImage } from "@/components/ui/ResponsiveImage";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ACHIEVEMENTS, AREAS, EXPERIENCE, WOMEN_PROGRAM } from "@/content/fr/ina-africa";
import { cn } from "@/lib/cn";
import type { SiteSettings } from "@/lib/types/content";

/**
 * Section 6 : actions documentées (document « Présentation de
 * l'organisation ») et programme d'autonomisation des femmes. Titre, texte
 * et photo modifiables dans l'administration (paramètres « impact »).
 * Aucune date, aucun chiffre, aucun partenaire : le document n'en donne pas.
 */
export function HomeAchievements({ settings }: { settings: SiteSettings }) {
  const title = settings.impactTitle ?? EXPERIENCE.title;
  const intro = settings.impactText ?? EXPERIENCE.intro;
  const photo = settings.impactImage;

  return (
    <Section tone="ivory" labelledBy="accueil-terrain">
      <Container>
        <Reveal>
          <SectionHeading id="accueil-terrain" label="Nos actions sur le terrain" title={title} intro={intro} />
        </Reveal>

        <ul className="grid gap-5 md:grid-cols-3">
          {ACHIEVEMENTS.map((achievement, index) => {
            const area = AREAS.find((item) => item.slug === achievement.areaSlug);
            return (
              <li key={achievement.title} className="flex">
                <Reveal delay={index * 80} className="flex w-full">
                  <article className="flex w-full flex-col rounded-card border border-line bg-white p-6 shadow-card">
                    <p className="inline-flex items-center gap-1.5 self-start rounded-full bg-success-50 px-3 py-1 text-small font-semibold text-success">
                      <FileCheck2 aria-hidden="true" className="size-4" />
                      Action documentée
                    </p>
                    <h3 className="mt-4 text-h4">{achievement.title}</h3>
                    <p className="mt-2 text-small text-muted">{achievement.text}</p>
                    <dl className="mt-5 space-y-2 border-t border-line pt-4 text-small">
                      <div className="flex items-start gap-2">
                        <dt className="sr-only">Lieu</dt>
                        <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-brand-2" />
                        <dd className="text-ink">{achievement.place}</dd>
                      </div>
                      <div className="flex items-start gap-2">
                        <dt className="sr-only">Public</dt>
                        <Users aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-brand-2" />
                        <dd className="text-ink">{achievement.audience}</dd>
                      </div>
                    </dl>
                    {area && (
                      <Link
                        href={`/domaines/${area.slug}`}
                        className="mt-auto inline-flex items-center gap-1.5 pt-5 text-small font-semibold text-link hover:text-link-strong"
                      >
                        {area.title}
                        <ArrowRight aria-hidden="true" className="size-4" />
                      </Link>
                    )}
                  </article>
                </Reveal>
              </li>
            );
          })}
        </ul>

        <Reveal className={cn("mt-8 overflow-hidden rounded-panel bg-white shadow-card", photo && "grid md:grid-cols-12")}>
          {photo && (
            <div className="relative aspect-[4/3] md:col-span-5 md:aspect-auto">
              <ResponsiveImage image={photo} fill focus="50% 40%" sizes="(min-width: 768px) 40vw, 100vw" />
            </div>
          )}
          <div className={cn("grid gap-8 p-6 sm:p-8 lg:p-10", photo ? "md:col-span-7" : "lg:grid-cols-2 lg:gap-12")}>
            <div>
              <h3 className="text-h3">{WOMEN_PROGRAM.title}</h3>
              <p className="mt-4 text-body text-ink">{WOMEN_PROGRAM.text}</p>
              <p className="mt-4 text-small text-muted">{EXPERIENCE.impact}</p>
            </div>
            <div>
              <p className="text-small font-semibold text-brand">Les formations proposées</p>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {WOMEN_PROGRAM.trainings.map((training) => (
                  <li key={training} className="flex items-center gap-2.5 rounded-card bg-ivory px-4 py-3 text-body text-ink">
                    <span aria-hidden="true" className="flex size-6 shrink-0 items-center justify-center rounded-full bg-gold text-brand">
                      <Check className="size-4" strokeWidth={2.5} />
                    </span>
                    {training}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
