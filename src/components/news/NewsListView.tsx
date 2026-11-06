import { ArrowLeft, ArrowRight, FolderSearch, Newspaper, SearchX, X } from "lucide-react";
import Link from "next/link";

import { Alert } from "@/components/ui/Alert";
import { LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { NEWS_T } from "@/content/fr/news";
import type { ArticleCategory, ArticleSummary, Paginated } from "@/lib/types/content";

import { ArticleGrid } from "./ArticleGrid";
import { FeaturedArticle } from "./FeaturedArticle";
import { newsHref, newsQuery, type NewsParams } from "./news-params";

export type NewsListState = {
  params: NewsParams;
  /** Catégorie demandée ET existante. */
  category: ArticleCategory | undefined;
  /** Catégorie demandée mais inconnue. */
  unknownCategory: boolean;
  /** Recherche réellement appliquée (null si absente ou trop courte). */
  search: string | null;
  result: Paginated<ArticleSummary>;
};

/** Ce que la liste doit afficher (logique partagée avec les métadonnées). */
export function describeNewsList(state: NewsListState) {
  const { params, category, unknownCategory, search, result } = state;
  const filtered = Boolean(category || search);
  const outOfRange = !unknownCategory && params.page > 1 && result.items.length === 0;
  const featured = !unknownCategory && !search && params.page === 1 ? (result.items[0] ?? null) : null;
  const rest = featured ? result.items.slice(1) : result.items;
  return {
    filtered,
    outOfRange,
    empty: unknownCategory || result.items.length === 0,
    tooShort: params.q !== "" && !search,
    featured,
    rest,
  };
}

const LINK = "font-semibold text-link underline-offset-4 hover:text-link-strong hover:underline";

/** Liste des actualités : résumé des filtres, article à la une, grille, pagination, états vides. */
export function NewsListView({ state }: { state: NewsListState }) {
  const { params, category, unknownCategory, search, result } = state;
  const view = describeNewsList(state);

  return (
    <div className="flex flex-col gap-10 md:gap-12">
      {view.tooShort && (
        <Alert tone="info" role="none">
          {NEWS_T.list.searchTooShort}
        </Alert>
      )}

      {(search || category) && !view.empty && (
        <div className="flex flex-col gap-3 border-b border-line pb-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-heading text-h4 text-brand">
            {search
              ? NEWS_T.list.results(result.total, search)
              : NEWS_T.list.categoryCount(result.total, category?.name ?? "")}
          </p>
          {search && (
            <Link href={newsHref({ category: category?.slug })} className={`inline-flex items-center gap-1.5 text-small ${LINK}`}>
              <X aria-hidden="true" className="size-4" />
              {NEWS_T.list.clearSearch}
            </Link>
          )}
        </div>
      )}

      {unknownCategory ? (
        <EmptyState
          icon={FolderSearch}
          headingLevel="h2"
          title={NEWS_T.list.unknownCategoryTitle}
          description={NEWS_T.list.unknownCategoryText}
          action={
            <LinkButton href="/actualites" variant="secondary" iconRight={<ArrowRight aria-hidden="true" />}>
              {NEWS_T.list.allNews}
            </LinkButton>
          }
        />
      ) : view.outOfRange ? (
        <EmptyState
          icon={Newspaper}
          headingLevel="h2"
          title={NEWS_T.list.pageOutOfRangeTitle}
          description={NEWS_T.list.pageOutOfRangeText}
          action={
            <LinkButton
              href={newsHref({ category: category?.slug, q: params.q })}
              variant="secondary"
              iconLeft={<ArrowLeft aria-hidden="true" />}
            >
              {NEWS_T.list.firstPage}
            </LinkButton>
          }
        />
      ) : view.empty && search ? (
        <EmptyState
          icon={SearchX}
          headingLevel="h2"
          title={NEWS_T.list.noResultsTitle(search)}
          description={NEWS_T.list.noResultsText}
          action={
            <LinkButton href={newsHref({ category: category?.slug })} variant="secondary" iconLeft={<X aria-hidden="true" />}>
              {NEWS_T.list.clearSearch}
            </LinkButton>
          }
        />
      ) : view.empty && category ? (
        <EmptyState
          icon={Newspaper}
          headingLevel="h2"
          title={NEWS_T.list.emptyCategoryTitle}
          description={NEWS_T.list.emptyCategoryText}
          action={
            <LinkButton href="/actualites" variant="secondary" iconRight={<ArrowRight aria-hidden="true" />}>
              {NEWS_T.list.allNews}
            </LinkButton>
          }
        />
      ) : view.empty ? (
        <div className="flex flex-col gap-5 rounded-card border border-line bg-white p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-4">
            <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-2">
              <Newspaper className="size-5" strokeWidth={1.75} />
            </span>
            <div>
              <h2 className="text-h4">Les premières actualités arrivent bientôt</h2>
              <p className="mt-1 max-w-measure text-small text-muted">
                Inscrivez-vous à la lettre d&apos;information pour recevoir les nouvelles d&apos;INA-AFRICA dès leur
                publication. En attendant, découvrez ci-dessous les actions déjà menées.
              </p>
            </div>
          </div>
          <LinkButton href="/newsletter" className="shrink-0" iconRight={<ArrowRight aria-hidden="true" />}>
            S&apos;inscrire à la lettre
          </LinkButton>
        </div>
      ) : (
        <>
          {view.featured && <FeaturedArticle article={view.featured} />}
          {view.rest.length > 0 && (
            <section aria-labelledby="actualites-liste" className="flex flex-col gap-8">
              <h2 id="actualites-liste" className={view.featured ? "text-h3" : "sr-only"}>
                {view.featured ? NEWS_T.list.moreTitle : NEWS_T.list.resultsTitle}
              </h2>
              <ArticleGrid articles={view.rest} />
            </section>
          )}
          <Pagination
            page={result.page}
            pageCount={result.pageCount}
            basePath="/actualites"
            searchParams={newsQuery({ category: category?.slug, q: search ?? undefined })}
            label={NEWS_T.list.paginationLabel}
            className="pt-2"
          />
        </>
      )}
    </div>
  );
}
