import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProjectForm } from "@/components/admin/contenus/forms/ProjectForm";
import { ListAnnouncer } from "@/components/admin/contenus/ListAnnouncer";
import { stateNotice } from "@/components/admin/contenus/page-helpers";
import { AdminPageHeader, EditLayout } from "@/components/admin/contenus/ui";
import { ProjectVisibility } from "@/components/admin/contenus/visibility";
import { requireAdminPage } from "@/server/auth/guard";
import { getAdminProject, listAdminActionAreas } from "@/server/data/admin/content";

export const instant = false;

export const metadata: Metadata = { title: "Modifier un projet" };

export default async function EditProjectPage({ params, searchParams }: PageProps<"/admin/projets/[id]">) {
  await requireAdminPage("admin");
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const [project, areas] = await Promise.all([getAdminProject(id), listAdminActionAreas()]);
  if (!project) notFound();

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader title={project.title} back={{ href: "/admin/projets", label: "Retour aux projets" }} />
      <ListAnnouncer initial={stateNotice(query, { created: "Projet créé (non publié). Complétez-le puis publiez-le." })} />
      <EditLayout aside={<ProjectVisibility id={project.id} slug={project.slug} title={project.title} published={project.isPublished} />}>
        <ProjectForm project={project} areas={areas} />
      </EditLayout>
    </div>
  );
}
