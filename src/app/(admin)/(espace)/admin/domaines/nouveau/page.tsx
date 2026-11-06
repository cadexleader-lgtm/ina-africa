import type { Metadata } from "next";

import { AreaForm } from "@/components/admin/contenus/forms/SimpleForms";
import { AdminPageHeader } from "@/components/admin/contenus/ui";
import { requireAdminPage } from "@/server/auth/guard";
import { listAdminActionAreas } from "@/server/data/admin/content";

export const instant = false;

export const metadata: Metadata = { title: "Nouveau domaine" };

export default async function NewAreaPage() {
  await requireAdminPage("admin");
  const areas = await listAdminActionAreas();
  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Nouveau domaine d'intervention"
        description="Le domaine est créé inactif : activez-le ensuite pour l'afficher sur le site."
        back={{ href: "/admin/domaines", label: "Retour aux domaines" }}
      />
      <AreaForm area={null} nextOrder={areas.length + 1} />
    </div>
  );
}
