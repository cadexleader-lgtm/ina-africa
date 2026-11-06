import { describe, expect, it } from "vitest";

import { articleBreadcrumbs, updatedDate } from "@/components/news/ArticleView";
import { describeNewsList, type NewsListState } from "@/components/news/NewsListView";
import type { ArticleSummary } from "@/lib/types/content";

function summary(id: string): ArticleSummary {
  return { id, slug: `exemple-${id}`, title: `Exemple ${id}`, excerpt: null, publishedAt: "2026-11-01T10:00:00Z", cover: null, category: null };
}

function state(overrides: Partial<NewsListState> & { items?: ArticleSummary[]; total?: number }): NewsListState {
  const items = overrides.items ?? [];
  return {
    params: { category: undefined, q: "", page: 1 },
    category: undefined,
    unknownCategory: false,
    search: null,
    result: { items, total: overrides.total ?? items.length, page: 1, pageCount: 1, pageSize: 12 },
    ...overrides,
  };
}

describe("describeNewsList", () => {
  it("met en avant le plus récent en page 1, sans recherche", () => {
    const view = describeNewsList(state({ items: [summary("a"), summary("b"), summary("c")] }));
    expect(view.featured?.id).toBe("a");
    expect(view.rest.map((item) => item.id)).toEqual(["b", "c"]);
    expect(view.empty).toBe(false);
  });

  it("pas d'article à la une pour une recherche ou une page suivante", () => {
    const items = [summary("a"), summary("b")];
    expect(describeNewsList(state({ items, search: "école", params: { category: undefined, q: "école", page: 1 } })).featured).toBeNull();
    expect(describeNewsList(state({ items, params: { category: undefined, q: "", page: 2 } })).featured).toBeNull();
  });

  it("repère une page hors liste et une recherche trop courte", () => {
    expect(describeNewsList(state({ params: { category: undefined, q: "", page: 4 } })).outOfRange).toBe(true);
    expect(describeNewsList(state({ params: { category: undefined, q: "a", page: 1 } })).tooShort).toBe(true);
  });

  it("une catégorie inconnue est vide", () => {
    expect(describeNewsList(state({ unknownCategory: true, items: [summary("a")] })).empty).toBe(true);
  });
});

describe("updatedDate", () => {
  it("n'affiche la mise à jour que si elle tombe un autre jour", () => {
    expect(updatedDate({ publishedAt: "2026-11-01T08:00:00Z", updatedAt: "2026-11-01T18:00:00Z" })).toBeNull();
    expect(updatedDate({ publishedAt: "2026-11-01T08:00:00Z", updatedAt: "2026-11-04T09:00:00Z" })).toBe("2026-11-04T09:00:00Z");
    expect(updatedDate({ publishedAt: "2026-11-05T08:00:00Z", updatedAt: "2026-11-01T09:00:00Z" })).toBeNull();
  });
});

describe("articleBreadcrumbs", () => {
  it("Accueil › Actualités › catégorie › article", () => {
    expect(
      articleBreadcrumbs({ slug: "exemple", title: "Exemple", category: { slug: "sante", name: "Santé" } }).map((item) => item.href),
    ).toEqual(["/", "/actualites", "/actualites?categorie=sante", "/actualites/exemple"]);
    expect(articleBreadcrumbs({ slug: "exemple", title: "Exemple", category: null })).toHaveLength(3);
  });
});
