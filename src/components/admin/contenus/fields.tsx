"use client";

import { useState, type ReactNode } from "react";

import { Checkbox, FormField, Input, Select, Textarea } from "@/components/ui/FormField";
import { cn } from "@/lib/cn";

import { countChars, nextSlug, normalizeSlugInput } from "./form-utils";

/*
 * Champs des formulaires de l'administration (composants client contrôlés).
 * Chaque champ : libellé relié, aide et erreur reliées (aria-describedby),
 * aria-invalid en cas d'erreur, compteur de caractères pour les champs limités.
 */

type BaseProps = {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: string | null;
  required?: boolean;
  className?: string;
};

function withDescribedBy(describedBy: string | undefined, extra: string | undefined) {
  return [describedBy, extra].filter(Boolean).join(" ") || undefined;
}

/** Compteur visible + annonce discrète quand la limite approche ou est dépassée. */
export function CharCounter({ id, value, max, multiline = false }: { id: string; value: string; max: number; multiline?: boolean }) {
  const state = countChars(value, max, multiline);
  return (
    <>
      <p id={id} className={cn("-mt-1 text-right text-small", state.over ? "font-semibold text-danger" : "text-muted")}>
        {state.label}
      </p>
      <p className="sr-only" aria-live="polite">
        {state.over
          ? `Limite dépassée de ${(-state.remaining).toLocaleString("fr-FR")} caractères.`
          : state.near
            ? `Il reste ${state.remaining.toLocaleString("fr-FR")} caractères.`
            : ""}
      </p>
    </>
  );
}

type TextFieldProps = BaseProps & {
  value: string;
  onChange: (value: string) => void;
  /** Limite de la base : affiche un compteur. */
  max?: number;
  type?: "text" | "email" | "tel" | "url" | "date" | "number" | "search";
  inputMode?: "text" | "numeric" | "decimal" | "email" | "tel" | "url";
  autoComplete?: string;
  placeholder?: string;
  disabled?: boolean;
};

export function TextField({
  id,
  label,
  hint,
  error,
  required,
  className,
  value,
  onChange,
  max,
  type = "text",
  inputMode,
  autoComplete = "off",
  placeholder,
  disabled,
}: TextFieldProps) {
  const counterId = max ? `${id}-compteur` : undefined;
  return (
    <FormField id={id} label={label} hint={hint} error={error} required={required} className={className}>
      {(field) => (
        <>
          <Input
            {...field}
            aria-describedby={withDescribedBy(field["aria-describedby"], counterId)}
            type={type}
            inputMode={inputMode}
            autoComplete={autoComplete}
            placeholder={placeholder}
            disabled={disabled}
            value={value}
            onChange={(event) => onChange(event.target.value)}
          />
          {max && counterId && <CharCounter id={counterId} value={value} max={max} />}
        </>
      )}
    </FormField>
  );
}

type TextAreaFieldProps = BaseProps & {
  value: string;
  onChange: (value: string) => void;
  max?: number;
  rows?: number;
  placeholder?: string;
};

export function TextAreaField({ id, label, hint, error, required, className, value, onChange, max, rows = 4, placeholder }: TextAreaFieldProps) {
  const counterId = max ? `${id}-compteur` : undefined;
  return (
    <FormField id={id} label={label} hint={hint} error={error} required={required} className={className}>
      {(field) => (
        <>
          <Textarea
            {...field}
            aria-describedby={withDescribedBy(field["aria-describedby"], counterId)}
            rows={rows}
            placeholder={placeholder}
            value={value}
            onChange={(event) => onChange(event.target.value)}
          />
          {max && counterId && <CharCounter id={counterId} value={value} max={max} multiline />}
        </>
      )}
    </FormField>
  );
}

type SelectFieldProps = BaseProps & {
  value: string;
  onChange: (value: string) => void;
  options: readonly { value: string; label: string }[];
  /** Première option vide (ex. « Aucune catégorie »). */
  emptyLabel?: string;
};

export function SelectField({ id, label, hint, error, required, className, value, onChange, options, emptyLabel }: SelectFieldProps) {
  return (
    <FormField id={id} label={label} hint={hint} error={error} required={required} className={className}>
      {(field) => (
        <Select {...field} value={value} onChange={(event) => onChange(event.target.value)}>
          {emptyLabel !== undefined && <option value="">{emptyLabel}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      )}
    </FormField>
  );
}

export function CheckField({
  id,
  label,
  hint,
  error,
  checked,
  onChange,
  className,
}: {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: string | null;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}) {
  return (
    <Checkbox
      id={id}
      label={label}
      hint={hint}
      error={error}
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
      className={className}
    />
  );
}

/**
 * Titre + adresse lisible (slug) : l'adresse suit le titre tant que la
 * personne ne l'a pas modifiée ; une adresse déjà enregistrée ne bouge plus
 * (les liens partagés resteraient valables).
 */
export function TitleSlugFields({
  idPrefix,
  title,
  slug,
  onChange,
  titleLabel,
  titleMax,
  titleError,
  slugError,
  locked,
  publicPrefix,
}: {
  idPrefix: string;
  title: string;
  slug: string;
  onChange: (next: { title: string; slug: string }) => void;
  titleLabel: string;
  titleMax: number;
  titleError?: string | null;
  slugError?: string | null;
  /** Contenu déjà enregistré : l'adresse n'est plus recalculée automatiquement. */
  locked: boolean;
  /** Début de l'adresse publique, ex. « /actualites/ ». */
  publicPrefix: string;
}) {
  const [edited, setEdited] = useState(false);
  return (
    <div className="flex flex-col gap-5">
      <TextField
        id={`${idPrefix}-title`}
        label={titleLabel}
        required
        max={titleMax}
        value={title}
        error={titleError}
        onChange={(value) => onChange({ title: value, slug: nextSlug({ title: value, slug, edited, locked }) })}
      />
      <TextField
        id={`${idPrefix}-slug`}
        label="Adresse de la page"
        hint={
          <>
            Calculée à partir du titre, modifiable : lettres minuscules sans accent, chiffres et tirets. Adresse publique :{" "}
            <span className="font-medium text-ink">
              {publicPrefix}
              {slug || "…"}
            </span>
            {locked && " — la modifier casserait les liens déjà partagés."}
          </>
        }
        max={120}
        value={slug}
        error={slugError}
        onChange={(value) => {
          setEdited(true);
          onChange({ title, slug: normalizeSlugInput(value) });
        }}
      />
    </div>
  );
}

/** Groupe de champs (fieldset + legend), sobre. */
export function FieldGroup({
  legend,
  description,
  children,
  className,
}: {
  legend: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <fieldset className={cn("min-w-0 rounded-card border border-line bg-white p-5 sm:p-6", className)}>
      {/* Légende « flottante » : placée dans le cadre plutôt que sur la bordure. */}
      <legend className="float-left mb-4 w-full font-heading text-h4 text-brand">{legend}</legend>
      <div className="clear-left flex flex-col gap-5">
        {description && <p className="-mt-2 text-small text-muted">{description}</p>}
        {children}
      </div>
    </fieldset>
  );
}
