import { ArrowRight, FolderOpen, SearchX } from "lucide-react";

import { LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { ActiveFilters, ProjectFilters } from "@/components/pages/projects/ProjectFilters";
import { ProjectGrid } from "@/components/pages/projects/ProjectGrid";
import { hasActiveFilter, parseProjectFilters, projectFilterParams, projectsHref } from "@/components/pages/page-helpers";
import { PAGES } from "@/content/fr/pages";
import type { SearchParamsRecord } from "@/lib/pagination";
import { listProjects } from "@/server/data/projects";
import { listActionAreas } from "@/server/data/site";

const T = PAGES.projects;

/**
 * Filtres + résultats de /projets, à partir des paramètres d'adresse DÉJÀ lus
 * par la page. Paramètres inconnus ignorés.
 */
export async function ProjectResults({ searchParams }: { searchParams: SearchParamsRecord }) {
  const areas = await listActionAreas();
  const filters = parseProjectFilters(searchParams, areas.map((area) => area.slug));
  const result = await listProjects({ area: filters.area, status: filters.status, page: filters.page });
  const filtered = hasActiveFilter(filters);
  const pageMissing = filters.page > 1 && result.items.length === 0;
  const nothingPublished = !filtered && !pageMissing && result.total === 0;

  if (nothingPublished) {
    return (
      <EmptyState
        icon={FolderOpen}
        headingLevel="h2"
        title={T.emptyTitle}
        description={T.emptyText}
        action={
          <LinkButton href="/domaines" variant="secondary" iconRight={<ArrowRight aria-hidden="true" />}>
            {T.emptyLink}
          </LinkButton>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <ProjectFilters areas={areas} filters={filters} />

      <section aria-labelledby="projets-resultats" className="flex flex-col gap-6">
        <div className="flex flex-col gap-3 border-b border-line pb-5 sm:flex-row sm:items-center sm:justify-between">
          <h2 id="projets-resultats" className="text-h4" aria-live="polite">
            {T.count(result.total)}
          </h2>
          <ActiveFilters areas={areas} filters={filters} />
        </div>

        {pageMissing ? (
          <EmptyState
            icon={SearchX}
            title={T.pageMissingTitle}
            description={T.pageMissingText}
            action={
              <LinkButton href={projectsHref(filters)} variant="secondary">
                {T.pageMissingLink}
              </LinkButton>
            }
          />
        ) : result.items.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title={T.noResultTitle}
            description={T.noResultText}
            action={
              <LinkButton href="/projets" variant="secondary">
                {T.clear}
              </LinkButton>
            }
          />
        ) : (
          <>
            <ProjectGrid projects={result.items} />
            <Pagination
              page={result.page}
              pageCount={result.pageCount}
              basePath="/projets"
              searchParams={projectFilterParams(filters)}
              label={T.pagination}
              className="mt-6"
            />
          </>
        )}
      </section>
    </div>
  );
}
