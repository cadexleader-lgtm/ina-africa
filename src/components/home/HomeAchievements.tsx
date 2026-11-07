import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

import { Container } from "@/components/ui/Container";
import { ResponsiveImage } from "@/components/ui/ResponsiveImage";
import { Reveal } from "@/components/ui/Reveal";
import { Section, type SectionTone } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { AchievementCard } from "@/components/site/AchievementCard";
import { ACHIEVEMENTS, AREAS, EXPERIENCE, WOMEN_PROGRAM, type Achievement } from "@/content/fr/ina-africa";
import { cn } from "@/lib/cn";
import type { SiteSettings } from "@/lib/types/content";

/**
 * Section 6 : actions documentées (document « Présentation de
 * l'organisation ») et programme d'autonomisation des femmes. Titre, texte
 * et photo modifiables dans l'administration (paramètres « impact »).
 * Aucune date, aucun chiffre, aucun partenaire : le document n'en donne pas.
 */
export function HomeAchievements({
  settings,
  tone = "ivory",
  id = "accueil-terrain",
  limit,
  groupByArea = false,
}: {
  settings: SiteSettings;
  tone?: SectionTone;
  id?: string;
  /** Nombre d'actions affichées (les plus récentes d'abord) ; toutes par défaut. */
  limit?: number;
  /** Actions classées par domaine d'action (page Projets). */
  groupByArea?: boolean;
}) {
  const title = settings.impactTitle ?? EXPERIENCE.title;
  const intro = settings.impactText ?? EXPERIENCE.intro;
  const photo = settings.impactImage;

  return (
    <Section id={id} tone={tone} labelledBy={`${id}-titre`}>
      <Container>
        <Reveal>
          <SectionHeading id={`${id}-titre`} label="Nos actions sur le terrain" title={title} intro={intro} />
        </Reveal>

        {groupByArea ? (
          <AchievementsByArea id={id} />
        ) : (
          <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {(limit ? ACHIEVEMENTS.slice(0, limit) : ACHIEVEMENTS).map((achievement, index) => (
              <li key={achievement.title} className="flex">
                <Reveal delay={(index % 3) * 80} className="flex w-full">
                  <AchievementCard achievement={achievement} />
                </Reveal>
              </li>
            ))}
          </ul>
        )}
        {limit && ACHIEVEMENTS.length > limit && (
          <p className="mt-6">
            <Link
              href="/projets#actions-documentees"
              className="inline-flex items-center gap-1.5 font-semibold text-link hover:text-link-strong"
            >
              Voir toutes nos actions ({ACHIEVEMENTS.length})
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </p>
        )}

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

/** Les plus récentes d'abord ; les actions non datées ensuite, dans l'ordre transmis par l'ONG. */
function byDate(a: Achievement, b: Achievement): number {
  if (a.date && b.date) return b.date.localeCompare(a.date);
  return a.date ? -1 : b.date ? 1 : 0;
}

const OTHER_GROUP = { slug: "autres", title: "Autres actions" };

/** Actions classées par domaine d'action, dans l'ordre des domaines ; celles sans domaine à la fin. */
function AchievementsByArea({ id }: { id: string }) {
  const groups = [
    ...AREAS.map((area) => ({
      slug: area.slug,
      title: area.title,
      href: `/domaines/${area.slug}`,
      items: ACHIEVEMENTS.filter((achievement) => achievement.areaSlug === area.slug),
    })),
    {
      ...OTHER_GROUP,
      href: null,
      items: ACHIEVEMENTS.filter((achievement) => !AREAS.some((area) => area.slug === achievement.areaSlug)),
    },
  ]
    .filter((group) => group.items.length > 0)
    .map((group) => ({ ...group, items: [...group.items].sort(byDate) }));

  return (
    <div className="flex flex-col gap-12">
      <nav aria-label="Actions par domaine" className="flex flex-wrap gap-2">
        {groups.map((group) => (
          <a
            key={group.slug}
            href={`#${id}-${group.slug}`}
            className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-white px-4 py-1.5 text-small font-semibold text-brand transition-colors hover:border-brand hover:bg-brand-50"
          >
            {group.title}
            <span className="rounded-full bg-brand-50 px-2 text-brand tabular-nums">{group.items.length}</span>
          </a>
        ))}
      </nav>

      {groups.map((group) => (
        <section key={group.slug} id={`${id}-${group.slug}`} aria-labelledby={`${id}-${group.slug}-titre`} className="scroll-mt-28">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-line pb-3">
            <h3 id={`${id}-${group.slug}-titre`} className="text-h3">
              {group.title}
            </h3>
            {group.href && (
              <Link href={group.href} className="inline-flex items-center gap-1.5 font-semibold text-link hover:text-link-strong">
                Voir le domaine
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            )}
          </div>
          <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {group.items.map((achievement) => (
              <li key={achievement.title} className="flex">
                <AchievementCard achievement={achievement} showArea={false} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
