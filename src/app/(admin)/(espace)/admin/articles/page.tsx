import type { Metadata } from "next";
import { FileText, Plus } from "lucide-react";

import { ListAnnouncer } from "@/components/admin/contenus/ListAnnouncer";
import { ARTICLE_STATUS_LABELS } from "@/components/admin/contenus/labels";
import { firstParam, keptParams, stateNotice } from "@/components/admin/contenus/page-helpers";
import { ArticleTable } from "@/components/admin/contenus/tables";
import { AdminPageHeader, FilterBar, ResultCount } from "@/components/admin/contenus/ui";
import { LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { requireAdminPage } from "@/server/auth/guard";
import { listAdminArticles, listAdminCategories } from "@/server/data/admin/articles";

// Lit la session : rendu à chaque visite, jamais mis en cache.
export const instant = false;

export const metadata: Metadata = { title: "Articles" };

const FILTERS = ["status", "categoryId", "q", "mine"] as const;

export default async function ArticlesPage({ searchParams }: PageProps<"/admin/articles">) {
  const session = await requireAdminPage("editor");
  const params = await searchParams;
  const [list, categories] = await Promise.all([listAdminArticles(params), listAdminCategories()]);
  const filtered = FILTERS.some((name) => firstParam(params, name));
  const isAdmin = session.role !== "editor";

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Articles"
        description={
          isAdmin
            ? "Les éditeurs écrivent et soumettent les articles ; un administrateur les relit et les publie."
            : "Écrivez un article puis soumettez-le à la relecture : un administrateur le publiera."
        }
        actions={
          <LinkButton href="/admin/articles/nouveau" iconLeft={<Plus />}>
            Nouvel article
          </LinkButton>
        }
      />
      <ListAnnouncer initial={stateNotice(params, { deleted: "Article supprimé." })} />
      <FilterBar
        action="/admin/articles"
        search={{ name: "q", label: "Rechercher dans les titres", value: firstParam(params, "q") }}
        selects={[
          {
            name: "status",
            label: "État",
            allLabel: "Tous les états",
            value: firstParam(params, "status"),
            options: Object.entries(ARTICLE_STATUS_LABELS).map(([value, label]) => ({ value, label })),
          },
          {
            name: "categoryId",
            label: "Catégorie",
            allLabel: "Toutes les catégories",
            value: firstParam(params, "categoryId"),
            options: categories.map((category) => ({ value: category.id, label: category.name })),
          },
        ]}
        checkboxes={[{ name: "mine", label: "Seulement mes articles", checked: firstParam(params, "mine") === "1" }]}
      />
      {list.items.length === 0 ? (
        <EmptyState
          icon={FileText}
          surface="white"
          headingLevel="h2"
          title={filtered ? "Aucun article ne correspond à ces filtres" : "Aucun article pour l'instant"}
          description={filtered ? "Modifiez ou retirez les filtres." : "Commencez par écrire le premier article."}
        />
      ) : (
        <>
          <ResultCount total={list.total} singular="article" plural="articles" />
          <ArticleTable articles={list.items} />
          <Pagination page={list.page} pageCount={list.pageCount} basePath="/admin/articles" searchParams={keptParams(params, FILTERS)} />
        </>
      )}
    </div>
  );
}
