import type { Metadata } from "next";

import { ORG } from "@/content/fr/site";
import { mediaUrl } from "@/lib/media";
import { pageRobots } from "@/lib/seo/indexing";
import { metaDescription } from "@/lib/seo/text";
import { absoluteUrl } from "@/lib/site-url";
import type { ImageRef } from "@/lib/types/content";

/**
 * Métadonnées d'une page publique (titre, description, adresse canonique,
 * Open Graph, carte de partage, robots) construites d'une seule façon pour
 * tout le site.
 *
 * Exemple (page fixe) :
 *   export const metadata = pageMetadata({ title: "Contact", description: "…", path: "/contact" });
 * Exemple (contenu) :
 *   return pageMetadata({ title: article.seoTitle ?? article.title, description, path: `/actualites/${slug}`,
 *     type: "article", image: shareImage(article.cover), publishedTime: article.publishedAt });
 */

export type ShareImage = { url: string; alt: string };

export type PageMetadataInput = {
  /** Titre de la page ; le gabarit du layout ajoute « — INA-AFRICA ». */
  title: string;
  /** Titre complet utilisé tel quel (sans gabarit), ex. l'accueil. */
  absoluteTitle?: boolean;
  /** Description : nettoyée et coupée à 160 caractères. */
  description: string;
  /** Chemin canonique (« /actualites/mon-article », paramètres compris si besoin). */
  path: string;
  type?: "website" | "article";
  /** Image de partage RÉELLE (jamais de photo provisoire) : voir shareImage(). */
  image?: ShareImage | null;
  /** Article : dates ISO et rubrique. */
  publishedTime?: string | null;
  modifiedTime?: string | null;
  section?: string | null;
  /** Page à ne pas indexer (recherche, liste vide, contenu non rédigé). */
  noindex?: boolean;
};

/** Adresse ABSOLUE d'une image de la médiathèque (aperçus de partage, données structurées). */
export function absoluteMediaUrl(path: string): string {
  const url = mediaUrl(path);
  return /^https?:\/\//i.test(url) ? url : absoluteUrl(url);
}

/**
 * Image de partage à partir d'une image de contenu (couverture d'article, de
 * projet, d'appel aux dons). Ne JAMAIS y passer une photo provisoire.
 */
export function shareImage(image: ImageRef | null | undefined): ShareImage | null {
  return image ? { url: absoluteMediaUrl(image.path), alt: image.alt } : null;
}

export function pageMetadata(input: PageMetadataInput): Metadata {
  const url = absoluteUrl(input.path);
  const description = metaDescription(input.description);
  const images = input.image ? [{ url: input.image.url, alt: input.image.alt }] : undefined;
  const common = {
    locale: "fr_FR",
    siteName: ORG.name,
    title: input.title,
    description,
    url,
    images,
  };

  return {
    title: input.absoluteTitle ? { absolute: input.title } : input.title,
    description,
    alternates: { canonical: url },
    robots: pageRobots({ noindex: input.noindex }),
    openGraph:
      input.type === "article"
        ? {
            ...common,
            type: "article",
            publishedTime: input.publishedTime ?? undefined,
            modifiedTime: input.modifiedTime ?? undefined,
            section: input.section ?? undefined,
          }
        : { ...common, type: "website" },
    twitter: {
      card: images ? "summary_large_image" : "summary",
      title: input.title,
      description,
      images: images?.map((image) => image.url),
    },
  };
}
