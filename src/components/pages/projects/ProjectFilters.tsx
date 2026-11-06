import Form from "next/form";
import Link from "next/link";
import type { ReactNode } from "react";
import { Check, X } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { FormField, Select } from "@/components/ui/FormField";
import {
  PROJECT_PARAMS,
  PUBLIC_PROJECT_STATUSES,
  hasActiveFilter,
  projectStatusLabel,
  projectsHref,
  type ProjectListFilters,
} from "@/components/pages/page-helpers";
import { PAGES } from "@/content/fr/pages";
import { cn } from "@/lib/cn";
import type { ActionArea } from "@/lib/types/content";

const T = PAGES.projects;

type FiltersProps = {
  areas: ActionArea[];
  filters: ProjectListFilters;
};

const CHIP =
  "inline-flex min-h-10 items-center gap-1.5 rounded-full border px-4 py-1.5 text-small font-semibold " +
  "transition-colors duration-(--duration-fast)";

function Chip({ href, active, children }: { href: string; active: boolean; children: ReactNode }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? "page" : undefined}
      className={cn(
        CHIP,
        active ? "border-brand bg-brand text-white" : "border-line bg-white text-brand hover:border-brand hover:bg-brand-50",
      )}
    >
      {active && <Check aria-hidden="true" className="size-4" />}
      {children}
    </Link>
  );
}

function ChipGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:gap-6">
      <p className="shrink-0 pt-2 text-small font-semibold text-muted lg:w-44">{label}</p>
      <ul className="flex flex-wrap gap-2">{children}</ul>
    </div>
  );
}

/**
 * Filtres de la liste des projets, par LIENS (ordinateur et tablette) ou par
 * un formulaire GET (téléphone, plus compact) : tout fonctionne sans JavaScript.
 */
export function ProjectFilters({ areas, filters }: FiltersProps) {
  return (
    <>
      {/* Tablette et ordinateur : pastilles. */}
      <nav aria-label={T.filtersLabel} className="hidden flex-col gap-5 rounded-card border border-line bg-white p-6 md:flex">
        {areas.length > 0 && (
          <ChipGroup label={T.areaFilter}>
            <li>
              <Chip href={projectsHref({ status: filters.status })} active={!filters.area}>
                {T.all}
              </Chip>
            </li>
            {areas.map((area) => (
              <li key={area.id}>
                <Chip href={projectsHref({ area: area.slug, status: filters.status })} active={filters.area === area.slug}>
                  {area.title}
                </Chip>
              </li>
            ))}
          </ChipGroup>
        )}
        <ChipGroup label={T.statusFilter}>
          <li>
            <Chip href={projectsHref({ area: filters.area })} active={!filters.status}>
              {T.all}
            </Chip>
          </li>
          {PUBLIC_PROJECT_STATUSES.map((status) => (
            <li key={status}>
              <Chip href={projectsHref({ area: filters.area, status })} active={filters.status === status}>
                {projectStatusLabel(status)}
              </Chip>
            </li>
          ))}
        </ChipGroup>
      </nav>

      {/* Téléphone : deux listes déroulantes et un bouton (formulaire GET). */}
      <Form
        action="/projets"
        scroll={false}
        aria-label={T.filtersLabel}
        className="grid gap-4 rounded-card border border-line bg-white p-5 md:hidden"
      >
        {areas.length > 0 && (
          <FormField id="filtre-domaine" label={T.areaFilter}>
            {(field) => (
              <Select name={PROJECT_PARAMS.area} defaultValue={filters.area ?? ""} {...field}>
                <option value="">{T.allAreas}</option>
                {areas.map((area) => (
                  <option key={area.id} value={area.slug}>
                    {area.title}
                  </option>
                ))}
              </Select>
            )}
          </FormField>
        )}
        <FormField id="filtre-etat" label={T.statusFilter}>
          {(field) => (
            <Select name={PROJECT_PARAMS.status} defaultValue={filters.status ?? ""} {...field}>
              <option value="">{T.allStatuses}</option>
              {PUBLIC_PROJECT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {projectStatusLabel(status)}
                </option>
              ))}
            </Select>
          )}
        </FormField>
        <Button type="submit" fullWidth>
          {T.apply}
        </Button>
      </Form>
    </>
  );
}

/** Rappel des filtres actifs (chacun retirable) + « Effacer les filtres ». */
export function ActiveFilters({ areas, filters }: FiltersProps) {
  if (!hasActiveFilter(filters)) return null;
  const area = areas.find((item) => item.slug === filters.area);
  const pills: { label: string; href: string }[] = [];
  if (area) pills.push({ label: area.title, href: projectsHref({ status: filters.status }) });
  if (filters.status) pills.push({ label: projectStatusLabel(filters.status) ?? "", href: projectsHref({ area: filters.area }) });

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <p className="text-small text-muted">{T.activeFilters} :</p>
      <ul className="flex flex-wrap gap-2">
        {pills.map((pill) => (
          <li key={pill.label}>
            <Link
              href={pill.href}
              scroll={false}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-brand-50 py-1 pr-2.5 pl-3.5 text-small font-semibold text-brand transition-colors duration-(--duration-fast) hover:bg-line"
            >
              {pill.label}
              <X aria-hidden="true" className="size-4" />
              <span className="sr-only">
                {" "}
                ({T.removeFilter})
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <Link
        href="/projets"
        scroll={false}
        className="text-small font-semibold text-link underline underline-offset-4 hover:text-link-strong"
      >
        {T.clear}
      </Link>
    </div>
  );
}
