import type { Metadata } from "next";

import { CampaignForm } from "@/components/admin/contenus/forms/CampaignForm";
import { AdminPageHeader } from "@/components/admin/contenus/ui";
import { requireAdminPage } from "@/server/auth/guard";

export const instant = false;

export const metadata: Metadata = { title: "Nouvel appel aux dons" };

export default async function NewCampaignPage() {
  await requireAdminPage("admin");
  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Nouvel appel aux dons"
        description="L'appel est créé inactif : activez-le une fois le texte vérifié pour pouvoir partager son lien."
        back={{ href: "/admin/appels-aux-dons", label: "Retour aux appels aux dons" }}
      />
      <CampaignForm campaign={null} />
    </div>
  );
}
