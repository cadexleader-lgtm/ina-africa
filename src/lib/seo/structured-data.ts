import { ORG } from "@/content/fr/site";
import { absoluteMediaUrl } from "@/lib/seo/metadata";
import { collapseWhitespace, countWords, metaDescription } from "@/lib/seo/text";
import { absoluteUrl } from "@/lib/site-url";
import type { Article, SiteSettings } from "@/lib/types/content";

/**
 * Données structurées (schema.org) pour Google, à afficher avec <JsonLd>.
 *
 * Règle : uniquement des faits vérifiés ou saisis par l'ONG. Jamais de note,
 * d'avis ni de chiffre inventé ; un champ non renseigné est omis.
 */

type JsonLdObject = Record<string, unknown>;

const CONTEXT = "https://schema.org";

/** Identifiant stable de l'organisation, réutilisé par les articles (auteur, éditeur). */
export function organizationId(): string {
  return absoluteUrl("/#organisation");
}

export function websiteId(): string {
  return absoluteUrl("/#site");
}

/** Faits établis : nom, nom complet, création en 2017, au Bénin, logo officiel. */
export const ORG_FACTS = {
  foundingDate: "2017",
  /** Code ISO 3166-1 du Bénin. */
  country: "BJ",
  /** Logo officiel fourni par l'ONG (public/brand/). */
  logoPath: "/brand/ina-africa-logo.png",
} as const;

function logoUrl(): string {
  return absoluteUrl(ORG_FACTS.logoPath);
}

/** Retire les champs vides (null, undefined, "", tableau vide). */
function compact<T extends JsonLdObject>(object: T): T {
  return Object.fromEntries(
    Object.entries(object).filter(
      ([, value]) => value !== null && value !== undefined && value !== "" && !(Array.isArray(value) && value.length === 0),
    ),
  ) as T;
}

/**
 * L'ONG (type NGO) : seulement les coordonnées et réseaux RÉELLEMENT renseignés
 * dans les paramètres du site.
 */
export function organizationJsonLd(
  settings: Pick<SiteSettings, "address" | "contactEmail" | "contactPhone" | "socialLinks">,
): JsonLdObject {
  const sameAs = Object.values(settings.socialLinks ?? {}).filter((href) => /^https:\/\//.test(href));
  const address = settings.address ? collapseWhitespace(settings.address.replace(/\n+/g, ", ")) : null;
  return compact({
    "@type": "NGO",
    "@id": organizationId(),
    name: ORG.name,
    alternateName: ORG.fullName,
    url: absoluteUrl("/"),
    logo: logoUrl(),
    foundingDate: ORG_FACTS.foundingDate,
    address: compact({ "@type": "PostalAddress", streetAddress: address, addressCountry: ORG_FACTS.country }),
    email: settings.contactEmail,
    telephone: settings.contactPhone,
    sameAs,
  });
}

/** Le site (nom affiché par Google dans les résultats). */
export function websiteJsonLd(): JsonLdObject {
  return {
    "@type": "WebSite",
    "@id": websiteId(),
    url: absoluteUrl("/"),
    name: ORG.name,
    alternateName: ORG.fullName,
    inLanguage: "fr-FR",
    publisher: { "@id": organizationId() },
  };
}

/** Accueil : l'organisation et le site, dans un seul bloc. */
export function homeJsonLd(settings: Parameters<typeof organizationJsonLd>[0]): JsonLdObject {
  return { "@context": CONTEXT, "@graph": [organizationJsonLd(settings), websiteJsonLd()] };
}

export type BreadcrumbEntry = { name: string; path: string };

/** Fil d'Ariane (mêmes étapes que le fil d'Ariane affiché), adresses absolues. */
export function breadcrumbJsonLd(items: BreadcrumbEntry[]): JsonLdObject {
  return {
    "@context": CONTEXT,
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

/** Google conseille un titre d'article de 110 caractères au plus. */
const HEADLINE_MAX = 110;

/** Article publié : publié par INA-AFRICA (aucune donnée personnelle d'auteur). */
export function articleJsonLd(
  article: Pick<
    Article,
    "slug" | "title" | "excerpt" | "seoDescription" | "contentText" | "publishedAt" | "updatedAt" | "cover" | "category"
  >,
): JsonLdObject {
  const url = absoluteUrl(`/actualites/${article.slug}`);
  const organization = { "@type": "NGO", "@id": organizationId(), name: ORG.name, url: absoluteUrl("/"), logo: logoUrl() };
  const description = article.seoDescription ?? article.excerpt ?? article.contentText;
  const words = countWords(article.contentText);
  return compact({
    "@context": CONTEXT,
    "@type": "Article",
    "@id": `${url}#article`,
    headline: metaDescription(article.title, HEADLINE_MAX),
    description: description ? metaDescription(description) : null,
    image: article.cover ? [absoluteMediaUrl(article.cover.path)] : null,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt ?? article.publishedAt,
    author: organization,
    publisher: organization,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
    articleSection: article.category?.name,
    inLanguage: "fr-FR",
    wordCount: words > 0 ? words : null,
    isPartOf: { "@id": websiteId() },
  });
}
