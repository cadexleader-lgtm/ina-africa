import Link from "next/link";
import type { ReactNode } from "react";
import { CalendarDays, MapPin } from "lucide-react";

import { projectPeriod, projectStatusLabel } from "@/components/pages/page-helpers";
import { PAGES } from "@/content/fr/pages";
import { cn } from "@/lib/cn";
import type { ProjectStatus, ProjectSummary } from "@/lib/types/content";

const T = PAGES.project;

/** Pastille décorative de l'état (le texte porte le sens). */
const STATUS_DOT: Record<ProjectStatus, string> = {
  planned: "bg-gold",
  ongoing: "bg-brand-2",
  completed: "bg-success",
  archived: "bg-line-strong",
};

export function StatusBadge({ status, className }: { status: ProjectStatus; className?: string }) {
  const label = projectStatusLabel(status);
  if (!label) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-line bg-white px-3.5 py-1.5 text-small font-semibold text-brand",
        className,
      )}
    >
      <span aria-hidden="true" className={cn("size-2 rounded-full", STATUS_DOT[status])} />
      {label}
    </span>
  );
}

/** Ligne d'informations sous le titre : état, lieu, période (seulement ce qui est renseigné). */
export function ProjectMetaLine({ project }: { project: ProjectSummary }) {
  const period = projectPeriod(project.startDate, project.endDate, project.status);
  return (
    <ul className="flex flex-wrap items-center gap-x-6 gap-y-3 text-small text-ink">
      {projectStatusLabel(project.status) && (
        <li>
          <span className="sr-only">{T.status_} : </span>
          <StatusBadge status={project.status} />
        </li>
      )}
      {project.location && (
        <li className="flex items-center gap-2">
          <MapPin aria-hidden="true" className="size-4 shrink-0 text-brand-2" />
          <span className="sr-only">{T.location} : </span>
          {project.location}
        </li>
      )}
      {period && (
        <li className="flex items-center gap-2">
          <CalendarDays aria-hidden="true" className="size-4 shrink-0 text-brand-2" />
          <span className="sr-only">{T.period} : </span>
          {period}
        </li>
      )}
    </ul>
  );
}

/** Fiche « Le projet en bref » (colonne de droite du détail). */
export function ProjectFactsCard({ project }: { project: ProjectSummary }) {
  const period = projectPeriod(project.startDate, project.endDate, project.status);
  const status = projectStatusLabel(project.status);
  const rows: { term: string; value: ReactNode }[] = [];
  if (project.area) {
    rows.push({
      term: T.area,
      value: (
        <Link
          href={`/domaines/${project.area.slug}`}
          className="font-semibold text-link underline-offset-4 hover:text-link-strong hover:underline"
        >
          {project.area.title}
        </Link>
      ),
    });
  }
  if (status) rows.push({ term: T.status_, value: status });
  if (project.location) rows.push({ term: T.location, value: project.location });
  if (period) rows.push({ term: T.period, value: period });

  if (rows.length === 0) return null;
  return (
    <div className="rounded-card border border-line bg-ivory p-6">
      <h2 className="text-small font-semibold text-muted">{T.factsTitle}</h2>
      <dl className="mt-4 divide-y divide-line">
        {rows.map((row) => (
          <div key={row.term} className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0">
            <dt className="text-small font-semibold text-brand">{row.term}</dt>
            <dd className="text-ink">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
