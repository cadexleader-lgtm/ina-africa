import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/seo/JsonLd";
import { ArticleView, articleBreadcrumbs } from "@/components/news/ArticleView";
import { isValidSlug } from "@/components/news/news-params";
import { NEWS_T } from "@/content/fr/news";
import { pageMetadata, shareImage } from "@/lib/seo/metadata";
import { articleJsonLd, breadcrumbJsonLd } from "@/lib/seo/structured-data";
import { absoluteUrl } from "@/lib/site-url";
import { getArticle, listArticleSlugs, listArticles } from "@/server/data/articles";

/**
 * /actualites/[slug] : lecture d'un article publié.
 *
 * Cache Components : la page est rendue EN ENTIER côté serveur
 * (`instant = false`, adresse lue sans <Suspense>) : texte lisible sans
 * JavaScript et vrai code 404 pour un article inexistant. Les lectures
 * restent en cache (`use cache`, invalidées à chaque publication).
 */

export const ensureStatic = "navigation";
export const instant = false;

/**
 * Articles prérendus au build. Cache Components exige au moins une valeur :
 * sans article publié, une adresse volontairement INVALIDE (« _ » est interdit
 * dans les adresses d'articles) qui donne une page 404, jamais un vrai contenu.
 * Les articles publiés ensuite sont rendus à leur première visite.
 */
export async function generateStaticParams() {
  const slugs = (await listArticleSlugs()).map(({ slug }) => ({ slug }));
  return slugs.length > 0 ? slugs : [{ slug: "_aucun-article" }];
}

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

export default async function ArticlePage({ params }: PageProps<"/actualites/[slug]">) {
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
