import Link from "next/link";
import { ArrowLeft, ArrowRight, CalendarDays, Clock, RefreshCw } from "lucide-react";

import { LinkButton } from "@/components/ui/Button";
import { Breadcrumbs, type BreadcrumbItem } from "@/components/ui/Breadcrumbs";
import { Container } from "@/components/ui/Container";
import { ResponsiveImage } from "@/components/ui/ResponsiveImage";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { RichText } from "@/components/site/RichText";
import { ShareLinks } from "@/components/site/ShareLinks";
import { NEWS_T } from "@/content/fr/news";
import { cn } from "@/lib/cn";
import { formatDate, isoDate } from "@/lib/format";
import { readingTimeMinutes, truncateWords } from "@/lib/seo/text";
import type { Article, ArticleSummary } from "@/lib/types/content";
import { isEmptyDoc } from "@/lib/validation/rich-text";

import { ArticleGrid } from "./ArticleGrid";
import { newsHref } from "./news-params";

/** Étapes du fil d'Ariane d'un article (affiché ET données structurées). */
export function articleBreadcrumbs(article: Pick<Article, "slug" | "title" | "category">): (BreadcrumbItem & { href: string })[] {
  return [
    { label: NEWS_T.article.home, href: "/" },
    { label: NEWS_T.article.news, href: "/actualites" },
    ...(article.category ? [{ label: article.category.name, href: newsHref({ category: article.category.slug }) }] : []),
    { label: article.title, href: `/actualites/${article.slug}` },
  ];
}

/** Longueur du titre dans le fil d'Ariane affiché (une ligne sur ordinateur). */
const BREADCRUMB_TITLE_MAX = 42;

/** Date de mise à jour, seulement si elle tombe un AUTRE jour que la publication. */
export function updatedDate(article: Pick<Article, "publishedAt" | "updatedAt">): string | null {
  const published = isoDate(article.publishedAt);
  const updated = isoDate(article.updatedAt);
  if (!published || !updated || updated <= published) return null;
  return article.updatedAt;
}

type ArticleViewProps = {
  article: Article;
  /** Adresse ABSOLUE de l'article (partage). */
  url: string;
  /** Articles de la même catégorie (déjà sans l'article courant). */
  related: ArticleSummary[];
};

/** Page de lecture d'un article : en-tête, couverture, texte en largeur de lecture, partage, articles liés. */
export function ArticleView({ article, url, related }: ArticleViewProps) {
  const published = formatDate(article.publishedAt);
  const updatedAt = updatedDate(article);
  const minutes = readingTimeMinutes(article.contentText);
  const hasContent = !isEmptyDoc(article.content);
  const cover = article.cover;

  return (
    <>
      <article aria-labelledby="article-titre">
        <header className={cn("bg-ivory", cover ? "pb-28 sm:pb-36" : "border-b border-line pb-12 md:pb-16")}>
          <Container size="reading" className="pt-8 sm:pt-12">
            <Breadcrumbs
              items={articleBreadcrumbs(article).map((item, index, items) =>
                // Titre raccourci dans le fil d'Ariane (complet dans le h1 et les données structurées).
                index === items.length - 1 ? { label: truncateWords(item.label, BREADCRUMB_TITLE_MAX) } : item,
              )}
            />
            {article.category && (
              <Link
                href={newsHref({ category: article.category.slug })}
                className="mt-10 inline-flex min-h-9 items-center rounded-full bg-white px-4 text-small font-semibold text-brand shadow-card transition-colors duration-(--duration-fast) hover:bg-brand-50"
              >
                {article.category.name}
              </Link>
            )}
            <h1 id="article-titre" className={cn("text-h1", article.category ? "mt-5" : "mt-10")}>
              {article.title}
            </h1>
            <span aria-hidden="true" className="mt-6 block h-1 w-20 rounded-full bg-gold" />
            {article.excerpt && <p className="mt-6 text-lead text-ink">{article.excerpt}</p>}
            <ul className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-small text-muted">
              {published && (
                <li className="inline-flex items-center gap-2">
                  <CalendarDays aria-hidden="true" className="size-4 text-brand-2" />
                  <span>
                    {NEWS_T.article.publishedOn} <time dateTime={isoDate(article.publishedAt)}>{published}</time>
                  </span>
                </li>
              )}
              {updatedAt && (
                <li className="inline-flex items-center gap-2">
                  <RefreshCw aria-hidden="true" className="size-4 text-brand-2" />
                  <span>
                    {NEWS_T.article.updatedOn} <time dateTime={isoDate(updatedAt)}>{formatDate(updatedAt)}</time>
                  </span>
                </li>
              )}
              {minutes && (
                <li className="inline-flex items-center gap-2">
                  <Clock aria-hidden="true" className="size-4 text-brand-2" />
                  <span>{NEWS_T.article.readingTime(minutes)}</span>
                </li>
              )}
            </ul>
          </Container>
        </header>

        {cover && (
          <Container className="-mt-20 sm:-mt-28">
            <div className="mx-auto max-w-4xl">
              <ResponsiveImage
                image={cover}
                aspect="16/9"
                priority
                sizes="(min-width: 960px) 896px, 100vw"
                className="rounded-card shadow-card"
              />
            </div>
          </Container>
        )}

        <Container size="reading" className="py-12 md:py-16">
          {hasContent ? (
            <RichText doc={article.content} />
          ) : (
            <p className="text-muted">{NEWS_T.article.noContent}</p>
          )}

          <footer className="mt-14 flex flex-col gap-8 border-t border-line pt-8">
            <ShareLinks url={url} message={article.title} label={NEWS_T.article.share} />
            <LinkButton href="/actualites" variant="link" iconLeft={<ArrowLeft aria-hidden="true" />} className="self-start">
              {NEWS_T.article.back}
            </LinkButton>
          </footer>
        </Container>
      </article>

      {related.length > 0 && article.category && (
        <Section tone="ivory" labelledBy="articles-lies">
          <Container>
            <SectionHeading
              id="articles-lies"
              label={NEWS_T.article.relatedLabel}
              title={NEWS_T.article.relatedTitle(article.category.name)}
              action={
                <LinkButton
                  href={newsHref({ category: article.category.slug })}
                  variant="link"
                  iconRight={<ArrowRight aria-hidden="true" />}
                >
                  {NEWS_T.article.seeCategory}
                </LinkButton>
              }
            />
            <ArticleGrid articles={related} />
          </Container>
        </Section>
      )}
    </>
  );
}
