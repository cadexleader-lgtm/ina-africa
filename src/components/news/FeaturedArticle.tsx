import Link from "next/link";
import { ArrowRight, Newspaper } from "lucide-react";

import { ResponsiveImage } from "@/components/ui/ResponsiveImage";
import { Eyebrow } from "@/components/ui/SectionHeading";
import { CARD, CARD_IMAGE, CARD_LINK, CARD_MORE } from "@/components/site/card-styles";
import { MediaTile } from "@/components/site/MediaTile";
import { NEWS_T } from "@/content/fr/news";
import { cn } from "@/lib/cn";
import { formatDate, isoDate } from "@/lib/format";
import type { ArticleSummary } from "@/lib/types/content";

/**
 * L'article le plus récent, mis en avant en tête de la liste : grande photo
 * à gauche (au-dessus sur téléphone), texte à droite. Toute la carte est
 * cliquable (lien du titre étendu). Sans photo : tuile sobre.
 */
export function FeaturedArticle({ article, className }: { article: ArticleSummary; className?: string }) {
  const date = formatDate(article.publishedAt);

  return (
    <article className={cn(CARD, "flex-col lg:flex-row", className)}>
      <div className="relative aspect-[16/10] shrink-0 overflow-hidden lg:aspect-auto lg:min-h-[26rem] lg:w-1/2">
        {article.cover ? (
          <ResponsiveImage
            image={article.cover}
            fill
            priority
            sizes="(min-width: 1280px) 600px, (min-width: 1024px) 50vw, 100vw"
            imgClassName={CARD_IMAGE}
          />
        ) : (
          <MediaTile icon={Newspaper} className="absolute inset-0" />
        )}
      </div>

      <div className="flex flex-1 flex-col justify-center p-6 sm:p-8 lg:p-10 xl:p-12">
        <Eyebrow className="mb-5">{NEWS_T.list.featured}</Eyebrow>
        <p className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-small">
          {article.category && <span className="font-semibold text-brand">{article.category.name}</span>}
          {article.category && date && <span aria-hidden="true" className="size-1 rounded-full bg-line-strong" />}
          {date && (
            <time dateTime={isoDate(article.publishedAt)} className="text-muted">
              {date}
            </time>
          )}
        </p>
        <h2 className="text-h2">
          <Link href={`/actualites/${article.slug}`} className={CARD_LINK}>
            {article.title}
          </Link>
        </h2>
        {article.excerpt && <p className="mt-5 line-clamp-4 text-muted">{article.excerpt}</p>}
        <span aria-hidden="true" className={CARD_MORE}>
          {NEWS_T.list.readArticle}
          <ArrowRight className="size-4 transition-transform duration-(--duration-fast) group-hover:translate-x-0.5" />
        </span>
      </div>
    </article>
  );
}
