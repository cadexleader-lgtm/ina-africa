import type { MetadataRoute } from "next";

import { robotsRules } from "@/lib/seo/robots";

/** Administration et liens de connexion reçus par email : jamais explorés. */
export const ADMIN_DISALLOWED_PATHS = ["/admin", "/auth"] as const;

type RobotsRule = { disallow?: string | string[] };

function withAdminDisallowed<Rule extends RobotsRule>(rule: Rule): Rule {
  const current = rule.disallow === undefined ? [] : Array.isArray(rule.disallow) ? rule.disallow : [rule.disallow];
  // « Disallow: / » couvre déjà tout le site (site en construction).
  if (current.includes("/")) return rule;
  return { ...rule, disallow: [...new Set([...current, ...ADMIN_DISALLOWED_PATHS])] };
}

/** Contenu de robots.txt avec l'administration toujours interdite. */
export function robotsWithAdmin(base: MetadataRoute.Robots): MetadataRoute.Robots {
  const rules = Array.isArray(base.rules) ? base.rules.map(withAdminDisallowed) : withAdminDisallowed(base.rules);
  return { ...base, rules };
}

/**
 * robots.txt : tout est interdit tant que SITE_INDEXABLE ne vaut pas "true"
 * (site en construction) ; ensuite, site public autorisé et plan du site
 * annoncé (voir src/lib/seo/robots.ts), administration (/admin, /auth) interdite.
 */
export default function robots(): MetadataRoute.Robots {
  return robotsWithAdmin(robotsRules());
}
