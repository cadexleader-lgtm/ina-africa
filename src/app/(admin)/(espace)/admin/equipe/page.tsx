import type { Metadata } from "next";
import { Plus, Users } from "lucide-react";

import { ListAnnouncer } from "@/components/admin/contenus/ListAnnouncer";
import { stateNotice } from "@/components/admin/contenus/page-helpers";
import { TeamTable } from "@/components/admin/contenus/tables";
import { AdminPageHeader } from "@/components/admin/contenus/ui";
import { LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireAdminPage } from "@/server/auth/guard";
import { listAdminTeamMembers } from "@/server/data/admin/content";

export const instant = false;

export const metadata: Metadata = { title: "Équipe" };

export default async function TeamPage({ searchParams }: PageProps<"/admin/equipe">) {
  await requireAdminPage("admin");
  const [members, params] = await Promise.all([listAdminTeamMembers(), searchParams]);

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Équipe"
        description="Membres présentés sur la page « À propos », dans l'ordre ci-dessous. Avec l'accord de chaque personne."
        actions={
          <LinkButton href="/admin/equipe/nouveau" iconLeft={<Plus />}>
            Nouveau membre
          </LinkButton>
        }
      />
      <ListAnnouncer initial={stateNotice(params, { deleted: "Fiche supprimée." })} />
      {members.length === 0 ? (
        <EmptyState icon={Users} surface="white" headingLevel="h2" title="Aucun membre" description="Aucun membre de l'équipe enregistré." />
      ) : (
        <TeamTable members={members} />
      )}
    </div>
  );
}
