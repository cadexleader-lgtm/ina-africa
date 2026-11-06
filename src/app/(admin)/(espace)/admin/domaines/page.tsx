import type { Metadata } from "next";
import { Plus, Target } from "lucide-react";

import { ListAnnouncer } from "@/components/admin/contenus/ListAnnouncer";
import { stateNotice } from "@/components/admin/contenus/page-helpers";
import { AreaTable } from "@/components/admin/contenus/tables";
import { AdminPageHeader } from "@/components/admin/contenus/ui";
import { LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireAdminPage } from "@/server/auth/guard";
import { listAdminActionAreas } from "@/server/data/admin/content";

export const instant = false;

export const metadata: Metadata = { title: "Domaines d'intervention" };

export default async function AreasPage({ searchParams }: PageProps<"/admin/domaines">) {
  await requireAdminPage("admin");
  const [areas, params] = await Promise.all([listAdminActionAreas(), searchParams]);

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Domaines d'intervention"
        description="Seuls les domaines actifs apparaissent sur le site, dans l'ordre ci-dessous. Activez un domaine une fois son texte rédigé."
        actions={
          <LinkButton href="/admin/domaines/nouveau" iconLeft={<Plus />}>
            Nouveau domaine
          </LinkButton>
        }
      />
      <ListAnnouncer initial={stateNotice(params, { deleted: "Domaine supprimé." })} />
      {areas.length === 0 ? (
        <EmptyState icon={Target} surface="white" headingLevel="h2" title="Aucun domaine" description="Ajoutez les domaines d'intervention de l'ONG." />
      ) : (
        <AreaTable areas={areas} />
      )}
    </div>
  );
}
