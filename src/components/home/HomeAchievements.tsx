import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

import { Container } from "@/components/ui/Container";
import { ResponsiveImage } from "@/components/ui/ResponsiveImage";
import { Reveal } from "@/components/ui/Reveal";
import { Section, type SectionTone } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { AchievementCard } from "@/components/site/AchievementCard";
import { ACHIEVEMENTS, AREAS, type Achievement } from "@/content/fr/ina-africa";
import { cn } from "@/lib/cn";
import type { ResolvedSection } from "@/lib/page-content/resolve";

/**
 * Section 6 : actions documentées (document « Présentation de
 * l'organisation ») et programme d'autonomisation des femmes. Textes et photo :
 * Pages du site → Accueil → « Nos actions sur le terrain » (dates et photos
 * des actions : celles transmises par l'ONG, dans le code).
 * Aucune date, aucun chiffre, aucun partenaire : le document n'en donne pas.
 */
/** Actions documentées avec leurs textes modifiés dans l'administration (même ordre que ACHIEVEMENTS). */
export function achievementsWithTexts(s: ResolvedSection): Achievement[] {
  const texts = s.items("achievements");
  return ACHIEVEMENTS.map((achievement, index) => {
    const text = texts[index];
    if (!text) return achievement;
    return { ...achievement, title: text.title, text: text.text, place: text.place || undefined, audience: text.audience || undefined };
  });
}

export function HomeAchievements({
  s,
  tone = "ivory",
  id = "accueil-terrain",
  limit,
  groupByArea = false,
}: {
  s: ResolvedSection;
  tone?: SectionTone;
  id?: string;
  /** Nombre d'actions affichées (les plus récentes d'abord) ; toutes par défaut. */
  limit?: number;
  /** Actions classées par domaine d'action (page Projets). */
  groupByArea?: boolean;
}) {
  const achievements = achievementsWithTexts(s);
  const title = s.line("title");
  // Une première ligne seule = accroche en gras.
  const [introLead, ...introRest] = s.text("text").split(/\n+/).map((line) => line.trim()).filter(Boolean);
  const intro =
    introRest.length > 0 ? (
      <>
        <p className="font-semibold text-brand">{introLead}</p>
        {introRest.map((line) => (
          <p key={line.slice(0, 24)} className="mt-3 text-body">
            {line}
          </p>
        ))}
      </>
    ) : (
      introLead
    );
  const photo = s.image("image");

  return (
    <Section id={id} tone={tone} labelledBy={`${id}-titre`}>
      <Container>
        <Reveal>
          <SectionHeading id={`${id}-titre`} label={s.line("label")} title={title} intro={intro} />
        </Reveal>

        {groupByArea ? (
          <AchievementsByArea id={id} achievements={achievements} />
        ) : (
          <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {(limit ? achievements.slice(0, limit) : achievements).map((achievement, index) => (
              <li key={achievement.title + index} className="flex">
                <Reveal delay={(index % 3) * 80} className="flex w-full">
                  <AchievementCard achievement={achievement} />
                </Reveal>
              </li>
            ))}
          </ul>
        )}
        {limit && achievements.length > limit && (
          <p className="mt-6">
            <Link
              href="/projets#actions-documentees"
              className="inline-flex items-center gap-1.5 font-semibold text-link hover:text-link-strong"
            >
              Voir toutes nos actions ({achievements.length})
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
              <h3 className="text-h3">{s.line("womenTitle")}</h3>
              <p className="mt-4 font-semibold text-brand">{s.line("womenLead")}</p>
              {s.paragraphs("womenText").map((paragraph, index) => (
                <p key={index} className="mt-2 text-body text-ink">
                  {paragraph}
                </p>
              ))}
              <p className="mt-4 text-small text-muted">{s.text("womenNote")}</p>
            </div>
            <div>
              <p className="text-small font-semibold text-brand">{s.line("trainingsTitle")}</p>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {s.list("trainings").map((training) => (
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
function AchievementsByArea({ id, achievements }: { id: string; achievements: Achievement[] }) {
  const groups = [
    ...AREAS.map((area) => ({
      slug: area.slug,
      title: area.title,
      href: `/domaines/${area.slug}`,
      items: achievements.filter((achievement) => achievement.areaSlug === area.slug),
    })),
    {
      ...OTHER_GROUP,
      href: null,
      items: achievements.filter((achievement) => !AREAS.some((area) => area.slug === achievement.areaSlug)),
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
