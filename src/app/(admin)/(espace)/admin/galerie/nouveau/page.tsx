import type { Metadata } from "next";

import { GalleryForm } from "@/components/admin/contenus/forms/GalleryForm";
import { AdminPageHeader } from "@/components/admin/contenus/ui";
import { requireAdminPage } from "@/server/auth/guard";
import { listAdminGalleryItems } from "@/server/data/admin/content";
import { listAdminProjectOptions } from "@/server/data/admin/options";

export const instant = false;

export const metadata: Metadata = { title: "Ajouter à la galerie" };

export default async function NewGalleryItemPage() {
  await requireAdminPage("admin");
  const [projects, list] = await Promise.all([listAdminProjectOptions(), listAdminGalleryItems({})]);
  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Ajouter à la galerie"
        description="L'élément est créé non publié : publiez-le ensuite pour l'afficher sur le site."
        back={{ href: "/admin/galerie", label: "Retour à la galerie" }}
      />
      <GalleryForm item={null} projects={projects} nextOrder={list.total + 1} />
    </div>
  );
}
