import "server-only";

import { articleFiltersSchema } from "@/lib/validation/admin/content";
import { check } from "@/server/admin/action";
import { sanitizeSearch } from "@/server/data/articles";
import { ADMIN_PAGE_SIZE, adminReader, first, isUuid, toDoc } from "@/server/data/admin/reader";
import type { AdminArticle, AdminArticleListItem, AdminCategory, ArticleStatus, Paginated } from "@/server/data/admin/types";
import { pageRange, paginated } from "@/server/data/reader";

type ListRow = {
  id: string;
  title: string;
  slug: string;
  status: ArticleStatus;
  submitted_at: string | null;
  published_at: string | null;
  updated_at: string;
  category: { id: string; name: string } | { id: string; name: string }[] | null;
  author: { id: string; full_name: string } | { id: string; full_name: string }[] | null;
};

/** Articles (tous statuts) pour l'équipe : filtres statut, catégorie, recherche dans le titre, « mes articles ». */
export async function listAdminArticles(filters: unknown = {}): Promise<Paginated<AdminArticleListItem>> {
  const { db, session } = await adminReader("editor");
  const f = articleFiltersSchema.parse(filters ?? {});
  const range = pageRange(f.page, ADMIN_PAGE_SIZE);

  let query = db
    .from("articles")
    .select(
      "id, title, slug, status, submitted_at, published_at, updated_at, category:article_categories(id, name), author:profiles!articles_author_id_fkey(id, full_name)",
      { count: "exact" },
    );
  if (f.status) query = query.eq("status", f.status);
  if (f.categoryId) query = query.eq("category_id", f.categoryId);
  if (f.mine) query = query.eq("author_id", session.userId);
  const q = sanitizeSearch(f.q);
  if (q) query = query.ilike("title", `%${q}%`);

  const result = await query.order("updated_at", { ascending: false }).range(range.from, range.to);
  const rows = (check(result) ?? []) as unknown as ListRow[];
  const items = rows.map((row) => {
    const author = first(row.author);
    return {
      id: row.id,
      title: row.title,
      slug: row.slug,
      status: row.status,
      category: first(row.category),
      author: author ? { id: author.id, fullName: author.full_name } : null,
      submittedAt: row.submitted_at,
      publishedAt: row.published_at,
      updatedAt: row.updated_at,
    };
  });
  return paginated(items, result.count ?? items.length, range.page, ADMIN_PAGE_SIZE);
}

type ArticleRow = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: unknown;
  cover_image_path: string | null;
  cover_image_alt: string | null;
  category_id: string | null;
  seo_title: string | null;
  seo_description: string | null;
  status: ArticleStatus;
  author_id: string | null;
  review_note: string | null;
  submitted_at: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  author: { full_name: string } | { full_name: string }[] | null;
};

const ARTICLE_COLUMNS =
  "id, title, slug, excerpt, content, cover_image_path, cover_image_alt, category_id, seo_title, seo_description, status, author_id, review_note, submitted_at, published_at, created_at, updated_at, author:profiles!articles_author_id_fkey(full_name)";

/** Un article à modifier (null s'il n'existe pas). */
export async function getAdminArticle(id: string): Promise<AdminArticle | null> {
  const { db } = await adminReader("editor");
  if (!isUuid(id)) return null;
  const row = check(await db.from("articles").select(ARTICLE_COLUMNS).eq("id", id).maybeSingle()) as unknown as ArticleRow | null;
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    content: toDoc(row.content),
    coverImagePath: row.cover_image_path,
    coverImageAlt: row.cover_image_alt,
    categoryId: row.category_id,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    status: row.status,
    authorId: row.author_id,
    authorName: first(row.author)?.full_name ?? null,
    reviewNote: row.review_note,
    submittedAt: row.submitted_at,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listAdminCategories(): Promise<AdminCategory[]> {
  const { db } = await adminReader("editor");
  const rows = check(
    await db.from("article_categories").select("id, name, slug, description, display_order").order("display_order").order("name"),
  ) as { id: string; name: string; slug: string; description: string | null; display_order: number }[] | null;
  return (rows ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    displayOrder: row.display_order,
  }));
}
