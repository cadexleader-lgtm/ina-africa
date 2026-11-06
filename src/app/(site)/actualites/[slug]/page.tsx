import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { JsonLd } from "@/components/seo/JsonLd";
import { ArticleView, articleBreadcrumbs } from "@/components/news/ArticleView";
import { ArticleSkeleton } from "@/components/news/Skeletons";
import { isValidSlug } from "@/components/news/news-params";
import { NEWS_T } from "@/content/fr/news";
import { pageMetadata, shareImage } from "@/lib/seo/metadata";
import { articleJsonLd, breadcrumbJsonLd } from "@/lib/seo/structured-data";
import { absoluteUrl } from "@/lib/site-url";
import { getArticle, listArticles } from "@/server/data/articles";

/**
 * /actualites/[slug] : lecture d'un article publié.
 *
 * Cache Components + Partial Prefetching : l'adresse (params) est lue SOUS
 * <Suspense>. Au premier passage, la page est rendue puis gardée en cache
 * (lectures `use cache`, invalidées à chaque publication).
 */

async function findArticle(slug: string) {
  return isValidSlug(slug) ? getArticle(slug) : null;
}

export async function generateMetadata({ params }: PageProps<"/actualites/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const article = await findArticle(slug);
  if (!article) return { title: NEWS_T.article.notFoundTitle, robots: { index: false, follow: false } };

  return pageMetadata({
    title: article.seoTitle ?? article.title,
    description: article.seoDescription ?? article.excerpt ?? article.contentText,
    path: `/actualites/${article.slug}`,
    type: "article",
    image: shareImage(article.cover),
    publishedTime: article.publishedAt,
    modifiedTime: article.updatedAt,
    section: article.category?.name,
  });
}

async function ArticleContent({ params }: { params: PageProps<"/actualites/[slug]">["params"] }) {
  const { slug } = await params;
  const article = await findArticle(slug);
  if (!article) notFound();

  const related = article.category
    ? (await listArticles({ category: article.category.slug })).items.filter((item) => item.id !== article.id).slice(0, 3)
    : [];
  const breadcrumbs = articleBreadcrumbs(article);

  return (
    <>
      <JsonLd data={articleJsonLd(article)} />
      <JsonLd data={breadcrumbJsonLd(breadcrumbs.map((item) => ({ name: item.label, path: item.href })))} />
      <ArticleView article={article} url={absoluteUrl(`/actualites/${article.slug}`)} related={related} />
    </>
  );
}

export default function ArticlePage({ params }: PageProps<"/actualites/[slug]">) {
  return (
    <Suspense fallback={<ArticleSkeleton />}>
      <ArticleContent params={params} />
    </Suspense>
  );
}
