import { fieldValue, storedImage } from "./resolve";
import type { FieldDef, SectionDef, StoredContent, StoredImage } from "./types";

/**
 * Formulaire d'une section dans l'administration.
 *  - À l'ouverture, chaque champ montre CE QUI EST AFFICHÉ sur le site
 *    (saisie enregistrée, sinon texte d'origine) : on modifie le vrai texte.
 *  - À l'enregistrement, un champ resté identique au texte d'origine n'est
 *    pas envoyé : il suivra le texte d'origine (aucune copie figée).
 */

export type FormValue = string | string[] | Record<string, string>[] | StoredImage;
export type SectionFormValues = Record<string, FormValue>;

const EMPTY_IMAGE: StoredImage = { path: "", alt: "" };

export function toFormValues(section: SectionDef, stored: StoredContent = {}): SectionFormValues {
  const values: SectionFormValues = {};
  for (const field of section.fields) {
    if (field.kind === "image") {
      values[field.key] = storedImage(stored[field.key]) ?? EMPTY_IMAGE;
      continue;
    }
    const value = fieldValue(field, stored);
    if (field.kind === "items") {
      // Copie : le formulaire ne doit jamais modifier les valeurs d'origine.
      values[field.key] = (value as Record<string, string>[]).map((item) =>
        Object.fromEntries(field.fields.map((sub) => [sub.key, item[sub.key] ?? ""])),
      );
    } else if (field.kind === "list") {
      values[field.key] = [...(value as string[])];
    } else {
      values[field.key] = value as string;
    }
  }
  return values;
}

const norm = (value: string) => value.replace(/\r\n?/g, "\n").trim();

function sameList(a: string[], b: string[]): boolean {
  const left = a.map(norm).filter(Boolean);
  return left.length === b.length && left.every((item, index) => item === norm(b[index] ?? ""));
}

function sameItems(field: Extract<FieldDef, { kind: "items" }>, a: Record<string, string>[], b: Record<string, string>[]): boolean {
  const keep = a.filter((item) => field.fields.some((sub) => norm(item[sub.key] ?? "")));
  return (
    keep.length === b.length &&
    keep.every((item, index) => field.fields.every((sub) => norm(item[sub.key] ?? "") === norm(b[index]?.[sub.key] ?? "")))
  );
}

/** Données à envoyer : seulement ce qui diffère du texte d'origine. */
export function toSubmission(section: SectionDef, values: SectionFormValues): StoredContent {
  const content: StoredContent = {};
  for (const field of section.fields) {
    const value = values[field.key];
    switch (field.kind) {
      case "line":
      case "text":
        if (typeof value === "string" && norm(value) && norm(value) !== norm(field.default)) content[field.key] = value;
        break;
      case "list":
        if (Array.isArray(value) && !sameList(value as string[], field.default)) content[field.key] = value;
        break;
      case "items": {
        if (!Array.isArray(value)) break;
        const items = value as Record<string, string>[];
        if (field.fixed) {
          // Chaque texte identique à l'origine est laissé vide (il suivra l'origine).
          const changed = items.map((item, index) =>
            Object.fromEntries(
              field.fields.map((sub) => {
                const text = item[sub.key] ?? "";
                return [sub.key, norm(text) === norm(field.default[index]?.[sub.key] ?? "") ? "" : text];
              }),
            ),
          );
          if (changed.some((item) => Object.values(item).some((text) => norm(text)))) content[field.key] = changed;
        } else if (!sameItems(field, items, field.default)) {
          content[field.key] = items;
        }
        break;
      }
      case "image": {
        const image = value as StoredImage | undefined;
        if (image && (image.path || image.alt)) content[field.key] = image;
        break;
      }
    }
  }
  return content;
}
