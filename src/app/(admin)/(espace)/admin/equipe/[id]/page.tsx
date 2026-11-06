import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { TeamForm } from "@/components/admin/contenus/forms/SimpleForms";
import { ListAnnouncer } from "@/components/admin/contenus/ListAnnouncer";
import { stateNotice } from "@/components/admin/contenus/page-helpers";
import { AdminPageHeader, EditLayout } from "@/components/admin/contenus/ui";
import { TeamVisibility } from "@/components/admin/contenus/visibility";
import { requireAdminPage } from "@/server/auth/guard";
import { getAdminTeamMember } from "@/server/data/admin/content";

export const instant = false;

export const metadata: Metadata = { title: "Modifier un membre de l'équipe" };

export default async function EditTeamMemberPage({ params, searchParams }: PageProps<"/admin/equipe/[id]">) {
  await requireAdminPage("admin");
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const member = await getAdminTeamMember(id);
  if (!member) notFound();

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader title={member.fullName} back={{ href: "/admin/equipe", label: "Retour à l'équipe" }} />
      <ListAnnouncer initial={stateNotice(query, { created: "Fiche créée (inactive)." })} />
      <EditLayout aside={<TeamVisibility id={member.id} name={member.fullName} active={member.isActive} />}>
        <TeamForm member={member} nextOrder={member.displayOrder} />
      </EditLayout>
    </div>
  );
}
