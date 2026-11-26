import { z } from "zod";

import { ADMIN_MESSAGES as M, optionalAlt, optionalLine, optionalStoragePath, optionalText } from "@/lib/validation/admin/common";

import type { FieldDef, SectionDef, StoredContent } from "./types";

/**
 * Validation d'une section saisie dans l'administration. Les champs vides ne
 * sont pas enregistrés (le site affiche alors la valeur d'origine).
 * Taille totale d'une section limitée par la base (100 000 octets).
 */

function itemsSchema(field: Extract<FieldDef, { kind: "items" }>) {
  const item = z.object({
    ...Object.fromEntries(field.fields.map((sub) => [sub.key, sub.kind === "line" ? optionalLine(sub.max) : optionalText(sub.max)])),
    // Identifiant stable d'un élément de liste fixe (jamais affiché).
    ...(field.keys ? { _key: z.enum(field.keys as [string, ...string[]]) } : {}),
  });
  return z
    .array(item)
    .max(field.maxItems, `${field.maxItems} éléments au plus.`)
    .refine(
      (items) => !field.fixed || field.keys !== undefined || items.length === field.default.length,
      "Le nombre d'éléments de cette liste ne peut pas changer.",
    )
    .transform((items) => {
      const cleaned = items.map((entry) =>
        Object.fromEntries(Object.entries(entry).filter((pair): pair is [string, string] => typeof pair[1] === "string")),
      );
      // Liste fixe à clés : seuls les éléments modifiés ; sans clés : la position de chaque élément (même vide).
      if (field.fixed && field.keys) return cleaned.filter((entry) => Object.keys(entry).length > 1);
      return field.fixed ? cleaned : cleaned.filter((entry) => Object.keys(entry).length > 0);
    });
}

function fieldSchema(field: FieldDef): z.ZodType {
  switch (field.kind) {
    case "line":
      return optionalLine(field.max).optional();
    case "text":
      return optionalText(field.max).optional();
    case "list":
      return z
        .array(optionalLine(field.max))
        .transform((items) => items.filter((item): item is string => item !== null))
        .refine((items) => items.length <= field.maxItems, `${field.maxItems} éléments au plus.`)
        .optional();
    case "items":
      return itemsSchema(field).optional();
    case "image":
      return z
        .object({ path: optionalStoragePath, alt: optionalAlt })
        .superRefine((image, ctx) => {
          if (image.path && !image.alt) ctx.addIssue({ code: "custom", path: ["alt"], message: M.altRequired });
        })
        .nullable()
        .optional();
  }
}

/** Contenu d'une section, nettoyé : seuls les champs remplis sont gardés. */
export function sectionContentSchema(section: SectionDef) {
  return z.object(Object.fromEntries(section.fields.map((field) => [field.key, fieldSchema(field)]))).transform((values) => {
    const content: StoredContent = {};
    for (const field of section.fields) {
      const value = values[field.key];
      if (value === null || value === undefined) continue;
      if (field.kind === "image") {
        const image = value as { path: string | null; alt: string | null };
        if (image.path && image.alt) content[field.key] = { path: image.path, alt: image.alt };
        continue;
      }
      if (Array.isArray(value)) {
        const meaningful = field.kind === "items" && field.fixed ? value.some((entry) => Object.keys(entry).length > 0) : value.length > 0;
        if (meaningful) content[field.key] = value;
        continue;
      }
      content[field.key] = value;
    }
    return content;
  });
}
