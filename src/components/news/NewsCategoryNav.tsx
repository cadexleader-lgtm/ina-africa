import Link from "next/link";

import { NEWS_T } from "@/content/fr/news";
import { cn } from "@/lib/cn";
import type { ArticleCategory } from "@/lib/types/content";

import { newsHref } from "./news-params";

const CHIP =
  "inline-flex min-h-11 items-center rounded-full border px-4 text-small font-semibold " +
  "transition-colors duration-(--duration-fast) ease-out";

type NewsCategoryNavProps = {
  categories: ArticleCategory[];
  /** Catégorie active (aucune = « Toutes »). */
  active?: string;
  /** Recherche en cours : conservée quand on change de catégorie. */
  q?: string;
};

/**
 * Filtres par catégorie : de simples liens (?categorie=slug), la page reste
 * utilisable sans JavaScript et chaque catégorie a son adresse. Masqués tant
 * qu'aucune catégorie n'existe.
 */
export function NewsCategoryNav({ categories, active, q }: NewsCategoryNavProps) {
  if (categories.length === 0) return null;
  const items = [
    { key: "toutes", label: NEWS_T.list.allCategories, href: newsHref({ q }), current: !active },
    ...categories.map((category) => ({
      key: category.id,
      label: category.name,
      href: newsHref({ category: category.slug, q }),
      current: category.slug === active,
    })),
  ];

  return (
    <nav aria-label={NEWS_T.list.categoriesLabel}>
      <ul className="flex flex-wrap gap-2">
        {items.map((item) => (
          <li key={item.key}>
            <Link
              href={item.href}
              aria-current={item.current ? "page" : undefined}
              className={cn(
                CHIP,
                item.current
                  ? "border-brand bg-brand text-white"
                  : "border-line-strong bg-white text-brand hover:border-brand hover:bg-brand-50",
              )}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
