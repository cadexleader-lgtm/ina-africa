/**
 * Fonctions PURES des pages institutionnelles et de projets (aucun accès aux
 * données, aucun React) : lecture et validation des paramètres d'adresse,
 * découpage des textes de l'administration, formats d'affichage.
 * Testées dans tests/unit/pages-helpers.test.ts.
 */
import { PAGES } from "@/content/fr/pages";
import { formatDate } from "@/lib/format";
import type { SearchParamsRecord } from "@/lib/pagination";
import type { GalleryItem, ProjectStatus } from "@/lib/types/content";
import { absoluteUrl } from "@/lib/site-url";

// ---------------------------------------------------------------------------
// Paramètres d'adresse
// ---------------------------------------------------------------------------

/** Première valeur d'un paramètre (`?a=1&a=2` → "1"), sans espaces ; vide → undefined. */
export function firstParam(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  const trimmed = raw?.trim();
  return trimmed ? trimmed : undefined;
}

/** Numéro de page valide (entier ≥ 1). Tout le reste (absent, « abc », « 0 », « -2 », « 1.5 ») → 1. */
export function parsePage(value: string | string[] | undefined): number {
  const raw = firstParam(value);
  if (!raw || !/^\d{1,6}$/.test(raw)) return 1;
  const page = Number(raw);
  return page >= 1 ? page : 1;
}

/** États proposés au filtre (les projets archivés ne sont jamais listés). */
export type PublicProjectStatus = Exclude<ProjectStatus, "archived">;
export const PUBLIC_PROJECT_STATUSES: readonly PublicProjectStatus[] = ["planned", "ongoing", "completed"];

export function isPublicProjectStatus(value: string | undefined): value is PublicProjectStatus {
  return (PUBLIC_PROJECT_STATUSES as readonly string[]).includes(value ?? "");
}

/** Noms des paramètres d'adresse de la liste des projets. */
export const PROJECT_PARAMS = { area: "domaine", status: "statut", page: "page" } as const;

export type ProjectListFilters = {
  /** Adresse d'un domaine ACTIF (sinon absent). */
  area?: string;
  status?: PublicProjectStatus;
  page: number;
};

/**
 * Lit les filtres de /projets. Un domaine inconnu (ou non publié) et un état
 * inconnu sont IGNORÉS : la liste s'affiche sans ce filtre.
 */
export function parseProjectFilters(searchParams: SearchParamsRecord, areaSlugs: readonly string[]): ProjectListFilters {
  const area = firstParam(searchParams[PROJECT_PARAMS.area]);
  const status = firstParam(searchParams[PROJECT_PARAMS.status]);
  return {
    area: area && areaSlugs.includes(area) ? area : undefined,
    status: isPublicProjectStatus(status) ? status : undefined,
    page: parsePage(searchParams[PROJECT_PARAMS.page]),
  };
}

/** Paramètres VALIDES à conserver dans les liens (pagination), sans la page. */
export function projectFilterParams(filters: Pick<ProjectListFilters, "area" | "status">): SearchParamsRecord {
  return {
    [PROJECT_PARAMS.area]: filters.area,
    [PROJECT_PARAMS.status]: filters.status,
  };
}

/**
 * Adresse de la liste des projets pour une combinaison de filtres (retour à la
 * page 1, qui n'a pas de paramètre). `null` retire le filtre.
 */
export function projectsHref(filters: { area?: string | null; status?: PublicProjectStatus | null }): string {
  const params = new URLSearchParams();
  if (filters.area) params.set(PROJECT_PARAMS.area, filters.area);
  if (filters.status) params.set(PROJECT_PARAMS.status, filters.status);
  const query = params.toString();
  return query ? `/projets?${query}` : "/projets";
}

export function hasActiveFilter(filters: Pick<ProjectListFilters, "area" | "status">): boolean {
  return Boolean(filters.area || filters.status);
}

// ---------------------------------------------------------------------------
// Textes de l'administration
// ---------------------------------------------------------------------------

/** Paragraphes d'un texte (séparés par une ligne vide). Les retours à la ligne simples restent dans le paragraphe. */
export function paragraphs(text: string | null | undefined): string[] {
  return (text ?? "")
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);
}

