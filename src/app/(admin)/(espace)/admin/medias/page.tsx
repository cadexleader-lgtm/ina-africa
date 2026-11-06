import type { Metadata } from "next";
import { BookOpen } from "lucide-react";

import { ListAnnouncer } from "@/components/admin/contenus/ListAnnouncer";
import { AdminPageHeader, Panel, ResultCount } from "@/components/admin/contenus/ui";
import { MediaGrid, MediaUploadPanel } from "@/components/admin/media/MediaLibrary";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { requireAdminPage, roleAtLeast } from "@/server/auth/guard";
import { listMedia } from "@/server/data/admin/media";

export const instant = false;

export const metadata: Metadata = { title: "Médiathèque" };

export default async function MediaPage({ searchParams }: PageProps<"/admin/medias">) {
  const session = await requireAdminPage("editor");
  const params = await searchParams;
  // Photos du site uniquement (les justificatifs des dons sont gérés avec les dons).
  const list = await listMedia({ page: params.page, bucket: "public-media" });
  const canDelete = roleAtLeast(session.role, "admin");

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Médiathèque"
        description="Photos du site. Une photo n'apparaît sur le site que lorsqu'un contenu publié l'utilise."
      />
      <ListAnnouncer />
      <Panel title="Envoyer une photo">
        <MediaUploadPanel />
      </Panel>
      <section aria-labelledby="medias-liste" className="flex flex-col gap-4">
        <h2 id="medias-liste" className="text-h3">
          Photos envoyées
        </h2>
        {list.items.length === 0 ? (
          <EmptyState icon={BookOpen} surface="white" title="Aucune photo" description="Les photos envoyées apparaîtront ici." />
        ) : (
          <>
            <ResultCount total={list.total} singular="photo" plural="photos" />
            <MediaGrid items={list.items} canDelete={canDelete} />
            <Pagination page={list.page} pageCount={list.pageCount} basePath="/admin/medias" />
          </>
        )}
      </section>
    </div>
  );
}
