import type { Metadata } from "next";
import { HandHeart, Plus } from "lucide-react";

import { ListAnnouncer } from "@/components/admin/contenus/ListAnnouncer";
import { stateNotice } from "@/components/admin/contenus/page-helpers";
import { CampaignTable } from "@/components/admin/contenus/tables";
import { AdminPageHeader } from "@/components/admin/contenus/ui";
import { LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireAdminPage } from "@/server/auth/guard";
import { listAdminCampaigns } from "@/server/data/admin/campaigns";

export const instant = false;

export const metadata: Metadata = { title: "Appels aux dons" };

export default async function CampaignsPage({ searchParams }: PageProps<"/admin/appels-aux-dons">) {
  await requireAdminPage("admin");
  const [campaigns, params] = await Promise.all([listAdminCampaigns(), searchParams]);

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Appels aux dons"
        description="Chaque appel a sa page et un lien à partager (WhatsApp, Facebook). Il n'est visible qu'une fois activé."
        actions={
          <LinkButton href="/admin/appels-aux-dons/nouveau" iconLeft={<Plus />}>
            Nouvel appel aux dons
          </LinkButton>
        }
      />
      <ListAnnouncer initial={stateNotice(params, { deleted: "Appel aux dons supprimé." })} />
      {campaigns.length === 0 ? (
        <EmptyState icon={HandHeart} surface="white" headingLevel="h2" title="Aucun appel aux dons" description="Créez un appel pour une collecte précise." />
      ) : (
        <CampaignTable campaigns={campaigns} />
      )}
    </div>
  );
}
