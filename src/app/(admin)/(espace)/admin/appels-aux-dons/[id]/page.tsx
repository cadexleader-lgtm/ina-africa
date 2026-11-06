import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ShareLinkPanel } from "@/components/admin/contenus/ShareLinkPanel";
import { CampaignForm } from "@/components/admin/contenus/forms/CampaignForm";
import { ListAnnouncer } from "@/components/admin/contenus/ListAnnouncer";
import { stateNotice } from "@/components/admin/contenus/page-helpers";
import { AdminPageHeader, EditLayout } from "@/components/admin/contenus/ui";
import { CampaignVisibility } from "@/components/admin/contenus/visibility";
import { absoluteUrl } from "@/lib/site-url";
import { requireAdminPage } from "@/server/auth/guard";
import { getAdminCampaign } from "@/server/data/admin/campaigns";

export const instant = false;

export const metadata: Metadata = { title: "Modifier un appel aux dons" };

export default async function EditCampaignPage({ params, searchParams }: PageProps<"/admin/appels-aux-dons/[id]">) {
  await requireAdminPage("admin");
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const campaign = await getAdminCampaign(id);
  if (!campaign) notFound();

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader title={campaign.title} back={{ href: "/admin/appels-aux-dons", label: "Retour aux appels aux dons" }} />
      <ListAnnouncer initial={stateNotice(query, { created: "Appel aux dons créé (inactif)." })} />
      <EditLayout
        aside={
          <>
            <CampaignVisibility id={campaign.id} slug={campaign.slug} title={campaign.title} active={campaign.isActive} />
            {campaign.isActive && <ShareLinkPanel url={absoluteUrl(`/faire-un-don/${campaign.slug}`)} />}
          </>
        }
      >
        <CampaignForm campaign={campaign} />
      </EditLayout>
    </div>
  );
}
