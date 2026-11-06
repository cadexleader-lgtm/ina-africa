import type { Metadata } from "next";
import { FolderKanban, Plus } from "lucide-react";

import { ListAnnouncer } from "@/components/admin/contenus/ListAnnouncer";
import { firstParam, keptParams, stateNotice } from "@/components/admin/contenus/page-helpers";
import { ProjectTable } from "@/components/admin/contenus/tables";
import { AdminPageHeader, FilterBar, ResultCount } from "@/components/admin/contenus/ui";
import { LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { requireAdminPage } from "@/server/auth/guard";
import { listAdminProjects } from "@/server/data/admin/content";

export const instant = false;

export const metadata: Metadata = { title: "Projets" };

const FILTERS = ["published", "q"] as const;

export default async function ProjectsPage({ searchParams }: PageProps<"/admin/projets">) {
  await requireAdminPage("admin");
  const params = await searchParams;
  const list = await listAdminProjects(params);
  const filtered = FILTERS.some((name) => firstParam(params, name));

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Projets"
        description="Projets et réalisations de l'ONG. Un nouveau projet reste invisible jusqu'à sa publication."
        actions={
          <LinkButton href="/admin/projets/nouveau" iconLeft={<Plus />}>
            Nouveau projet
          </LinkButton>
        }
      />
      <ListAnnouncer initial={stateNotice(params, { deleted: "Projet supprimé." })} />
      <FilterBar
        action="/admin/projets"
        search={{ name: "q", label: "Rechercher dans les titres", value: firstParam(params, "q") }}
        selects={[
          {
            name: "published",
            label: "Sur le site",
            allLabel: "Tous",
            value: firstParam(params, "published"),
            options: [
              { value: "yes", label: "Publiés" },
              { value: "no", label: "Non publiés" },
            ],
          },
        ]}
      />
      {list.items.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          surface="white"
          headingLevel="h2"
          title={filtered ? "Aucun projet ne correspond à ces filtres" : "Aucun projet pour l'instant"}
          description={filtered ? "Modifiez ou retirez les filtres." : "Ajoutez les projets réels de l'ONG, avec leurs photos."}
        />
      ) : (
        <>
          <ResultCount total={list.total} singular="projet" plural="projets" />
          <ProjectTable projects={list.items} />
          <Pagination page={list.page} pageCount={list.pageCount} basePath="/admin/projets" searchParams={keptParams(params, FILTERS)} />
        </>
      )}
    </div>
  );
}
