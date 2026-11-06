import type { MetadataRoute } from "next";

import { robotsRules } from "@/lib/seo/robots";

/**
 * robots.txt : tout est interdit tant que SITE_INDEXABLE ne vaut pas "true"
 * (site en construction) ; ensuite, site public autorisé et plan du site
 * annoncé (voir src/lib/seo/robots.ts).
 */
export default function robots(): MetadataRoute.Robots {
  return robotsRules();
}