/**
 * Sépare « Terme : explication » (ou « Terme — explication ») pour mettre le
 * terme en valeur. Sans séparateur, toute la ligne est le terme.
 */
export function splitTerm(line: string): { term: string; description: string | null } {
  const match = line.match(/^(.{1,60}?)\s*(?: ?:|\s[—–-])\s+(.+)$/);
  if (!match) return { term: line.trim(), description: null };
  return { term: match[1].trim(), description: match[2].trim() };
}

/** Initiales d'un nom (« Awa Dossou-Yovo » → « AD »), au plus deux lettres. */
export function initials(fullName: string): string {
  const words = fullName
    .trim()
    .split(/[\s-]+/)
    .filter((word) => /\p{L}/u.test(word));
  if (words.length === 0) return "";
  const letters = words.length === 1 ? [words[0]] : [words[0], words[words.length - 1]];
  return letters.map((word) => (word.match(/\p{L}/u)?.[0] ?? "").toLocaleUpperCase("fr-FR")).join("");
}

/** Extrait pour les métadonnées : coupé sur un mot, « … » ajouté, espaces normalisés. */
export function excerpt(text: string | null | undefined, max = 160): string | null {
  const clean = (text ?? "").replace(/\s+/g, " ").trim();
  if (!clean) return null;
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:.–—-]+$/, "")}…`;
}

/**
 * Fonds alternés des sections d'une page, dans l'ordre : blanc / ivoire, en
 * partant de l'opposé de `previous` (l'en-tête des pages est ivoire). Les
 * sections de `brandIds` sont sur fond bleu ; la suivante repart sur blanc.
 */
export function alternateTones(
  ids: readonly string[],
  brandIds: readonly string[] = [],
  previous: "white" | "ivory" | "brand" = "ivory",
): Record<string, "white" | "ivory" | "brand"> {
  const tones: Record<string, "white" | "ivory" | "brand"> = {};
  let last = previous;
  for (const id of ids) {
    last = brandIds.includes(id) ? "brand" : last === "white" ? "ivory" : "white";
    tones[id] = last;
  }
  return tones;
}

// ---------------------------------------------------------------------------
// Projets
// ---------------------------------------------------------------------------

/** Libellé de l'état d'un projet public (« À venir », « En cours », « Terminé »). */
export function projectStatusLabel(status: ProjectStatus): string | null {
  return isPublicProjectStatus(status) ? PAGES.project.status[status] : null;
}

/**
 * Période d'un projet en toutes lettres :
 * « Du 5 mars 2025 au 30 juin 2025 », « Depuis le … » (commencé),
 * « À partir du … » (prévu), « Jusqu'au … ». null si aucune date.
 */
export function projectPeriod(start: string | null, end: string | null, status: ProjectStatus): string | null {
  const from = formatDate(start);
  const to = formatDate(end);
  if (from && to) return from === to ? from : PAGES.period.range(from, to);
  if (from) return status === "planned" ? PAGES.period.from(from) : PAGES.period.since(from);
  if (to) return PAGES.period.until(to);
  return null;
}

// ---------------------------------------------------------------------------
// Visionneuse
// ---------------------------------------------------------------------------

/** Texte lu à chaque changement d'élément : « Photo 3 sur 12 : <texte alternatif ou légende> ». */
export function viewerAnnouncement(item: GalleryItem, index: number, total: number): string {
  const kind = item.type === "photo" ? PAGES.viewer.photo : PAGES.viewer.video;
  const label = item.type === "photo" ? item.image.alt || item.caption : item.caption;
  return `${kind} ${PAGES.viewer.position(index + 1, total)}${label ? ` : ${label}` : ""}`;
}

/** Indice circulaire (après le dernier élément vient le premier). */
export function wrapIndex(index: number, length: number): number {
  if (length <= 0) return 0;
  return ((index % length) + length) % length;
}

// ---------------------------------------------------------------------------
// Données structurées
// ---------------------------------------------------------------------------

export type Crumb = { label: string; href: string };

/** BreadcrumbList (schema.org) : adresses absolues, du plus général au plus précis. */
export function breadcrumbJsonLd(items: Crumb[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      item: absoluteUrl(item.href),
    })),
  };
}
