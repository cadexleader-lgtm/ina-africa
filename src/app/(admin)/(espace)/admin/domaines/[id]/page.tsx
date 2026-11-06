import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AreaForm } from "@/components/admin/contenus/forms/SimpleForms";
import { ListAnnouncer } from "@/components/admin/contenus/ListAnnouncer";
import { stateNotice } from "@/components/admin/contenus/page-helpers";
import { AdminPageHeader, EditLayout } from "@/components/admin/contenus/ui";
import { AreaVisibility } from "@/components/admin/contenus/visibility";
import { requireAdminPage } from "@/server/auth/guard";
import { getAdminActionArea } from "@/server/data/admin/content";

export const instant = false;

export const metadata: Metadata = { title: "Modifier un domaine" };

export default async function EditAreaPage({ params, searchParams }: PageProps<"/admin/domaines/[id]">) {
  await requireAdminPage("admin");
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const area = await getAdminActionArea(id);
  if (!area) notFound();

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader title={area.title} back={{ href: "/admin/domaines", label: "Retour aux domaines" }} />
      <ListAnnouncer initial={stateNotice(query, { created: "Domaine créé (inactif). Complétez-le puis activez-le." })} />
      <EditLayout aside={<AreaVisibility id={area.id} slug={area.slug} title={area.title} active={area.isActive} />}>
        <AreaForm area={area} nextOrder={area.displayOrder} />
      </EditLayout>
    </div>
  );
}
