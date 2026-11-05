import Link from "next/link";
import { ArrowRight, Newspaper } from "lucide-react";

import { ResponsiveImage } from "@/components/ui/ResponsiveImage";
import { CARD, CARD_IMAGE, CARD_LINK, CARD_MORE } from "@/components/site/card-styles";
import { MediaTile } from "@/components/site/MediaTile";
import { T } from "@/content/fr/site";
import { cn } from "@/lib/cn";
import { formatDate, isoDate } from "@/lib/format";
import type { ArticleSummary } from "@/lib/types/content";

type ArticleCardProps = {
  article: ArticleSummary;
  /** `default` : photo au-dessus ; `horizontal` : photo à gauche dès 640 px (listes). */
  variant?: "default" | "horizontal";
  headingLevel?: "h2" | "h3";
  sizes?: string;
  className?: string;
};

/** Carte d'une actualité → /actualites/[slug] : photo, catégorie, date en français, titre, extrait court. */
export function ArticleCard({ article, variant = "default", headingLevel: Heading = "h3", sizes, className }: ArticleCardProps) {
  const horizontal = variant === "horizontal";
  const date = formatDate(article.publishedAt);

  return (
    <article className={cn(CARD, "flex-col", horizontal && "sm:flex-row", className)}>
      <div className={cn("relative shrink-0 overflow-hidden", horizontal ? "aspect-[16/10] sm:aspect-auto sm:min-h-44 sm:w-2/5" : "aspect-[16/10]")}>
        {article.cover ? (
          <ResponsiveImage
            image={article.cover}
            fill
            sizes={sizes ?? (horizontal ? "(min-width: 640px) 40vw, 100vw" : "(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw")}
            imgClassName={CARD_IMAGE}
          />
        ) : (
          <MediaTile icon={Newspaper} size={horizontal ? "sm" : "md"} className="absolute inset-0" />
        )}
      </div>

      <div className="flex flex-1 flex-col p-6">
        <p className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-small">
          {article.category && <span className="font-semibold text-brand">{article.category.name}</span>}
          {article.category && date && <span aria-hidden="true" className="size-1 rounded-full bg-line-strong" />}
          {date && (
            <time dateTime={isoDate(article.publishedAt)} className="text-muted">
              {date}
            </time>
          )}
        </p>
        <Heading className="text-h4">
          <Link href={`/actualites/${article.slug}`} className={CARD_LINK}>
            {article.title}
          </Link>
        </Heading>
        {article.excerpt && <p className="mt-3 line-clamp-3 text-small text-muted">{article.excerpt}</p>}
        <span aria-hidden="true" className={CARD_MORE}>
          {T.actions.readMore}
          <ArrowRight className="size-4 transition-transform duration-(--duration-fast) group-hover:translate-x-0.5" />
        </span>
      </div>
    </article>
  );
}
