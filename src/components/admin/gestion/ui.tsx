import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { buttonClasses } from "@/components/ui/Button";
import { Select } from "@/components/ui/FormField";
import { cn } from "@/lib/cn";

import type { Tone } from "./labels";

/*
 * Briques d'affichage des écrans de gestion (sans état : utilisables dans
 * les composants serveur). Uniquement les classes du design system.
 */

/** En-tête d'un écran : lien de retour facultatif, titre (h1), description, actions. */
export function GestionHeader({
  title,
  description,
  actions,
  back,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <div className="flex flex-col gap-4">
      {back && (
        <Link href={back.href} className={cn(buttonClasses({ variant: "link", size: "sm" }), "self-start")}>
          <ArrowLeft aria-hidden="true" />
          {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-2">
          <h1 className="text-h2">{title}</h1>
          {description && <p className="max-w-measure text-body text-muted">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
      </div>
    </div>
  );
}

const BADGE_TONES: Record<Tone, string> = {
  neutral: "border-line bg-ivory text-ink",
  info: "border-link/30 bg-info-50 text-brand",
  success: "border-success/30 bg-success-50 text-success",
  warning: "border-gold bg-gold-50 text-brand",
  danger: "border-danger/30 bg-danger-50 text-danger",
};

/** Pastille de statut : le texte porte le sens (pas seulement la couleur). */
export function StatusBadge({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-small font-semibold whitespace-nowrap",
        BADGE_TONES[tone],
      )}
    >
      {children}
    </span>
  );
}

/** Carte titrée (section). */
export function Panel({
  id,
  title,
  description,
  actions,
  children,
  className,
}: {
  id: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section aria-labelledby={id} className={cn("rounded-card border border-line bg-white p-5 shadow-card sm:p-6", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 id={id} className="text-h4">
            {title}
          </h2>
          {description && <p className="text-small text-muted">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

/**
 * Liste « libellé : valeur » ; les valeurs vides sont ignorées. Libellé
 * au-dessus de la valeur : lisible même dans une colonne étroite (encadré
 * latéral), une adresse email longue passe à la ligne sans couper chaque lettre.
 */
export function DetailList({ items }: { items: { label: string; value: ReactNode }[] }) {
  const shown = items.filter((item) => item.value !== null && item.value !== undefined && item.value !== "");
  return (
    <dl className="flex flex-col gap-3">
      {shown.map((item) => (
        <div key={item.label} className="min-w-0">
          <dt className="text-small font-semibold text-muted">{item.label}</dt>
          <dd className="mt-0.5 min-w-0 text-body text-ink [overflow-wrap:anywhere]">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Tableau défilant horizontalement sur petit écran (la région défilante est focalisable). */
export function TableFrame({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div
      role="region"
      aria-label={label}
      tabIndex={0}
      className="relative overflow-x-auto rounded-card border border-line bg-white shadow-card"
    >
      {children}
    </div>
  );
}

export const TABLE = "w-full min-w-[40rem] border-collapse text-left text-body";
export const TH = "border-b border-line bg-ivory px-4 py-3 text-small font-semibold text-brand whitespace-nowrap";
export const TD = "border-b border-line px-4 py-3 align-top";

type FilterSelect = {
  name: string;
  label: string;
  value?: string;
  /** Libellé de l'option « tous ». */
  allLabel: string;
  options: { value: string; label: string }[];
};

/**
 * Filtres par adresse (formulaire GET) : fonctionnent sans JavaScript, la
 * page filtrée a sa propre adresse (partageable, bouton Retour du navigateur).
 */
export function FilterForm({
  action,
  selects,
  active,
  label = "Filtres",
}: {
  action: string;
  selects: FilterSelect[];
  active: boolean;
  label?: string;
}) {
  return (
    <form method="get" action={action} aria-label={label} className="rounded-card border border-line bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-end gap-4">
        {selects.map((select) => (
          <div key={select.name} className="flex min-w-48 flex-1 flex-col gap-2">
            <label htmlFor={`filtre-${select.name}`} className="text-small font-semibold text-brand">
              {select.label}
            </label>
            <Select id={`filtre-${select.name}`} name={select.name} defaultValue={select.value ?? ""}>
              <option value="">{select.allLabel}</option>
              {select.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
        ))}
        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" className={buttonClasses({ variant: "secondary" })}>
            Filtrer
          </button>
          {active && (
            <Link href={action} className={buttonClasses({ variant: "link", size: "sm" })}>
              Effacer les filtres
            </Link>
          )}
        </div>
      </div>
    </form>
  );
}
