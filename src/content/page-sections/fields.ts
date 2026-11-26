import type { SiteImage } from "@/content/provisional-images";
import type { FieldDef, SectionDef } from "@/lib/page-content/types";

/**
 * Raccourcis pour décrire les champs des pages modifiables (mêmes libellés et
 * mêmes limites partout dans l'administration).
 */

export const label = (value: string, text = "Petit titre au-dessus"): FieldDef => ({ key: "label", label: text, kind: "line", max: 60, default: value });

export const title = (value: string, text = "Titre de la section"): FieldDef => ({ key: "title", label: text, kind: "line", max: 160, default: value });

export const line = (key: string, text: string, value: string, max = 200, hint?: string): FieldDef => ({
  key,
  label: text,
  kind: "line",
  max,
  default: value,
  ...(hint ? { hint } : {}),
});

export const lead = (value: string, key = "lead"): FieldDef => line(key, "Phrase d'accroche (en gras)", value, 300);

export const text = (key: string, label: string, value: string, max = 3000, rows = 5): FieldDef => ({
  key,
  label,
  kind: "text",
  max,
  rows,
  default: value,
});

export const image = (key: string, label: string, value: SiteImage | null, hint?: string): FieldDef => ({
  key,
  label,
  kind: "image",
  default: value,
  ...(hint ? { hint } : {}),
});

export const list = (key: string, label: string, itemLabel: string, value: readonly string[], max = 300, maxItems = 12): FieldDef => ({
  key,
  label,
  itemLabel,
  kind: "list",
  max,
  maxItems,
  default: [...value],
});

/** Liste de cartes « titre + texte ». */
export const cards = (
  key: string,
  label: string,
  itemLabel: string,
  value: readonly { title: string; text: string }[],
  options: { maxItems?: number; titleMax?: number; textMax?: number; fixed?: boolean; hint?: string } = {},
): FieldDef => ({
  key,
  label,
  itemLabel,
  kind: "items",
  maxItems: options.maxItems ?? 12,
  ...(options.fixed ? { fixed: true } : {}),
  ...(options.hint ? { hint: options.hint } : {}),
  fields: [
    { key: "title", label: "Titre", kind: "line", max: options.titleMax ?? 160 },
    { key: "text", label: "Texte", kind: "text", max: options.textMax ?? 1000 },
  ],
  default: value.map((item) => ({ title: item.title, text: item.text })),
});

/** Section « Haut de la page » (petit titre, titre, présentation, photo de fond). */
export function headerSection(values: {
  label: string;
  title: string;
  intro: string;
  image: SiteImage | null;
  description?: string;
  extra?: FieldDef[];
  elsewhere?: SectionDef["elsewhere"];
}): SectionDef {
  return {
    key: "en-tete",
    title: "Haut de la page",
    description: values.description ?? "Titre de la page, texte de présentation et photo de fond.",
    anchor: null,
    fields: [
      label(values.label),
      title(values.title, "Titre de la page"),
      text("intro", "Présentation", values.intro, 2000, 4),
      ...(values.extra ?? []),
      image("image", "Photo de fond", values.image, "Une vraie photo de l'ONG, au format paysage."),
    ],
    ...(values.elsewhere ? { elsewhere: values.elsewhere } : {}),
  };
}
