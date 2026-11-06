import type { Metadata } from "next";

import { TeamForm } from "@/components/admin/contenus/forms/SimpleForms";
import { AdminPageHeader } from "@/components/admin/contenus/ui";
import { requireAdminPage } from "@/server/auth/guard";
import { listAdminTeamMembers } from "@/server/data/admin/content";

export const instant = false;

export const metadata: Metadata = { title: "Nouveau membre de l'équipe" };

export default async function NewTeamMemberPage() {
  await requireAdminPage("admin");
  const members = await listAdminTeamMembers();
  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Nouveau membre de l'équipe"
        description="La fiche est créée inactive : activez-la ensuite pour l'afficher sur le site."
        back={{ href: "/admin/equipe", label: "Retour à l'équipe" }}
      />
      <TeamForm member={null} nextOrder={members.length + 1} />
    </div>
  );
}
