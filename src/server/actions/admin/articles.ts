"use server";

import { idInputSchema } from "@/lib/validation/admin/common";
import {
  articleInputSchema,
  articleUpdateSchema,
  categoryInputSchema,
  categoryUpdateSchema,
  rejectArticleSchema,
  reorderSchema,
  reviewNoteSchema,
  type ArticleInput,
} from "@/lib/validation/admin/content";
import { isEmptyDoc, type RichTextDoc } from "@/lib/validation/rich-text";
import {
  adminAction,
  check,
  deleteRow,
  found,
  insertRow,
  invalidate,
  loadRow,
  reorderRows,
  updateRow,
  type SessionDb,
} from "@/server/admin/action";
import { resolveSlug } from "@/server/admin/slug";
import { roleAtLeast } from "@/server/auth/guard";
import { TAGS } from "@/server/data/tags";
import { AppError, type ActionResult } from "@/server/errors";

/*
 * Articles du blog. Droits (supabase/migrations/…100400_site_content.sql) :
 *  - éditeur : crée, modifie les articles NON publiés, soumet à relecture,
 *    supprime SES brouillons ; ne publie ni n'archive (le trigger
 *    private.articles_workflow le refuse aussi) ;
 *  - admin : publie, dépublie, archive, renvoie en brouillon avec une
 *    remarque de relecture, modifie et supprime tout.
 * Le cache public n'est invalidé que si l'article est (ou était) publié.
 */

type ArticleStatus = "draft" | "in_review" | "published" | "archived";

type ArticleRef = { id: string; slug: string; status: ArticleStatus };

const REF_COLUMNS = "id, slug, status";

function articleTags(...slugs: (string | undefined)[]) {
  return [TAGS.articles, ...slugs.map((slug) => (slug ? TAGS.article(slug) : undefined))];
}

function toArticleRow(data: ArticleInput) {
  return {
    title: data.title,
    slug: resolveSlug(data.slug, data.title),
    excerpt: data.excerpt,
    // Sortie de richTextDocSchema (éléments inconnus retirés), jamais l'entrée brute.
    content: data.content,
    cover_image_path: data.coverImagePath,
    cover_image_alt: data.coverImageAlt,
    category_id: data.categoryId,
    seo_title: data.seoTitle,
    seo_description: data.seoDescription,
  };
}

export async function createArticle(input: unknown): Promise<ActionResult<ArticleRef>> {
  return adminAction("editor", articleInputSchema, input, async (data, { db }) => {
    // Toujours créé en brouillon ; l'auteur est posé par la base.
    return insertRow<ArticleRef>(db, "articles", { ...toArticleRow(data), status: "draft" }, REF_COLUMNS);
  });
}

export async function updateArticle(input: unknown): Promise<ActionResult<ArticleRef>> {
  return adminAction("editor", articleUpdateSchema, input, async (data, { db, session }) => {
    const current = await loadRow<ArticleRef>(db, "articles", data.id, REF_COLUMNS);
    if ((current.status === "published" || current.status === "archived") && !roleAtLeast(session.role, "admin")) {
      throw new AppError("FORBIDDEN", "Seul un administrateur peut modifier un article publié ou archivé.");
    }
    const updated = await updateRow<ArticleRef>(db, "articles", data.id, toArticleRow(data), REF_COLUMNS);
    if (current.status === "published") invalidate(...articleTags(current.slug, updated.slug));
    return updated;
  });
}

/**
 * Change le statut d'un article si son statut actuel le permet. La mise à
 * jour vérifie que le statut n'a pas changé entre-temps (deux personnes sur
 * le même article).
 */
async function transition(
  db: SessionDb,
  id: string,
  from: ArticleStatus[],
  values: { status: ArticleStatus; review_note?: string | null },
  wrongStatus: string,
): Promise<ArticleRef> {
  const current = await loadRow<ArticleRef>(db, "articles", id, REF_COLUMNS);
  if (!from.includes(current.status)) throw new AppError("CONFLICT", wrongStatus);

  const updated = check(
    await db.from("articles").update(values).eq("id", id).eq("status", current.status).select(REF_COLUMNS).maybeSingle(),
  ) as ArticleRef | null;
  const row = found(updated, "L'article a été modifié entre-temps : rechargez la page.");

  if (current.status === "published" || row.status === "published") invalidate(...articleTags(current.slug, row.slug));
  return row;
}

/** Brouillon → en relecture (éditeur ou admin). */
export async function submitArticleForReview(input: unknown): Promise<ActionResult<ArticleRef>> {
  return adminAction("editor", idInputSchema, input, async ({ id }, { db }) =>
    transition(db, id, ["draft"], { status: "in_review" }, "Seul un brouillon peut être soumis à relecture."),
  );
}

