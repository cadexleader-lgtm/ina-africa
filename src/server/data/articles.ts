import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import type { Article, ArticleCategory, ArticleSummary, Paginated } from "@/lib/types/content";
import { EMPTY_DOC, richTextDocSchema, type RichTextDoc } from "@/lib/validation/rich-text";
import { emptyPage, getReader, logReadError, pageRange, paginated, toImage } from "@/server/data/reader";
import { TAGS } from "@/server/data/tags";

const SUMMARY_COLUMNS =
  "id, slug, title, excerpt, published_at, cover_image_path, cover_image_alt, category:article_categories(slug, name)";

type ArticleRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  published_at: string;
  cover_image_path: string | null;
  cover_image_alt: string | null;
  category: { slug: string; name: string } | { slug: string; name: string }[] | null;
};

function toSummary(row: ArticleRow): ArticleSummary {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    publishedAt: row.published_at,
    cover: toImage(row.cover_image_path, row.cover_image_alt, row.title),
    category: Array.isArray(row.category) ? (row.category[0] ?? null) : row.category,
  };
}

/**
 * Nettoie une recherche : longueur limitée, et suppression des caractères
 * qui ont un sens dans les filtres de l'API (virgule, parenthèses, %, *…).
 */
export function sanitizeSearch(query: string | undefined): string | null {
  const cleaned = (query ?? "")
    .replace(/[,()%*\\:"'.]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
  return cleaned.length >= 2 ? cleaned : null;
}

export const ARTICLES_PAGE_SIZE = 12;

export type ArticleFilters = { category?: string; q?: string; page?: number };

/** Articles publiés, du plus récent au plus ancien. */
export async function listArticles(filters: ArticleFilters = {}): Promise<Paginated<ArticleSummary>> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.articles, TAGS.categories);

  const db = getReader();
  if (!db) return emptyPage(ARTICLES_PAGE_SIZE);
  const range = pageRange(filters.page ?? 1, ARTICLES_PAGE_SIZE);

  const columns = filters.category
    ? SUMMARY_COLUMNS.replace("article_categories(", "article_categories!inner(")
    : SUMMARY_COLUMNS;
  let query = db
    .from("articles")
    .select(columns, { count: "exact" })
    .order("published_at", { ascending: false });
  if (filters.category) query = query.eq("category.slug", filters.category);
  const search = sanitizeSearch(filters.q);
  if (search) {
    query = query.or(`title.ilike.%${search}%,excerpt.ilike.%${search}%,content_text.ilike.%${search}%`);
  }

  const { data, error, count } = await query.range(range.from, range.to);
  if (error) {
    logReadError("articles", error);
    return emptyPage(ARTICLES_PAGE_SIZE);
  }
  const items = (data as unknown as ArticleRow[]).map(toSummary);
  return paginated(items, count ?? items.length, range.page, ARTICLES_PAGE_SIZE);
}

export async function listLatestArticles(limit = 3): Promise<ArticleSummary[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.articles);

  const db = getReader();
  if (!db) return [];
  const { data, error } = await db
    .from("articles")
    .select(SUMMARY_COLUMNS)
    .order("published_at", { ascending: false })
    .limit(limit);
  if (error) {
    logReadError("articles", error);
    return [];
  }
  return (data as unknown as ArticleRow[]).map(toSummary);
}

export async function getArticle(slug: string): Promise<Article | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.articles, TAGS.article(slug));

  const db = getReader();
  if (!db) return null;
  const { data, error } = await db
    .from("articles")
    .select(`${SUMMARY_COLUMNS}, content, content_text, seo_title, seo_description, updated_at`)
    .eq("slug", slug)
    .maybeSingle();
  if (error) logReadError("articles", error);
  if (!data) return null;

  const row = data as unknown as ArticleRow & {
    content: unknown;
    content_text: string;
    seo_title: string | null;
    seo_description: string | null;
    updated_at: string;
  };
  const parsed = richTextDocSchema.safeParse(row.content);
  return {
    ...toSummary(row),
    content: parsed.success ? (parsed.data as RichTextDoc) : EMPTY_DOC,
    contentText: row.content_text,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    updatedAt: row.updated_at,
  };
}

export async function listArticleCategories(): Promise<ArticleCategory[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.categories);

  const db = getReader();
  if (!db) return [];
  const { data, error } = await db
    .from("article_categories")
    .select("id, slug, name, description")
    .order("display_order")
    .order("name");
  if (error) {
    logReadError("article_categories", error);
    return [];
  }
  return data;
}

/** Pour le plan du site. */
export async function listArticleSlugs(): Promise<{ slug: string; updatedAt: string }[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.articles);

  const db = getReader();
  if (!db) return [];
  const { data, error } = await db.from("articles").select("slug, updated_at");
  if (error) {
    logReadError("articles (plan du site)", error);
    return [];
  }
  return data.map((row) => ({ slug: row.slug, updatedAt: row.updated_at }));
}
