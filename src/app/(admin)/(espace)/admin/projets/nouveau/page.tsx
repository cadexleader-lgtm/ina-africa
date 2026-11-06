import type { Metadata } from "next";

import { ProjectForm } from "@/components/admin/contenus/forms/ProjectForm";
import { AdminPageHeader } from "@/components/admin/contenus/ui";
import { requireAdminPage } from "@/server/auth/guard";
import { listAdminActionAreas } from "@/server/data/admin/content";

export const instant = false;

export const metadata: Metadata = { title: "Nouveau projet" };

export default async function NewProjectPage() {
  await requireAdminPage("admin");
  const areas = await listAdminActionAreas();
  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Nouveau projet"
        description="Le projet est créé non publié. Publiez-le une fois le texte et la photo vérifiés."
        back={{ href: "/admin/projets", label: "Retour aux projets" }}
      />
      <ProjectForm project={null} areas={areas} />
    </div>
  );
}