/** Publication (admin) : depuis un brouillon, une relecture ou un article archivé. */
export async function publishArticle(input: unknown): Promise<ActionResult<ArticleRef>> {
  return adminAction("admin", idInputSchema, input, async ({ id }, { db }) => {
    const article = await loadRow<{ content: RichTextDoc }>(db, "articles", id, "content");
    if (isEmptyDoc(article.content)) {
      throw new AppError("VALIDATION", "Ajoutez le texte de l'article avant de le publier.");
    }
    return transition(
      db,
      id,
      ["draft", "in_review", "archived"],
      { status: "published" },
      "Cet article est déjà publié.",
    );
  });
}

/** Dépublication (admin) : l'article publié ou archivé redevient un brouillon, avec une remarque facultative. */
export async function unpublishArticle(input: unknown): Promise<ActionResult<ArticleRef>> {
  return adminAction("admin", reviewNoteSchema, input, async ({ id, reviewNote }, { db }) =>
    transition(
      db,
      id,
      ["published", "archived"],
      { status: "draft", review_note: reviewNote },
      "Cet article n'est pas publié.",
    ),
  );
}

/** Archivage (admin) : l'article n'est plus visible sur le site, mais il est conservé. */
export async function archiveArticle(input: unknown): Promise<ActionResult<ArticleRef>> {
  return adminAction("admin", idInputSchema, input, async ({ id }, { db }) =>
    transition(db, id, ["draft", "in_review", "published"], { status: "archived" }, "Cet article est déjà archivé."),
  );
}

/** Relecture refusée (admin) : retour en brouillon avec la remarque pour l'auteur. */
export async function rejectArticle(input: unknown): Promise<ActionResult<ArticleRef>> {
  return adminAction("admin", rejectArticleSchema, input, async ({ id, reviewNote }, { db }) =>
    transition(
      db,
      id,
      ["in_review"],
      { status: "draft", review_note: reviewNote },
      "Seul un article en relecture peut être renvoyé à son auteur.",
    ),
  );
}

/** Suppression : l'éditeur ne supprime que SES brouillons ; l'admin supprime tout. */
export async function deleteArticle(input: unknown): Promise<ActionResult<{ id: string }>> {
  return adminAction("editor", idInputSchema, input, async ({ id }, { db, session }) => {
    const current = await loadRow<ArticleRef & { author_id: string | null }>(
      db,
      "articles",
      id,
      `${REF_COLUMNS}, author_id`,
    );
    if (!roleAtLeast(session.role, "admin") && (current.status !== "draft" || current.author_id !== session.userId)) {
      throw new AppError("FORBIDDEN", "Vous ne pouvez supprimer que vos propres brouillons.");
    }
    await deleteRow(db, "articles", id);
    if (current.status === "published") invalidate(...articleTags(current.slug));
    return { id };
  });
}

// ---------------------------------------------------------------------------
// Catégories (admin). Le nom de la catégorie est affiché sur chaque article.
// ---------------------------------------------------------------------------

type CategoryRef = { id: string; slug: string };

const CATEGORY_TAGS = [TAGS.categories, TAGS.articles];

function toCategoryRow(data: { name: string; slug: string | null; description: string | null; displayOrder: number }) {
  return {
    name: data.name,
    slug: resolveSlug(data.slug, data.name),
    description: data.description,
    display_order: data.displayOrder,
  };
}

export async function createCategory(input: unknown): Promise<ActionResult<CategoryRef>> {
  return adminAction("admin", categoryInputSchema, input, async (data, { db }) => {
    const row = await insertRow<CategoryRef>(db, "article_categories", toCategoryRow(data), "id, slug");
    invalidate(...CATEGORY_TAGS);
    return row;
  });
}

export async function updateCategory(input: unknown): Promise<ActionResult<CategoryRef>> {
  return adminAction("admin", categoryUpdateSchema, input, async (data, { db }) => {
    const row = await updateRow<CategoryRef>(db, "article_categories", data.id, toCategoryRow(data), "id, slug");
    invalidate(...CATEGORY_TAGS);
    return row;
  });
}

export async function reorderCategories(input: unknown): Promise<ActionResult<null>> {
  return adminAction("admin", reorderSchema, input, async ({ ids }, { db }) => {
    await reorderRows(db, "article_categories", ids);
    invalidate(...CATEGORY_TAGS);
    return null;
  });
}

/** Les articles de la catégorie restent, sans catégorie. */
export async function deleteCategory(input: unknown): Promise<ActionResult<{ id: string }>> {
  return adminAction("admin", idInputSchema, input, async ({ id }, { db }) => {
    await deleteRow(db, "article_categories", id);
    invalidate(...CATEGORY_TAGS);
    return { id };
  });
}
