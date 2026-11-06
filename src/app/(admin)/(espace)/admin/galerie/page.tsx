import type { Metadata } from "next";
import { Images, Plus } from "lucide-react";

import { ListAnnouncer } from "@/components/admin/contenus/ListAnnouncer";
import { firstParam, keptParams, stateNotice } from "@/components/admin/contenus/page-helpers";
import { GalleryTable } from "@/components/admin/contenus/tables";
import { AdminPageHeader, FilterBar, ResultCount } from "@/components/admin/contenus/ui";
import { LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { requireAdminPage } from "@/server/auth/guard";
import { listAdminGalleryItems } from "@/server/data/admin/content";
import { listAdminProjectOptions } from "@/server/data/admin/options";

export const instant = false;

export const metadata: Metadata = { title: "Galerie" };

export default async function GalleryPage({ searchParams }: PageProps<"/admin/galerie">) {
  await requireAdminPage("admin");
  const params = await searchParams;
  const [list, projects] = await Promise.all([listAdminGalleryItems(params), listAdminProjectOptions()]);
  const filtered = Boolean(firstParam(params, "projectId"));
  const projectNames = Object.fromEntries(projects.map((project) => [project.id, project.title]));

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Galerie"
        description="Photos et vidéos des actions de l'ONG. Seuls les éléments publiés apparaissent sur la page Galerie."
        actions={
          <LinkButton href="/admin/galerie/nouveau" iconLeft={<Plus />}>
            Ajouter une photo ou une vidéo
          </LinkButton>
        }
      />
      <ListAnnouncer initial={stateNotice(params, { deleted: "Élément retiré de la galerie." })} />
      {projects.length > 0 && (
        <FilterBar
          action="/admin/galerie"
          selects={[
            {
              name: "projectId",
              label: "Projet",
              allLabel: "Tous les projets",
              value: firstParam(params, "projectId"),
              options: projects.map((project) => ({ value: project.id, label: project.title })),
            },
          ]}
        />
      )}
      {list.items.length === 0 ? (
        <EmptyState
          icon={Images}
          surface="white"
          headingLevel="h2"
          title={filtered ? "Aucun élément pour ce projet" : "La galerie est vide"}
          description="Ajoutez de vraies photos ou vidéos des actions de l'ONG."
        />
      ) : (
        <>
          <ResultCount total={list.total} singular="élément" plural="éléments" />
          {(filtered || list.pageCount > 1) && (
            <p className="text-small text-muted">L&apos;ordre d&apos;affichage se modifie quand toute la galerie tient sur une page, sans filtre.</p>
          )}
          <GalleryTable items={list.items} projectNames={projectNames} reorderable={!filtered && list.pageCount === 1} />
          <Pagination page={list.page} pageCount={list.pageCount} basePath="/admin/galerie" searchParams={keptParams(params, ["projectId"])} />
        </>
      )}
    </div>
  );
}
