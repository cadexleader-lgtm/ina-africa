import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/site-url";

/**
 * Plan du site : pages publiques fixes + contenus PUBLIÉS (domaines actifs,
 * projets, articles, appels aux dons actifs). Les lectures de la base ne
 * renvoient déjà que le contenu public.
 *
 * Aucune date inventée : `lastModified` n'est donné que lorsqu'il est connu.
 * Les pages légales n'y figurent que si leur texte est rédigé.
 */

/** Pages publiques fixes (plan frontend validé, §4.1). */
export const STATIC_PUBLIC_PATHS = [
  "/",
  "/a-propos",
  "/domaines",
  "/projets",
  "/actualites",
  "/galerie",
  "/faire-un-don",
  "/nous-rejoindre/benevole",
  "/nous-rejoindre/membre",
  "/nous-rejoindre/partenaire",
  "/contact",
] as const;

export type SitemapInput = {
  areas: { slug: string }[];
  projects: { slug: string; updatedAt: string | null }[];
  articles: { slug: string; updatedAt: string | null }[];
  campaigns: { slug: string }[];
  /** Pages légales dont le texte est rédigé. */
  legal: { legalNotice: boolean; privacyPolicy: boolean };
};

function validDate(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

/** Date la plus récente d'une liste (pour la page qui liste ces contenus). */
function latest(values: (string | null | undefined)[]): string | undefined {
  const dates = values.map(validDate).filter((value): value is string => Boolean(value));
  return dates.length ? dates.sort().at(-1) : undefined;
}

function entry(path: string, lastModified?: string): MetadataRoute.Sitemap[number] {
  return lastModified ? { url: absoluteUrl(path), lastModified } : { url: absoluteUrl(path) };
}

function contentPath(base: string, slug: string): string {
  return `${base}/${encodeURIComponent(slug)}`;
}

export function buildSitemap(input: SitemapInput): MetadataRoute.Sitemap {
  const listDates: Record<string, string | undefined> = {
    "/actualites": latest(input.articles.map((article) => article.updatedAt)),
    "/projets": latest(input.projects.map((project) => project.updatedAt)),
  };

  const entries: MetadataRoute.Sitemap = [
    ...STATIC_PUBLIC_PATHS.map((path) => entry(path, listDates[path])),
    ...(input.legal.legalNotice ? [entry("/mentions-legales")] : []),
    ...(input.legal.privacyPolicy ? [entry("/politique-de-confidentialite")] : []),
    ...input.areas.map((area) => entry(contentPath("/domaines", area.slug))),
    ...input.projects.map((project) => entry(contentPath("/projets", project.slug), validDate(project.updatedAt))),
    ...input.articles.map((article) => entry(contentPath("/actualites", article.slug), validDate(article.updatedAt))),
    ...input.campaigns.map((campaign) => entry(contentPath("/faire-un-don", campaign.slug))),
  ];

  // Une adresse n'apparaît qu'une fois.
  const seen = new Set<string>();
  return entries.filter((item) => (seen.has(item.url) ? false : (seen.add(item.url), true)));
}
