/**
 * Étiquettes de cache. Chaque lecture publique est mise en cache avec ses
 * étiquettes ; chaque action d'administration qui modifie un contenu appelle
 * `updateTag(TAGS.xxx)` pour que le site affiche aussitôt la nouvelle version.
 */
export const TAGS = {
  settings: "site-settings",
  areas: "action-areas",
  projects: "projects",
  project: (slug: string) => `project:${slug}`,
  articles: "articles",
  article: (slug: string) => `article:${slug}`,
  categories: "article-categories",
  gallery: "gallery",
  team: "team",
  partners: "partners",
  campaigns: "campaigns",
  campaign: (slug: string) => `campaign:${slug}`,
  /** Jauges des appels aux dons (changent à chaque don confirmé). */
  campaignProgress: "campaign-progress",
} as const;
