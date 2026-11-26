import type { SiteImage } from "@/content/provisional-images";
import { STORAGE_PATH } from "@/lib/validation/rich-text";

import type { FieldDef, SectionDef, StoredContent, StoredImage } from "./types";

/**
 * Valeurs affichées par une section : ce que l'administration a saisi, sinon
 * la valeur d'origine du champ. Une donnée de la base mal formée est ignorée
 * (valeur d'origine), jamais affichée telle quelle.
 */

const isText = (value: unknown): value is string => typeof value === "string" && value.trim() !== "";

/** Photo enregistrée valide (chemin de la médiathèque + texte alternatif), sinon null. */
export function storedImage(value: unknown): StoredImage | null {
  if (!value || typeof value !== "object") return null;
  const { path, alt } = value as Record<string, unknown>;
  if (!isText(path) || !isText(alt)) return null;
  if (path.length > 300 || !STORAGE_PATH.test(path) || path.includes("..")) return null;
  return { path, alt: alt.trim() };
}

function storedList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isText).map((item) => item.trim());
}

function storedItems(value: unknown, field: Extract<FieldDef, { kind: "items" }>): Record<string, string>[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Record<string, unknown> => !!item && typeof item === "object" && !Array.isArray(item))
    .map((item) => Object.fromEntries(field.fields.map((sub) => [sub.key, isText(item[sub.key]) ? (item[sub.key] as string).trim() : ""])));
}

/** Éléments enregistrés d'une liste fixe à clés stables (`_key` → textes). */
function storedByKey(value: unknown): Map<string, Record<string, unknown>> {
  const map = new Map<string, Record<string, unknown>>();
  if (!Array.isArray(value)) return map;
  for (const item of value) {
    if (item && typeof item === "object" && !Array.isArray(item) && typeof (item as Record<string, unknown>)._key === "string") {
      map.set((item as Record<string, unknown>)._key as string, item as Record<string, unknown>);
    }
  }
  return map;
}

/** Valeur affichée d'un champ. */
export function fieldValue(field: FieldDef, stored: StoredContent): unknown {
  const value = stored[field.key];
  switch (field.kind) {
    case "line":
    case "text":
      return isText(value) ? value.trim() : field.default;
    case "list": {
      const list = storedList(value);
      return list.length > 0 ? list : field.default;
    }
    case "items": {
      const items = storedItems(value, field);
      if (field.fixed) {
        // Même nombre d'éléments que l'origine ; chaque texte vide reprend celui d'origine.
        const keyed = field.keys ? storedByKey(value) : null;
        return field.default.map((original, index) => {
          const saved = keyed ? keyed.get(field.keys![index] ?? "") : items[index];
          return Object.fromEntries(
            field.fields.map((sub) => {
              const text = saved?.[sub.key];
              return [sub.key, typeof text === "string" && text.trim() ? text.trim() : original[sub.key] || ""];
            }),
          );
        });
      }
      const filled = items.filter((item) => Object.values(item).some(Boolean));
      return filled.length > 0 ? filled : field.default;
    }
    case "image":
      return storedImage(value) ?? field.default;
  }
}

/** Le champ affiche-t-il une saisie de l'administration (et non la valeur d'origine) ? */
export function isCustomized(field: FieldDef, stored: StoredContent): boolean {
  return fieldValue(field, stored) !== field.default;
}

export type ResolvedSection = {
  line(key: string): string;
  text(key: string): string;
  /** Texte découpé en paragraphes (ligne vide entre deux paragraphes). */
  paragraphs(key: string): string[];
  list(key: string): string[];
  items(key: string): Record<string, string>[];
  image(key: string): SiteImage | null;
  /** Tous les champs texte (ligne ou paragraphes), clé → valeur affichée. */
  strings(): Record<string, string>;
};

export function splitParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export function resolveSection(section: SectionDef, stored: StoredContent = {}): ResolvedSection {
  const get = (key: string, kind: FieldDef["kind"]) => {
    const field = section.fields.find((candidate) => candidate.key === key);
    if (!field || field.kind !== kind) throw new Error(`Champ inconnu : ${section.key}.${key} (${kind})`);
    return fieldValue(field, stored);
  };
  return {
    line: (key) => get(key, "line") as string,
    text: (key) => get(key, "text") as string,
    paragraphs: (key) => splitParagraphs(get(key, "text") as string),
    list: (key) => get(key, "list") as string[],
    items: (key) => get(key, "items") as Record<string, string>[],
    image: (key) => get(key, "image") as SiteImage | null,
    strings: () =>
      Object.fromEntries(
        section.fields.filter((field) => field.kind === "line" || field.kind === "text").map((field) => [field.key, fieldValue(field, stored) as string]),
      ),
  };
}
