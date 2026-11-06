import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { GalleryForm } from "@/components/admin/contenus/forms/GalleryForm";
import { ListAnnouncer } from "@/components/admin/contenus/ListAnnouncer";
import { stateNotice } from "@/components/admin/contenus/page-helpers";
import { AdminPageHeader, EditLayout } from "@/components/admin/contenus/ui";
import { GalleryVisibility } from "@/components/admin/contenus/visibility";
import { requireAdminPage } from "@/server/auth/guard";
import { getAdminGalleryItem } from "@/server/data/admin/content";
import { listAdminProjectOptions } from "@/server/data/admin/options";

export const instant = false;

export const metadata: Metadata = { title: "Modifier un élément de la galerie" };

export default async function EditGalleryItemPage({ params, searchParams }: PageProps<"/admin/galerie/[id]">) {
  await requireAdminPage("admin");
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const [item, projects] = await Promise.all([getAdminGalleryItem(id), listAdminProjectOptions()]);
  if (!item) notFound();
  const name = item.caption || item.imageAlt || (item.itemType === "video" ? "Vidéo" : "Photo");

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title={item.itemType === "video" ? "Vidéo de la galerie" : "Photo de la galerie"}
        back={{ href: "/admin/galerie", label: "Retour à la galerie" }}
      />
      <ListAnnouncer initial={stateNotice(query, { created: "Élément ajouté (non publié)." })} />
      <EditLayout aside={<GalleryVisibility id={item.id} name={name} published={item.isPublished} />}>
        <GalleryForm item={item} projects={projects} nextOrder={item.displayOrder} />
      </EditLayout>
    </div>
  );
}
