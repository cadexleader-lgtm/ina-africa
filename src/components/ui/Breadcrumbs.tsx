import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/cn";
import { T } from "@/content/fr/site";

export type BreadcrumbItem = { label: string; href?: string };

type BreadcrumbsProps = {
  /** Du plus général au plus précis ; le dernier élément est la page courante (sans lien). */
  items: BreadcrumbItem[];
  inverse?: boolean;
  className?: string;
};

/** Fil d'Ariane. Pour les données structurées (BreadcrumbList), voir les métadonnées de la page. */
export function Breadcrumbs({ items, inverse = false, className }: BreadcrumbsProps) {
  if (items.length === 0) return null;
  return (
    <nav aria-label={T.a11y.breadcrumbs} className={className}>
      <ol className={cn("flex flex-wrap items-center gap-x-2 gap-y-1 text-small", inverse ? "text-muted-inverse" : "text-muted")}>
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex min-w-0 items-center gap-2">
              {item.href && !last ? (
                <Link
                  href={item.href}
                  className={cn(
                    "underline-offset-4 hover:underline",
                    inverse ? "text-white" : "text-link hover:text-link-strong",
                  )}
                >
                  {item.label}
                </Link>
              ) : (
                <span aria-current={last ? "page" : undefined} className={cn("truncate", inverse ? "text-white" : "text-ink")}>
                  {item.label}
                </span>
              )}
              {!last && <ChevronRight aria-hidden="true" className="size-4 shrink-0" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
