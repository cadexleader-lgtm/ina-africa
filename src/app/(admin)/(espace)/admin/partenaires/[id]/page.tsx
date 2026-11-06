import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PartnerForm } from "@/components/admin/contenus/forms/SimpleForms";
import { ListAnnouncer } from "@/components/admin/contenus/ListAnnouncer";
import { stateNotice } from "@/components/admin/contenus/page-helpers";
import { AdminPageHeader, EditLayout } from "@/components/admin/contenus/ui";
import { PartnerVisibility } from "@/components/admin/contenus/visibility";
import { requireAdminPage } from "@/server/auth/guard";
import { getAdminPartner } from "@/server/data/admin/content";

export const instant = false;

export const metadata: Metadata = { title: "Modifier un partenaire" };

export default async function EditPartnerPage({ params, searchParams }: PageProps<"/admin/partenaires/[id]">) {
  await requireAdminPage("admin");
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const partner = await getAdminPartner(id);
  if (!partner) notFound();

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader title={partner.name} back={{ href: "/admin/partenaires", label: "Retour aux partenaires" }} />
      <ListAnnouncer initial={stateNotice(query, { created: "Partenaire créé (inactif)." })} />
      <EditLayout aside={<PartnerVisibility id={partner.id} name={partner.name} active={partner.isActive} />}>
        <PartnerForm partner={partner} nextOrder={partner.displayOrder} />
      </EditLayout>
    </div>
  );
}
