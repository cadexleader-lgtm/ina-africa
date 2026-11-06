import Link from "next/link";
import { ArrowRight, CalendarDays, FileCheck2, MapPin, Users } from "lucide-react";

import { AREAS, type Achievement } from "@/content/fr/ina-africa";
import { cn } from "@/lib/cn";

/** « 26 août 2023 » à partir d'une date AAAA-MM-JJ (fuseau neutre). */
export function formatAchievementDate(date: string): string {
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${date}T00:00:00Z`),
  );
}

/**
 * Carte d'une action menée par l'ONG (contenu officiel) : date si elle est
 * connue (sinon « Action documentée »), titre, texte, lieu, public, domaine.
 * Jamais de photo : une illustration ne doit pas passer pour une preuve.
 */
export function AchievementCard({ achievement, showArea = true, className }: { achievement: Achievement; showArea?: boolean; className?: string }) {
  const area = showArea && achievement.areaSlug ? AREAS.find((item) => item.slug === achievement.areaSlug) : undefined;
  const hasFacts = Boolean(achievement.place || achievement.audience);
  return (
    <article className={cn("flex w-full flex-col rounded-card border border-line bg-white p-6 shadow-card", className)}>
      {achievement.date ? (
        <p className="inline-flex items-center gap-1.5 self-start rounded-full bg-brand px-3 py-1 text-small font-semibold text-white">
          <CalendarDays aria-hidden="true" className="size-4" />
          <time dateTime={achievement.date}>{formatAchievementDate(achievement.date)}</time>
        </p>
      ) : (
        <p className="inline-flex items-center gap-1.5 self-start rounded-full bg-success-50 px-3 py-1 text-small font-semibold text-success">
          <FileCheck2 aria-hidden="true" className="size-4" />
          Action documentée
        </p>
      )}
      <h3 className="mt-4 text-h4">{achievement.title}</h3>
      <p className="mt-2 text-small text-muted">{achievement.text}</p>
      {hasFacts && (
        <dl className="mt-5 space-y-2 border-t border-line pt-4 text-small">
          {achievement.place && (
            <div className="flex items-start gap-2">
              <dt className="sr-only">Lieu</dt>
              <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-brand-2" />
              <dd className="text-ink">{achievement.place}</dd>
            </div>
          )}
          {achievement.audience && (
            <div className="flex items-start gap-2">
              <dt className="sr-only">Public</dt>
              <Users aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-brand-2" />
              <dd className="text-ink">{achievement.audience}</dd>
            </div>
          )}
        </dl>
      )}
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
  );
}
