import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/cn";
import { pageHref, pageWindow, type SearchParamsRecord } from "@/lib/pagination";
import { T } from "@/content/fr/site";

type PaginationProps = {
  page: number;
  pageCount: number;
  /** Adresse de la liste, ex. "/actualites". */
  basePath: string;
  /** Paramètres de recherche courants (déjà lus) : ils sont CONSERVÉS dans chaque lien. */
  searchParams?: SearchParamsRecord;
  /** Nom du paramètre de page (défaut "page"). */
  paramName?: string;
  label?: string;
  className?: string;
};

const ITEM =
  "inline-flex h-11 min-w-11 items-center justify-center rounded-full px-3 text-body font-semibold " +
  "transition-colors duration-(--duration-fast)";

/**
 * Pagination par liens (fonctionne sans JavaScript, chaque page a son adresse).
 * Rien n'est affiché s'il n'y a qu'une page.
 */
export function Pagination({
  page,
  pageCount,
  basePath,
  searchParams = {},
  paramName = "page",
  label = T.a11y.pagination,
  className,
}: PaginationProps) {
  if (pageCount <= 1) return null;
  const current = Math.min(Math.max(1, page), pageCount);
  const href = (target: number) => pageHref(basePath, target, searchParams, paramName);

  return (
    <nav aria-label={label} className={cn("flex justify-center", className)}>
      <ul className="flex flex-wrap items-center justify-center gap-1.5">
        <li>
          {current > 1 ? (
            <Link href={href(current - 1)} rel="prev" className={cn(ITEM, "gap-1 text-link hover:bg-brand-50")}>
              <ChevronLeft aria-hidden="true" className="size-5" />
              <span>{T.actions.previous}</span>
            </Link>
          ) : (
            <span aria-disabled="true" className={cn(ITEM, "gap-1 text-muted")}>
              <ChevronLeft aria-hidden="true" className="size-5" />
              <span>{T.actions.previous}</span>
            </span>
          )}
        </li>
        {pageWindow(current, pageCount).map((item, index) =>
          item === null ? (
            <li key={`gap-${index}`} aria-hidden="true" className="hidden px-1 text-muted sm:block">
              …
            </li>
          ) : (
            <li key={item} className="hidden sm:block">
              {item === current ? (
                <span aria-current="page" className={cn(ITEM, "bg-brand text-white")}>
                  <span className="sr-only">{T.actions.page} </span>
                  {item}
                </span>
              ) : (
                <Link href={href(item)} className={cn(ITEM, "text-brand hover:bg-brand-50")}>
                  <span className="sr-only">{T.actions.page} </span>
                  {item}
                </Link>
              )}
            </li>
          ),
        )}
        <li className="px-2 text-small text-muted sm:hidden">
          {T.actions.page} {current} sur {pageCount}
        </li>
        <li>
          {current < pageCount ? (
            <Link href={href(current + 1)} rel="next" className={cn(ITEM, "gap-1 text-link hover:bg-brand-50")}>
              <span>{T.actions.next}</span>
              <ChevronRight aria-hidden="true" className="size-5" />
            </Link>
          ) : (
            <span aria-disabled="true" className={cn(ITEM, "gap-1 text-muted")}>
              <span>{T.actions.next}</span>
              <ChevronRight aria-hidden="true" className="size-5" />
            </span>
          )}
        </li>
      </ul>
    </nav>
  );
}
