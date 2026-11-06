import type { Metadata } from "next";
import { Suspense } from "react";

import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { JsonLd } from "@/components/seo/JsonLd";
import { NewsCategoryNav } from "@/components/news/NewsCategoryNav";
import { NewsListView, describeNewsList, type NewsListState } from "@/components/news/NewsListView";
import { NewsSearchForm } from "@/components/news/NewsSearchForm";
import { PageIntro } from "@/components/news/PageIntro";
import { NewsListSkeleton } from "@/components/news/Skeletons";
import { newsHref, parseNewsParams } from "@/components/news/news-params";
import { NEWS_T } from "@/content/fr/news";
import type { SearchParamsRecord } from "@/lib/pagination";
import { pageMetadata } from "@/lib/seo/metadata";
import { breadcrumbJsonLd } from "@/lib/seo/structured-data";
import { listArticleCategories, listArticles, sanitizeSearch } from "@/server/data/articles";

/**
 * /actualites : article le plus récent mis en avant, puis grille ; filtres par
 * catégorie (?categorie=), recherche (?q=) et pagination (?page=).
 *
 * Cache Components : le titre et l'introduction sont prérendus ; tout ce qui
 * dépend de l'adresse (?…) est lu SOUS <Suspense>. Les lectures sont en cache.
 */

/** Lit l'adresse et charge la liste (mêmes appels pour la page et ses métadonnées : cache partagé). */
async function loadNewsList(searchParams: Promise<SearchParamsRecord>): Promise<NewsListState> {
  const params = parseNewsParams(await searchParams);
  const categories = await listArticleCategories();
  const category = params.category ? categories.find((item) => item.slug === params.category) : undefined;
  const unknownCategory = Boolean(params.category && !category);
  const search = sanitizeSearch(params.q);
  const result = unknownCategory
    ? { items: [], total: 0, page: 1, pageCount: 1, pageSize: 0 }
    : await listArticles({ category: category?.slug, q: search ?? undefined, page: params.page });
  return { params, category, unknownCategory, search, result };
}

export async function generateMetadata({ searchParams }: PageProps<"/actualites">): Promise<Metadata> {
  const state = await loadNewsList(searchParams);
  const { params, category, search } = state;
  const view = describeNewsList(state);
  const pageSuffix = params.page > 1 ? NEWS_T.list.pageSuffix(params.page) : "";

  if (search || view.tooShort) {
    // Résultats de recherche : jamais indexés (contenu en double, pages infinies).
    return pageMetadata({
      title: NEWS_T.list.searchMetaTitle(search ?? params.q),
      description: NEWS_T.list.metaDescription,
      path: "/actualites",
      noindex: true,
    });
  }

  return pageMetadata({
    title: (category ? NEWS_T.list.categoryMetaTitle(category.name) : NEWS_T.list.metaTitle) + pageSuffix,
    description: category
      ? (category.description ?? NEWS_T.list.categoryMetaDescription(category.name))
      : NEWS_T.list.metaDescription,
    path: newsHref({ category: category?.slug, page: params.page }),
    // Catégorie inconnue, page hors liste ou catégorie vide : rien à indexer.
    noindex: view.empty && (Boolean(params.category) || params.page > 1),
  });
}

async function NewsSearch({ searchParams }: { searchParams: Promise<SearchParamsRecord> }) {
  const params = parseNewsParams(await searchParams);
  const categories = await listArticleCategories();
  const active = categories.some((item) => item.slug === params.category) ? params.category : undefined;
  return <NewsSearchForm q={params.q} category={active} />;
}

async function NewsCategories({ searchParams }: { searchParams: Promise<SearchParamsRecord> }) {
  const params = parseNewsParams(await searchParams);
  const categories = await listArticleCategories();
  const active = categories.some((item) => item.slug === params.category) ? params.category : undefined;
  return <NewsCategoryNav categories={categories} active={active} q={params.q || undefined} />;
}

/** Filtres sans catégorie active, affichés dans la page prérendue le temps de lire l'adresse. */
async function NewsCategoriesFallback() {
  const categories = await listArticleCategories();
  return <NewsCategoryNav categories={categories} />;
}

async function NewsResults({ searchParams }: { searchParams: Promise<SearchParamsRecord> }) {
  const state = await loadNewsList(searchParams);
  return <NewsListView state={state} />;
}

export default function NewsPage({ searchParams }: PageProps<"/actualites">) {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: NEWS_T.article.home, path: "/" },
          { name: NEWS_T.article.news, path: "/actualites" },
        ])}
      />
      <PageIntro
        breadcrumbs={[{ label: NEWS_T.article.home, href: "/" }, { label: NEWS_T.article.news }]}
        label={NEWS_T.list.label}
        title={NEWS_T.list.title}
        intro={NEWS_T.list.intro}
        aside={
          <Suspense fallback={<NewsSearchForm />}>
            <NewsSearch searchParams={searchParams} />
          </Suspense>
        }
      >
        <Suspense fallback={<NewsCategoriesFallback />}>
          <NewsCategories searchParams={searchParams} />
        </Suspense>
      </PageIntro>

      <Section spacing="compact">
        <Container>
          <Suspense fallback={<NewsListSkeleton />}>
            <NewsResults searchParams={searchParams} />
          </Suspense>
        </Container>
      </Section>
    </>
  );
}
