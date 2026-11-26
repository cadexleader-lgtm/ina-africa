"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ArrowDown, ArrowUp, ExternalLink, Plus, RotateCcw, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { toFormValues, toSubmission, type SectionFormValues } from "@/lib/page-content/form";
import type { FieldDef, SectionDef, StoredContent, StoredImage } from "@/lib/page-content/types";
import { mediaUrl } from "@/lib/media";
import { resetPageSection, savePageSection } from "@/server/actions/admin/page-sections";

import { ImageField } from "../media/ImageField";
import { ConfirmDialog } from "../contenus/ConfirmDialog";
import { ContentForm } from "../contenus/ContentForm";
import { FieldGroup, TextAreaField, TextField } from "../contenus/fields";
import { fieldError, moveItem, unmatchedErrors } from "../contenus/form-utils";
import { useActionForm, useFormValues } from "../contenus/useActionForm";

/**
 * Une section d'une page du site, dans l'administration : numéro et nom tels
 * qu'on les voit sur le site, lien « Voir sur le site », tous ses champs, un
 * bouton d'enregistrement et « Revenir au texte d'origine ».
 */

type Props = {
  pageKey: string;
  pagePath: string;
  number: number;
  section: SectionDef;
  stored: StoredContent | null;
  updated: string | null;
};

const PARAGRAPH_HINT = "Laissez une ligne vide entre deux paragraphes.";

