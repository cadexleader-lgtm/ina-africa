import type { MetadataRoute } from "next";

import { isEmptyDoc } from "@/lib/validation/rich-text";
import { buildSitemap } from "@/lib/seo/sitemap";
import { listArticleSlugs } from "@/server/data/articles";
import { listActiveCampaigns } from "@/server/data/campaigns";
import { listProjectSlugs } from "@/server/data/projects";
import { getSiteSettings, listActionAreas } from "@/server/data/site";

/**
 * Plan du site (/sitemap.xml), régénéré avec le cache des contenus : pages
 * fixes + contenus publiés, adresses absolues (voir src/lib/seo/sitemap.ts).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [areas, projects, articles, campaigns, settings] = await Promise.all([
    listActionAreas(),
    listProjectSlugs(),
    listArticleSlugs(),
    listActiveCampaigns(),
    getSiteSettings(),
  ]);

  return buildSitemap({
    areas,
    projects,
    articles,
    campaigns,
    legal: {
      legalNotice: !isEmptyDoc(settings.legalNotice),
      privacyPolicy: !isEmptyDoc(settings.privacyPolicy),
    },
  });
}
