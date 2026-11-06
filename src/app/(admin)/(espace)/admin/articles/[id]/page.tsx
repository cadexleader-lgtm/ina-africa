import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ArticleEditor } from "@/components/admin/contenus/forms/ArticleEditor";
import { ListAnnouncer } from "@/components/admin/contenus/ListAnnouncer";
import { stateNotice } from "@/components/admin/contenus/page-helpers";
import { AdminPageHeader } from "@/components/admin/contenus/ui";
import { requireAdminPage } from "@/server/auth/guard";
import { getAdminArticle, listAdminCategories } from "@/server/data/admin/articles";

export const instant = false;

export const metadata: Metadata = { title: "Modifier un article" };

export default async function EditArticlePage({ params, searchParams }: PageProps<"/admin/articles/[id]">) {
  const session = await requireAdminPage("editor");
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const [article, categories] = await Promise.all([getAdminArticle(id), listAdminCategories()]);
  if (!article) notFound();

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader title={article.title} back={{ href: "/admin/articles", label: "Retour aux articles" }} />
      <ListAnnouncer initial={stateNotice(query, { created: "Brouillon créé. Continuez la rédaction puis enregistrez." })} />
      <ArticleEditor article={article} categories={categories} role={session.role} userId={session.userId} />
    </div>
  );
}
