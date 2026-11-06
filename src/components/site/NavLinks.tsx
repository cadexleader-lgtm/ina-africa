import Link from "next/link";

import type { NavItem } from "@/content/fr/site";
import { cn } from "@/lib/cn";
import { isActivePath } from "@/lib/nav";

type NavLinksProps = {
  items: NavItem[];
  /** Adresse courante ; null = inconnue (rendu statique de secours), aucun lien actif. */
  pathname: string | null;
  /** `bar` = en-tête ordinateur (trait doré sous le lien actif) ; `panel` = menu mobile. */
  layout: "bar" | "panel";
  onNavigate?: () => void;
};

/** Liste des liens de navigation (présentation seule, partagée en-tête / menu mobile). */
export function NavLinks({ items, pathname, layout, onNavigate }: NavLinksProps) {
  return (
    <ul className={layout === "bar" ? "flex items-center gap-0.5 xl:gap-1" : "flex flex-col"}>
      {items.map((item) => {
        const active = isActivePath(pathname, item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              onClick={onNavigate}
              className={cn(
                layout === "bar"
                  ? "relative inline-flex h-11 items-center rounded-full px-3 text-nav font-medium transition-colors duration-(--duration-fast) after:absolute after:inset-x-3 after:bottom-1 after:h-0.5 after:rounded-full after:bg-gold after:transition-opacity after:duration-(--duration-fast) hover:text-brand"
                  : "flex items-center justify-between border-b border-line py-3 font-heading text-h4",
                layout === "bar" && (active ? "text-brand after:opacity-100" : "text-ink after:opacity-0"),
                layout === "panel" && (active ? "text-brand" : "text-ink"),
              )}
            >
              <span className={cn(layout === "panel" && active && "border-b-2 border-gold pb-0.5")}>{item.label}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
