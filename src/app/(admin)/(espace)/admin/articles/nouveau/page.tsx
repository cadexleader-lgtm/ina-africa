import type { Metadata } from "next";

import { ArticleEditor } from "@/components/admin/contenus/forms/ArticleEditor";
import { AdminPageHeader } from "@/components/admin/contenus/ui";
import { requireAdminPage } from "@/server/auth/guard";
import { listAdminCategories } from "@/server/data/admin/articles";

export const instant = false;

export const metadata: Metadata = { title: "Nouvel article" };

export default async function NewArticlePage() {
  const session = await requireAdminPage("editor");
  const categories = await listAdminCategories();
  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Nouvel article"
        description="L'article est créé en brouillon : il n'est visible sur le site qu'après sa publication par un administrateur."
        back={{ href: "/admin/articles", label: "Retour aux articles" }}
      />
      <ArticleEditor article={null} categories={categories} role={session.role} userId={session.userId} />
    </div>
  );
}
