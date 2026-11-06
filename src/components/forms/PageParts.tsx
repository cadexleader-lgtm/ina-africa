import type { ReactNode } from "react";

import { Breadcrumbs, type BreadcrumbItem } from "@/components/ui/Breadcrumbs";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/SectionHeading";
import type { OrgContacts } from "@/components/forms/ContactAlternatives";
import { cn } from "@/lib/cn";
import type { SiteSettings } from "@/lib/types/content";

/** Coordonnées publiques de l'ONG, à partir des paramètres du site. */
export function contactsFrom(settings: SiteSettings): OrgContacts {
  return { email: settings.contactEmail, phone: settings.contactPhone, whatsapp: settings.whatsappNumber };
}

type PageIntroProps = {
  title: ReactNode;
  eyebrow?: string;
  intro?: ReactNode;
  /** Fil d'Ariane APRÈS « Accueil » ; le dernier élément est la page courante. */
  breadcrumbs: BreadcrumbItem[];
  /** id du titre (h1). */
  id?: string;
  children?: ReactNode;
};

/** En-tête des pages formulaires et dons : fil d'Ariane, libellé, titre, introduction. */
export function PageIntro({ title, eyebrow, intro, breadcrumbs, id = "page-titre", children }: PageIntroProps) {
  return (
    <section aria-labelledby={id} className="border-b border-line bg-ivory">
      <Container className="py-section-sm">
        <Breadcrumbs items={[{ label: "Accueil", href: "/" }, ...breadcrumbs]} className="mb-8 md:mb-10" />
        <div className="max-w-reading">
          {eyebrow && <Eyebrow className="mb-4">{eyebrow}</Eyebrow>}
          <h1 id={id} className="text-h1">
            {title}
          </h1>
          <span aria-hidden="true" className="mt-6 block h-1 w-16 rounded-full bg-gold" />
          {intro && <div className="mt-6 text-lead text-ink">{intro}</div>}
          {children}
        </div>
      </Container>
    </section>
  );
}

/** Panneau blanc qui accueille un formulaire. */
export function FormCard({
  title,
  titleId,
  description,
  children,
  className,
}: {
  title?: ReactNode;
  titleId?: string;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-panel border border-line bg-white p-5 shadow-card sm:p-8 lg:p-10", className)}>
      {title && (
        <h2 id={titleId} className="text-h3">
          {title}
        </h2>
      )}
      {description && <div className="mt-3 text-muted">{description}</div>}
      <div className={title || description ? "mt-8" : undefined}>{children}</div>
    </div>
  );
}

/** Encadré latéral (étapes, coordonnées, liens). */
export function AsideCard({
  title,
  children,
  tone = "ivory",
  className,
}: {
  title: ReactNode;
  children: ReactNode;
  tone?: "ivory" | "white";
  className?: string;
}) {
  return (
    <div className={cn("rounded-card border border-line p-6 sm:p-7", tone === "ivory" ? "bg-ivory" : "bg-white", className)}>
      <h2 className="text-h4">{title}</h2>
      <div className="mt-4">{children}</div>
    </div>
  );
}

/** Étapes numérotées (« Comment ça se passe ? »). */
export function StepList({ steps }: { steps: readonly string[] }) {
  return (
    <ol className="flex flex-col gap-4">
      {steps.map((step, index) => (
        <li key={step} className="flex gap-3">
          <span
            aria-hidden="true"
            className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand text-small font-bold text-white"
          >
            {index + 1}
          </span>
          <span className="pt-0.5 text-ink">
            <span className="sr-only">Étape {index + 1} : </span>
            {step}
          </span>
        </li>
      ))}
    </ol>
  );
}