export function PageSectionEditor({ pageKey, pagePath, number, section, stored, updated }: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const form = useActionForm(formRef);
  const state = useFormValues<SectionFormValues>(toFormValues(section, stored ?? {}));
  const [confirmReset, setConfirmReset] = useState(false);
  const [customized, setCustomized] = useState(stored !== null);

  const anchorId = `section-${section.key}`;
  const siteHref = section.anchor ? `${pagePath}#${section.anchor}` : pagePath;
  const e = (key: string) => fieldError(form.errors, `content.${key}`);
  const shownKeys = Object.keys(form.errors ?? {}).filter((key) => key.startsWith("content."));

  const save = () => {
    const snapshot = state.values;
    const content = toSubmission(section, snapshot);
    form.run(() => savePageSection({ page: pageKey, section: section.key, content }), {
      success: "Section enregistrée : le site affiche déjà la nouvelle version.",
      onSuccess: () => {
        state.markSaved(snapshot);
        setCustomized(Object.keys(content).length > 0);
        router.refresh();
      },
    });
  };

  const reset = () => {
    form.run(() => resetPageSection({ page: pageKey, section: section.key }), {
      success: "Section revenue au texte d'origine.",
      onSuccess: () => {
        const original = toFormValues(section, {});
        state.patch(original);
        state.markSaved(original);
        setCustomized(false);
        setConfirmReset(false);
        router.refresh();
      },
    });
  };

  return (
    <section id={anchorId} aria-labelledby={`${anchorId}-titre`} className="flex scroll-mt-6 flex-col gap-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id={`${anchorId}-titre`} className="flex items-baseline gap-3 text-h3">
            <span
              aria-hidden="true"
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand text-body text-white"
            >
              {number}
            </span>
            <span>{section.title}</span>
          </h2>
          {section.description && <p className="mt-1 max-w-measure text-muted">{section.description}</p>}
          <p className="mt-1 text-small text-muted">
            {customized ? `Modifiée${updated ? ` le ${updated}` : ""}.` : "Texte d'origine du site."}
            {section.alsoOn?.length ? ` Apparaît aussi sur : ${section.alsoOn.join(", ")}.` : ""}
          </p>
        </div>
        <a
          href={siteHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-small font-semibold text-link underline-offset-4 hover:text-link-strong hover:underline"
        >
          Voir sur le site
          <ExternalLink aria-hidden="true" className="size-4" />
          <span className="sr-only">(s&apos;ouvre dans un nouvel onglet)</span>
        </a>
      </header>

      {section.elsewhere?.length ? (
        <ul className="rounded-card border border-line bg-ivory px-4 py-3 text-small">
          {section.elsewhere.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="font-semibold text-link underline-offset-4 hover:text-link-strong hover:underline">
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      <ContentForm
        formRef={formRef}
        onSubmit={save}
        feedback={form.feedback}
        feedbackRef={form.feedbackRef}
        extraErrors={unmatchedErrors(form.errors, shownKeys)}
        pending={form.pending}
        dirty={state.dirty}
        submitLabel="Enregistrer cette section"
        secondaryActions={
          customized ? (
            <Button type="button" variant="ghost" size="sm" iconLeft={<RotateCcw />} onClick={() => setConfirmReset(true)}>
              Revenir au texte d&apos;origine
            </Button>
          ) : null
        }
      >
        <FieldGroup legend="Contenu de la section">
          {section.fields.map((field) => (
            <Field
              key={field.key}
              id={`${pageKey}-${section.key}-${field.key}`}
              field={field}
              value={state.values[field.key]}
              onChange={(value) => state.set(field.key, value)}
              error={e}
            />
          ))}
        </FieldGroup>
      </ContentForm>

      <ConfirmDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={reset}
        pending={form.pending}
        title="Revenir au texte d'origine ?"
        confirmLabel="Revenir au texte d'origine"
      >
        <p>Tous les textes et photos modifiés de « {section.title} » seront remplacés par ceux d&apos;origine du site.</p>
      </ConfirmDialog>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Champs
// ---------------------------------------------------------------------------

type FieldProps = {
  id: string;
  field: FieldDef;
  value: SectionFormValues[string] | undefined;
  onChange: (value: SectionFormValues[string]) => void;
  error: (key: string) => string | null;
};

function Field({ id, field, value, onChange, error }: FieldProps) {
  switch (field.kind) {
    case "line":
      return (
        <TextField
          id={id}
          label={field.label}
          hint={field.hint}
          max={field.max}
          value={String(value ?? "")}
          error={error(field.key)}
          onChange={onChange}
        />
      );
    case "text":
      return (
        <TextAreaField
          id={id}
          label={field.label}
          hint={field.hint ?? PARAGRAPH_HINT}
          max={field.max}
          rows={field.rows ?? 4}
          value={String(value ?? "")}
          error={error(field.key)}
          onChange={onChange}
        />
      );
    case "list":
      return <ListField id={id} field={field} value={(value as string[]) ?? []} onChange={onChange} error={error} />;
    case "items":
      return <ItemsField id={id} field={field} value={(value as Record<string, string>[]) ?? []} onChange={onChange} error={error} />;
    case "image":
      return <ImageEditor field={field} value={(value as StoredImage) ?? { path: "", alt: "" }} onChange={onChange} error={error} />;
  }
}

/** Monter / descendre / retirer un élément d'une liste. */
function RowTools({
  name,
  index,
  count,
  onMove,
  onRemove,
}: {
  name: string;
  index: number;
  count: number;
  onMove: (direction: -1 | 1) => void;
  onRemove?: () => void;
}) {
  return (
    <div className="flex shrink-0 gap-1">
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="px-2"
        disabled={index === 0}
        onClick={() => onMove(-1)}
        aria-label={`Monter : ${name}`}
      >
        <ArrowUp aria-hidden="true" />
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="px-2"
        disabled={index === count - 1}
        onClick={() => onMove(1)}
        aria-label={`Descendre : ${name}`}
      >
        <ArrowDown aria-hidden="true" />
      </Button>
      {onRemove && (
        <Button type="button" size="sm" variant="ghost" className="px-2" onClick={onRemove} aria-label={`Retirer : ${name}`}>
          <Trash2 aria-hidden="true" />
        </Button>
      )}
    </div>
  );
}

function ListField({
  id,
  field,
  value,
  onChange,
  error,
}: {
  id: string;
  field: Extract<FieldDef, { kind: "list" }>;
  value: string[];
  onChange: (value: string[]) => void;
  error: (key: string) => string | null;
}) {
  const update = (index: number, text: string) => onChange(value.map((item, i) => (i === index ? text : item)));
  return (
    <fieldset className="flex min-w-0 flex-col gap-3">
      <legend className="mb-2 font-semibold text-ink">{field.label}</legend>
      {field.hint && <p className="-mt-1 text-small text-muted">{field.hint}</p>}
      {error(field.key) && <p className="text-small font-semibold text-danger">{error(field.key)}</p>}
      <ol className="flex flex-col gap-3">
        {value.map((item, index) => (
          <li key={index} className="flex items-end gap-2">
            <TextField
              id={`${id}-${index}`}
              className="min-w-0 flex-1"
              label={`${field.itemLabel} ${index + 1}`}
              max={field.max}
              value={item}
              error={error(`${field.key}.${index}`)}
              onChange={(text) => update(index, text)}
            />
            <RowTools
              name={`${field.itemLabel} ${index + 1}`}
              index={index}
              count={value.length}
              onMove={(direction) => {
                const next = moveItem(value, index, direction);
                if (next) onChange(next);
              }}
              onRemove={() => onChange(value.filter((_, i) => i !== index))}
            />
          </li>
        ))}
      </ol>
      {value.length < field.maxItems && (
        <div>
          <Button type="button" variant="secondary" size="sm" iconLeft={<Plus />} onClick={() => onChange([...value, ""])}>
            Ajouter : {field.itemLabel.toLowerCase()}
          </Button>
        </div>
      )}
    </fieldset>
  );
}

function ItemsField({
  id,
  field,
  value,
  onChange,
  error,
}: {
  id: string;
  field: Extract<FieldDef, { kind: "items" }>;
  value: Record<string, string>[];
  onChange: (value: Record<string, string>[]) => void;
  error: (key: string) => string | null;
}) {
  const update = (index: number, key: string, text: string) =>
    onChange(value.map((item, i) => (i === index ? { ...item, [key]: text } : item)));
  const empty = () => Object.fromEntries(field.fields.map((sub) => [sub.key, ""]));
  return (
    <fieldset className="flex min-w-0 flex-col gap-3">
      <legend className="mb-2 font-semibold text-ink">{field.label}</legend>
      {field.hint && <p className="-mt-1 text-small text-muted">{field.hint}</p>}
      {error(field.key) && <p className="text-small font-semibold text-danger">{error(field.key)}</p>}
      {value.length === 0 && <p className="text-small text-muted">Aucun élément pour l&apos;instant.</p>}
      <ol className="flex flex-col gap-3">
        {value.map((item, index) => {
          const name = `${field.itemLabel} ${index + 1}`;
          return (
            <li key={index} className="rounded-card border border-line bg-ivory p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="font-semibold text-brand">{name}</p>
                {!field.fixed && (
                  <RowTools
                    name={name}
                    index={index}
                    count={value.length}
                    onMove={(direction) => {
                      const next = moveItem(value, index, direction);
                      if (next) onChange(next);
                    }}
                    onRemove={() => onChange(value.filter((_, i) => i !== index))}
                  />
                )}
              </div>
              <div className="flex flex-col gap-4">
                {field.fields.map((sub) =>
                  sub.kind === "line" ? (
                    <TextField
                      key={sub.key}
                      id={`${id}-${index}-${sub.key}`}
                      label={sub.label}
                      max={sub.max}
                      value={item[sub.key] ?? ""}
                      error={error(`${field.key}.${index}.${sub.key}`)}
                      onChange={(text) => update(index, sub.key, text)}
                    />
                  ) : (
                    <TextAreaField
                      key={sub.key}
                      id={`${id}-${index}-${sub.key}`}
                      label={sub.label}
                      max={sub.max}
                      rows={3}
                      value={item[sub.key] ?? ""}
                      error={error(`${field.key}.${index}.${sub.key}`)}
                      onChange={(text) => update(index, sub.key, text)}
                    />
                  ),
                )}
              </div>
            </li>
          );
        })}
      </ol>
      {!field.fixed && value.length < field.maxItems && (
        <div>
          <Button type="button" variant="secondary" size="sm" iconLeft={<Plus />} onClick={() => onChange([...value, empty()])}>
            Ajouter : {field.itemLabel.toLowerCase()}
          </Button>
        </div>
      )}
    </fieldset>
  );
}

function ImageEditor({
  field,
  value,
  onChange,
  error,
}: {
  field: Extract<FieldDef, { kind: "image" }>;
  value: StoredImage;
  onChange: (value: StoredImage) => void;
  error: (key: string) => string | null;
}) {
  const original = field.default;
  const usesOriginal = !value.path;
  return (
    <div className="flex flex-col gap-3">
      {usesOriginal && original && (
        <div className="flex flex-wrap items-center gap-4 rounded-card border border-line bg-ivory p-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- aperçu d'administration */}
          <img src={mediaUrl(original.path)} alt="" className="h-20 w-32 rounded-card object-cover" />
          <p className="min-w-0 flex-1 text-small text-muted">
            <span className="block font-semibold text-ink">Photo actuelle (d&apos;origine)</span>
            {original.alt}
            {"provisional" in original && original.provisional ? " · Photo d'illustration provisoire." : ""}
          </p>
        </div>
      )}
      <ImageField
        label={original ? `${field.label} : nouvelle photo (remplace la photo actuelle)` : field.label}
        hint={field.hint}
        folder="site"
        path={value.path}
        alt={value.alt}
        pathError={error(`${field.key}.path`)}
        altError={error(`${field.key}.alt`)}
        onChange={(next) => onChange({ path: next.path, alt: next.alt })}
      />
      {!usesOriginal && original && (
        <div>
          <Button type="button" variant="ghost" size="sm" iconLeft={<RotateCcw />} onClick={() => onChange({ path: "", alt: "" })}>
            Revenir à la photo d&apos;origine
          </Button>
        </div>
      )}
    </div>
  );
}
