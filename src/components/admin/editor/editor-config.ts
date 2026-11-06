import { videoProviderOf } from "@/lib/validation/admin/common";
import { youtubeId } from "@/lib/video";

/*
 * Réglages de l'éditeur de texte riche (Tiptap), sans dépendance à Tiptap :
 * testés dans tests/unit/admin-ui-contenus-editor.test.ts.
 *
 * L'éditeur ne propose QUE la liste fermée de src/lib/validation/rich-text.ts :
 *  - nœuds : paragraphe, sous-titres (niveaux 2, 3, 4), listes à puces et
 *    numérotées, citation, séparateur, saut de ligne, image de la
 *    médiathèque, vidéo YouTube / Facebook ;
 *  - marques : gras, italique, souligné, lien (https:// ou mailto: seulement).
 * Tout le reste du « StarterKit » de Tiptap est désactivé.
 */

/** Nœuds autorisés (mêmes noms que rich-text.ts). */
export const ALLOWED_NODES = [
  "doc",
  "paragraph",
  "text",
  "hardBreak",
  "heading",
  "bulletList",
  "orderedList",
  "listItem",
  "blockquote",
  "horizontalRule",
  "image",
  "video",
] as const;

/** Marques autorisées. */
export const ALLOWED_MARKS = ["bold", "italic", "underline", "link"] as const;

/** Sous-titres : le titre de la page est le seul H1. */
export const HEADING_LEVELS = [2, 3, 4] as const;
export type HeadingLevel = (typeof HEADING_LEVELS)[number];

/** Extensions du StarterKit désactivées (hors liste fermée). */
export const DISABLED_STARTER_KIT = ["code", "codeBlock", "strike"] as const;

/**
 * Options du StarterKit : `false` désactive une extension. Les options du
 * lien sont complétées dans l'éditeur (fonction de validation).
 */
export function starterKitOptions() {
  const levels: (2 | 3 | 4)[] = [...HEADING_LEVELS];
  return {
    code: false as const,
    codeBlock: false as const,
    strike: false as const,
    heading: { levels },
    link: {
      openOnClick: false as const,
      autolink: false,
      linkOnPaste: false,
      enableClickSelection: true,
      protocols: [] as string[],
      defaultProtocol: "https",
      isAllowedUri: (url: string) => isAllowedEditorHref(url),
      HTMLAttributes: { rel: "noopener noreferrer nofollow", target: null },
    },
  } satisfies Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Liens : https:// ou mailto: uniquement
// ---------------------------------------------------------------------------

const EMAIL = /^[^\s@<>()"',;:]+@[^\s@<>()"',;:]+\.[^\s@<>()"',;:]{2,}$/;

/** Lien accepté par l'éditeur : https://… (avec un nom de domaine) ou mailto:adresse. */
export function isAllowedEditorHref(href: string): boolean {
  if (/\s/.test(href) || href.length > 2000) return false;
  if (/^mailto:/i.test(href)) return EMAIL.test(href.slice(7).split("?")[0] ?? "");
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return false;
  }
  return url.protocol === "https:" && url.hostname.includes(".") && !url.username && !url.password;
}

export type LinkCheck = { ok: true; href: string } | { ok: false; message: string };

export const LINK_MESSAGES = {
  empty: "Indiquez l'adresse du lien.",
  http: "Ce lien n'est pas sécurisé (http://). Utilisez l'adresse en https://.",
  invalid: "Adresse non acceptée : un lien doit commencer par https:// (site web) ou être une adresse email.",
} as const;

/**
 * Saisie d'un lien → adresse acceptée. Complète les cas courants :
 * « www.exemple.org » → https://www.exemple.org ; « contact@exemple.org » →
 * mailto:contact@exemple.org. Refuse http://, javascript:, tel:, etc.
 */
