import type { Metadata } from "next";

import { PartnerForm } from "@/components/admin/contenus/forms/SimpleForms";
import { AdminPageHeader } from "@/components/admin/contenus/ui";
import { requireAdminPage } from "@/server/auth/guard";
import { listAdminPartners } from "@/server/data/admin/content";

export const instant = false;

export const metadata: Metadata = { title: "Nouveau partenaire" };

export default async function NewPartnerPage() {
  await requireAdminPage("admin");
  const partners = await listAdminPartners();
  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Nouveau partenaire ou sponsor"
        description="Il est créé inactif : activez-le ensuite pour l'afficher sur le site."
        back={{ href: "/admin/partenaires", label: "Retour aux partenaires" }}
      />
      <PartnerForm partner={null} nextOrder={partners.length + 1} />
    </div>
  );
}
