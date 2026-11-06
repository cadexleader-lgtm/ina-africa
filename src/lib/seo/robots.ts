import type { MetadataRoute } from "next";

import { isSiteIndexable } from "@/lib/seo/indexing";
import { absoluteUrl } from "@/lib/site-url";

/** Parties du site jamais explorées : administration, page de travail du design system. */
export const PRIVATE_PATHS = ["/admin", "/styleguide"] as const;

/**
 * Contenu de robots.txt.
 *  - Site en construction (SITE_INDEXABLE ≠ "true") : tout est interdit, aucun plan du site annoncé.
 *  - Site en ligne : site public autorisé, parties privées interdites, plan du site annoncé.
 */
export function robotsRules(indexable: boolean = isSiteIndexable()): MetadataRoute.Robots {
  if (!indexable) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: { userAgent: "*", allow: "/", disallow: [...PRIVATE_PATHS] },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
