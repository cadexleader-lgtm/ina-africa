import type { SiteImage } from "@/content/provisional-images";

/**
 * Textes et photos des pages du site, modifiables dans l'administration
 * (menu « Pages du site »).
 *
 * Chaque page est décrite par une liste de SECTIONS, dans l'ordre où elles
 * apparaissent sur le site. Chaque section a des CHAMPS, avec leur valeur
 * d'origine (le texte actuel du site). La table `page_sections` ne garde que
 * ce que l'administration a saisi : un champ vide ou absent affiche toujours
 * la valeur d'origine, jamais un trou.
 *
 * Définitions des pages : src/content/page-sections/.
 */

/** Sous-champ d'un élément de liste (ex. titre + texte d'une carte). */
export type SubFieldDef = {
  key: string;
  label: string;
  kind: "line" | "text";
  max: number;
};

type BaseField = {
  key: string;
  label: string;
  hint?: string;
};

export type FieldDef =
  /** Texte sur une ligne (titre, étiquette). */
  | (BaseField & { kind: "line"; max: number; default: string })
  /** Texte sur plusieurs lignes (une ligne vide entre deux paragraphes). */
  | (BaseField & { kind: "text"; max: number; rows?: number; default: string })
  /** Liste de phrases (missions, objectifs…). */
  | (BaseField & { kind: "list"; itemLabel: string; max: number; maxItems: number; default: string[] })
  /**
   * Liste d'éléments à plusieurs champs (cartes, repères…). `fixed` : le
   * nombre d'éléments est imposé (ex. les 3 façons de s'engager, chacune liée
   * à une page) : seuls leurs textes changent.
   */
  | (BaseField & {
      kind: "items";
      itemLabel: string;
      fields: SubFieldDef[];
      maxItems: number;
      fixed?: boolean;
      default: Record<string, string>[];
    })
  /** Photo de la médiathèque (texte alternatif obligatoire). */
  | (BaseField & { kind: "image"; default: SiteImage | null });

export type FieldKind = FieldDef["kind"];

export type SectionDef = {
  /** Identifiant stable (ne jamais le renommer : il sert de clé dans la base). */
  key: string;
  /** Nom de la section tel qu'on le voit sur le site. */
  title: string;
  /** Ce que montre la section, en une phrase. */
  description?: string;
  /** Ancre de la section sur la page (lien « Voir sur le site »), ou null pour le haut de page. */
  anchor: string | null;
  fields: FieldDef[];
  /** Éléments de la section gérés ailleurs dans l'administration. */
  elsewhere?: { label: string; href: string }[];
  /** Autres pages où la même section apparaît (une modification vaut partout). */
  alsoOn?: string[];
};

export type PageDef = {
  /** Identifiant stable (clé dans la base). */
  key: string;
  label: string;
  /** Adresse publique de la page. */
  path: string;
  description: string;
  sections: SectionDef[];
};

/** Contenu enregistré d'une section (clé du champ → valeur). */
export type StoredContent = Record<string, unknown>;

/** Photo choisie dans la médiathèque. */
export type StoredImage = { path: string; alt: string };

/** Identifiant d'une section dans la base : « page.section ». */
export function sectionId(page: string, section: string): string {
  return `${page}.${section}`;
}
