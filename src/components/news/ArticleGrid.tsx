import { ArticleCard } from "@/components/site/ArticleCard";
import { cn } from "@/lib/cn";
import type { ArticleSummary } from "@/lib/types/content";

/** Grille d'actualités : 1 colonne sur téléphone, 2 dès 640 px, 3 dès 1024 px. */
export function ArticleGrid({
  articles,
  headingLevel = "h3",
  className,
}: {
  articles: ArticleSummary[];
  headingLevel?: "h2" | "h3";
  className?: string;
}) {
  if (articles.length === 0) return null;
  return (
    <ul className={cn("grid gap-6 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {articles.map((article) => (
        <li key={article.id} className="flex">
          <ArticleCard article={article} headingLevel={headingLevel} className="w-full" />
        </li>
      ))}
    </ul>
  );
}
