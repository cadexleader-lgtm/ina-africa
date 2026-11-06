import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, Search } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/FormField";
import { cn } from "@/lib/cn";

import type { BadgeTone } from "./labels";

/*
 * Éléments de mise en page des écrans de contenus (sans état : utilisables
 * dans les composants serveur et client).
 */

/** En-tête d'une page : titre (h1), description, actions (ex. « Nouvel article »). */
export function AdminPageHeader({
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
        <Link
          href={back.href}
          className="inline-flex w-fit items-center gap-1.5 rounded-field text-small font-semibold text-link underline-offset-4 hover:text-link-strong hover:underline"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-h2">{title}</h1>
          {description && <p className="mt-2 max-w-measure text-muted">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
      </div>
    </div>
  );
}

const BADGE_TONES: Record<BadgeTone, string> = {
  neutral: "border-line-strong bg-white text-ink",
  info: "border-link/30 bg-info-50 text-ink",
  success: "border-success/30 bg-success-50 text-success",
  warning: "border-gold bg-gold-50 text-brand",
};

/** Pastille d'état (le texte porte le sens, pas seulement la couleur). */
export function StatusBadge({ tone = "neutral", children }: { tone?: BadgeTone; children: ReactNode }) {
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

/** Pastille Publié / Non publié (ou Actif / Inactif). */
export function VisibilityBadge({ on, labels = { on: "Publié", off: "Non publié" } }: { on: boolean; labels?: { on: string; off: string } }) {
  return <StatusBadge tone={on ? "success" : "neutral"}>{on ? labels.on : labels.off}</StatusBadge>;
}

export type Column<T> = {
  header: ReactNode;
  cell: (row: T, index: number) => ReactNode;
  /** Masquer la colonne sur petit écran (information secondaire). */
  hideOnMobile?: boolean;
  className?: string;
};

/**
 * Tableau de données accessible : <caption> (nom du tableau), en-têtes de
 * colonnes, première cellule en en-tête de ligne. Sur petit écran : le
 * tableau défile horizontalement dans une zone atteignable au clavier.
 */
export function DataTable<T>({
  caption,
  columns,
  rows,
  rowKey,
  rowHeader = 0,
}: {
  caption: string;
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  /** Colonne qui nomme la ligne (<th scope="row">). */
  rowHeader?: number;
}) {
  return (
    <div
      role="region"
      aria-label={caption}
      tabIndex={0}
      className="overflow-x-auto rounded-card border border-line bg-white"
    >
      <table className="w-full border-collapse text-left">
        <caption className="sr-only">{caption}</caption>
        <thead className="border-b border-line bg-ivory">
          <tr>
            {columns.map((column, index) => (
              <th
                key={index}
                scope="col"
                className={cn(
                  "px-4 py-3 text-small font-semibold whitespace-nowrap text-brand",
                  column.hideOnMobile && "hidden md:table-cell",
                  column.className,
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((row, rowIndex) => (
            <tr key={rowKey(row)} className="align-top">
              {columns.map((column, index) => {
                const Cell = index === rowHeader ? "th" : "td";
                return (
                  <Cell
                    key={index}
                    scope={index === rowHeader ? "row" : undefined}
                    className={cn(
                      "px-4 py-3 text-body font-normal text-ink",
                      column.hideOnMobile && "hidden md:table-cell",
                      column.className,
                    )}
                  >
                    {column.cell(row, rowIndex)}
                  </Cell>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Lien du titre d'une ligne vers sa page d'édition. */
export function RowLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="font-semibold text-link underline-offset-4 hover:text-link-strong hover:underline">
      {children}
    </Link>
  );
}

export type FilterSelect = {
  name: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
  allLabel: string;
};

/**
 * Filtres d'une liste : formulaire GET (chaque filtre a son adresse,
 * fonctionne sans JavaScript). La page revient à 1 à chaque filtrage.
 */
export function FilterBar({
  action,
  selects = [],
  search,
  checkboxes = [],
}: {
  action: string;
  selects?: FilterSelect[];
  search?: { name: string; label: string; value: string };
  checkboxes?: { name: string; label: string; checked: boolean }[];
}) {
  return (
    <form
      method="get"
      action={action}
      role="search"
      aria-label="Filtrer la liste"
      className="flex flex-wrap items-end gap-4 rounded-card border border-line bg-white p-4"
    >
      {search && (
        <div className="flex min-w-56 flex-1 flex-col gap-2">
          <label htmlFor={`filtre-${search.name}`} className="text-small font-semibold text-brand">
            {search.label}
          </label>
          <Input id={`filtre-${search.name}`} type="search" name={search.name} defaultValue={search.value} />
        </div>
      )}
      {selects.map((select) => (
        <div key={select.name} className="flex min-w-44 flex-col gap-2">
          <label htmlFor={`filtre-${select.name}`} className="text-small font-semibold text-brand">
            {select.label}
          </label>
          <Select id={`filtre-${select.name}`} name={select.name} defaultValue={select.value}>
            <option value="">{select.allLabel}</option>
            {select.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
      ))}
      {checkboxes.map((box) => (
        <div key={box.name} className="flex min-h-12 items-center gap-3">
          <input
            id={`filtre-${box.name}`}
            type="checkbox"
            name={box.name}
            value="1"
            defaultChecked={box.checked}
            className="size-5 cursor-pointer accent-brand"
          />
          <label htmlFor={`filtre-${box.name}`} className="cursor-pointer text-body text-ink">
            {box.label}
          </label>
        </div>
      ))}
      <Button type="submit" variant="secondary" iconLeft={<Search />}>
        Filtrer
      </Button>
    </form>
  );
}

/** Nombre de résultats (annoncé comme texte simple). */
export function ResultCount({ total, singular, plural }: { total: number; singular: string; plural: string }) {
  return (
    <p className="text-small text-muted">
      {total.toLocaleString("fr-FR")} {total > 1 ? plural : singular}
    </p>
  );
}

/** Panneau blanc (section d'une page d'édition). */
export function Panel({ title, children, className }: { title?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("flex flex-col gap-4 rounded-card border border-line bg-white p-5 sm:p-6", className)}>
      {title && <h2 className="text-h4">{title}</h2>}
      {children}
    </section>
  );
}

/** Page d'édition : formulaire + colonne latérale (visibilité, publication) sur grand écran. */
export function EditLayout({ aside, children }: { aside?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-6 xl:flex-row-reverse xl:items-start">
      {aside && <div className="flex flex-col gap-6 xl:sticky xl:top-6 xl:w-80 xl:shrink-0">{aside}</div>}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
