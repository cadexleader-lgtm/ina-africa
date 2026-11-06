import type { ReactNode } from "react";

import { Breadcrumbs, type BreadcrumbItem } from "@/components/ui/Breadcrumbs";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/SectionHeading";
import { cn } from "@/lib/cn";

type PageHeaderProps = {
  /** id du titre h1 (relie la section à son titre). */
  id: string;
  breadcrumbs: BreadcrumbItem[];
  /** Libellé au-dessus du titre (trait doré). Peut être un lien (domaine d'un projet). */
  label?: ReactNode;
  title: ReactNode;
  intro?: ReactNode;
  /** Contenu sous l'introduction (infos du projet, compteur…). */
  meta?: ReactNode;
  /** Colonne de droite dès 1024 px (fiche « En bref », etc.). */
  aside?: ReactNode;
  className?: string;
};

/**
 * En-tête des pages intérieures : fil d'Ariane, libellé, titre h1, trait doré,
 * introduction. Fond ivoire et grand arc décoratif (rappel de la photo courbe
 * de l'accueil), sans image : l'en-tête reste beau même sans aucun contenu.
 */
export function PageHeader({ id, breadcrumbs, label, title, intro, meta, aside, className }: PageHeaderProps) {
  return (
    <section aria-labelledby={id} className={cn("relative isolate overflow-hidden bg-ivory", className)}>
      {/* Arcs décoratifs (aucun sens) : masqués sur téléphone. */}
      <span
        aria-hidden="true"
        className="absolute -top-40 -right-40 -z-10 hidden size-[34rem] rounded-full border-[3px] border-brand-2/20 md:block"
      />
      <span
        aria-hidden="true"
        className="absolute -top-16 -right-16 -z-10 hidden size-[18rem] rounded-full border-2 border-gold/40 md:block"
      />
      <Container className="pt-8 pb-12 sm:pt-10 sm:pb-16 lg:pb-20">
        <Breadcrumbs items={breadcrumbs} />
        <div className={cn("mt-10 sm:mt-14", Boolean(aside) && "grid gap-10 lg:grid-cols-12 lg:items-center lg:gap-16")}>
          <div className={cn(Boolean(aside) && "lg:col-span-7")}>
            {label && <Eyebrow className="mb-5">{label}</Eyebrow>}
            <h1 id={id} className="max-w-[22ch] text-h1">
              {title}
            </h1>
            <span aria-hidden="true" className="mt-6 block h-1 w-20 rounded-full bg-gold" />
            {intro && <div className="mt-6 max-w-measure text-lead text-ink">{intro}</div>}
            {meta && <div className="mt-8">{meta}</div>}
          </div>
          {aside && <div className="lg:col-span-5">{aside}</div>}
        </div>
      </Container>
    </section>
  );
}