export function normalizeLinkInput(input: string): LinkCheck {
  const value = input.trim();
  if (!value) return { ok: false, message: LINK_MESSAGES.empty };
  if (/^http:\/\//i.test(value)) return { ok: false, message: LINK_MESSAGES.http };
  let candidate = value;
  if (EMAIL.test(value)) candidate = `mailto:${value}`;
  else if (!/^[a-z][a-z0-9+.-]*:/i.test(value) && /^[a-z0-9-]+(\.[a-z0-9-]+)+(\/|$|\?|#)/i.test(value)) {
    candidate = `https://${value}`;
  }
  return isAllowedEditorHref(candidate) ? { ok: true, href: candidate } : { ok: false, message: LINK_MESSAGES.invalid };
}

// ---------------------------------------------------------------------------
// Vidéos : YouTube et Facebook uniquement
// ---------------------------------------------------------------------------

export type VideoCheck = { ok: true; provider: "youtube" | "facebook"; url: string } | { ok: false; message: string };

export function checkVideoUrl(input: string): VideoCheck {
  const url = input.trim();
  const provider = videoProviderOf(url);
  if (!provider) {
    return { ok: false, message: "Seules les vidéos YouTube ou Facebook sont acceptées (adresse commençant par https://)." };
  }
  if (provider === "youtube" && !youtubeId(url)) {
    return { ok: false, message: "Cette adresse YouTube n'est pas reconnue : copiez le lien de partage de la vidéo." };
  }
  if (url.length > 500) return { ok: false, message: "Adresse trop longue (500 caractères au plus)." };
  return { ok: true, provider, url };
}

// ---------------------------------------------------------------------------
// Barre d'outils (ordre, libellés, raccourcis)
// ---------------------------------------------------------------------------

export type ToolbarCommand =
  | "paragraph"
  | "heading2"
  | "heading3"
  | "heading4"
  | "bold"
  | "italic"
  | "underline"
  | "bulletList"
  | "orderedList"
  | "blockquote"
  | "link"
  | "unlink"
  | "image"
  | "video"
  | "horizontalRule"
  | "undo"
  | "redo";

export type ToolbarItem = {
  command: ToolbarCommand;
  label: string;
  /** Raccourci clavier annoncé (aria-keyshortcuts) et affiché dans l'infobulle. */
  shortcut?: string;
  /** Bouton à bascule (aria-pressed). */
  toggle?: boolean;
};

export const TOOLBAR_GROUPS: { label: string; items: ToolbarItem[] }[] = [
  {
    label: "Type de texte",
    items: [
      { command: "paragraph", label: "Texte normal", toggle: true, shortcut: "Control+Alt+0" },
      { command: "heading2", label: "Sous-titre", toggle: true, shortcut: "Control+Alt+2" },
      { command: "heading3", label: "Sous-titre de niveau 3", toggle: true, shortcut: "Control+Alt+3" },
      { command: "heading4", label: "Sous-titre de niveau 4", toggle: true, shortcut: "Control+Alt+4" },
    ],
  },
  {
    label: "Mise en forme",
    items: [
      { command: "bold", label: "Gras", toggle: true, shortcut: "Control+B" },
      { command: "italic", label: "Italique", toggle: true, shortcut: "Control+I" },
      { command: "underline", label: "Souligné", toggle: true, shortcut: "Control+U" },
    ],
  },
  {
    label: "Paragraphes",
    items: [
      { command: "bulletList", label: "Liste à puces", toggle: true, shortcut: "Control+Shift+8" },
      { command: "orderedList", label: "Liste numérotée", toggle: true, shortcut: "Control+Shift+7" },
      { command: "blockquote", label: "Citation", toggle: true, shortcut: "Control+Shift+B" },
      { command: "horizontalRule", label: "Ligne de séparation" },
    ],
  },
  {
    label: "Insertion",
    items: [
      { command: "link", label: "Lien", toggle: true },
      { command: "unlink", label: "Retirer le lien" },
      { command: "image", label: "Image de la médiathèque" },
      { command: "video", label: "Vidéo YouTube ou Facebook" },
    ],
  },
  {
    label: "Historique",
    items: [
      { command: "undo", label: "Annuler", shortcut: "Control+Z" },
      { command: "redo", label: "Rétablir", shortcut: "Control+Shift+Z" },
    ],
  },
];

/** Raccourci lisible (« Ctrl+B »). */
export function readableShortcut(shortcut: string): string {
  return shortcut.replace(/Control/g, "Ctrl").replace(/Shift/g, "Maj");
}

/**
 * Bouton suivant de la barre d'outils (navigation au clavier, « tabulation
 * itinérante ») : flèches gauche / droite, Début, Fin. Les boutons désactivés
 * restent atteignables (ils sont annoncés comme indisponibles).
 */
export function nextToolbarIndex(current: number, key: string, count: number): number | null {
  if (count <= 0) return null;
  switch (key) {
    case "ArrowRight":
    case "ArrowDown":
      return (current + 1) % count;
    case "ArrowLeft":
    case "ArrowUp":
      return (current - 1 + count) % count;
    case "Home":
      return 0;
    case "End":
      return count - 1;
    default:
      return null;
  }
}
