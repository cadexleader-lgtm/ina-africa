import type { Metadata } from "next";
import { Handshake, Plus } from "lucide-react";

import { ListAnnouncer } from "@/components/admin/contenus/ListAnnouncer";
import { stateNotice } from "@/components/admin/contenus/page-helpers";
import { PartnerTable } from "@/components/admin/contenus/tables";
import { AdminPageHeader } from "@/components/admin/contenus/ui";
import { LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireAdminPage } from "@/server/auth/guard";
import { listAdminPartners } from "@/server/data/admin/content";

export const instant = false;

export const metadata: Metadata = { title: "Partenaires" };

export default async function PartnersPage({ searchParams }: PageProps<"/admin/partenaires">) {
  await requireAdminPage("admin");
  const [partners, params] = await Promise.all([listAdminPartners(), searchParams]);

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Partenaires et sponsors"
        description="N'activez un partenaire qu'avec son accord écrit. Le bandeau des partenaires n'apparaît sur le site que s'il y en a d'actifs."
        actions={
          <LinkButton href="/admin/partenaires/nouveau" iconLeft={<Plus />}>
            Nouveau partenaire
          </LinkButton>
        }
      />
      <ListAnnouncer initial={stateNotice(params, { deleted: "Partenaire supprimé." })} />
      {partners.length === 0 ? (
        <EmptyState icon={Handshake} surface="white" headingLevel="h2" title="Aucun partenaire" description="Aucun partenaire ou sponsor enregistré." />
      ) : (
        <PartnerTable partners={partners} />
      )}
    </div>
  );
}
