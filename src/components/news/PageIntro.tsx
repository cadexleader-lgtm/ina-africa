import type { ReactNode } from "react";

import { Breadcrumbs, type BreadcrumbItem } from "@/components/ui/Breadcrumbs";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/SectionHeading";
import { cn } from "@/lib/cn";

type PageIntroProps = {
  /** Fil d'Ariane affiché au-dessus du titre (le dernier élément = la page). */
  breadcrumbs?: BreadcrumbItem[];
  /** Petit libellé au-dessus du titre (trait doré). */
  label?: string;
  title: ReactNode;
  intro?: ReactNode;
  /** Bloc à droite du titre dès 1024 px (ex. formulaire de recherche). */
  aside?: ReactNode;
  /** Bloc sous le titre (ex. filtres par catégorie). */
  children?: ReactNode;
  titleId?: string;
  /** Largeur : site (1200 px, défaut) ou lecture (680 px, centrée, pour un texte long en dessous). */
  size?: "site" | "reading";
  className?: string;
};

/**
 * En-tête d'une page intérieure : bandeau ivoire, fil d'Ariane, libellé,
 * titre (h1) et introduction. Un arc discret rappelle la courbe du hero
 * de l'accueil (décoratif).
 */
export function PageIntro({ breadcrumbs, label, title, intro, aside, children, titleId, size = "site", className }: PageIntroProps) {
  const hasAside = Boolean(aside);
  return (
    <header className={cn("relative isolate overflow-hidden border-b border-line bg-ivory", className)}>
      <span
        aria-hidden="true"
        className="absolute -top-40 -right-40 -z-10 hidden size-[30rem] rounded-full border-[3px] border-brand-2/25 md:block"
      />
      <span
        aria-hidden="true"
        className="absolute -top-24 -right-24 -z-10 hidden size-[30rem] rounded-full bg-brand-50/70 md:block"
      />
      <Container size={size} className="py-section-sm">
        {breadcrumbs && breadcrumbs.length > 0 && <Breadcrumbs items={breadcrumbs} className="mb-8 sm:mb-10" />}
        <div className={cn(hasAside && "grid gap-10 lg:grid-cols-12 lg:items-end lg:gap-12")}>
          <div className={cn("max-w-reading", hasAside && "lg:col-span-7")}>
            {label && <Eyebrow className="mb-5">{label}</Eyebrow>}
            <h1 id={titleId} className="text-h1">
              {title}
            </h1>
            <span aria-hidden="true" className="mt-6 block h-1 w-20 rounded-full bg-gold" />
            {intro && <p className="mt-6 text-lead text-muted">{intro}</p>}
          </div>
          {hasAside && <div className="lg:col-span-5">{aside}</div>}
        </div>
        {children && <div className="mt-10 empty:hidden">{children}</div>}
      </Container>
    </header>
  );
}
