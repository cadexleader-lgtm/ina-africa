/** Libellés affichés dans les écrans de contenus de l'administration. */

export const ARTICLE_STATUS_LABELS = {
  draft: "Brouillon",
  in_review: "En relecture",
  published: "Publié",
  archived: "Archivé",
} as const;

export const PROJECT_STATUS_LABELS = {
  planned: "Prévu",
  ongoing: "En cours",
  completed: "Terminé",
  archived: "Archivé",
} as const;

export const PARTNER_KIND_LABELS = { partner: "Partenaire", sponsor: "Sponsor" } as const;

export type BadgeTone = "neutral" | "info" | "success" | "warning";

export const ARTICLE_STATUS_TONES: Record<keyof typeof ARTICLE_STATUS_LABELS, BadgeTone> = {
  draft: "neutral",
  in_review: "warning",
  published: "success",
  archived: "info",
};

export const MEDIA_FOLDER_LABELS = {
  articles: "Articles",
  projets: "Projets",
  domaines: "Domaines",
  partenaires: "Partenaires",
  equipe: "Équipe",
  galerie: "Galerie",
  appels: "Appels aux dons",
  site: "Site (accueil)",
  divers: "Divers",
} as const;

export type PublicMediaFolder = keyof typeof MEDIA_FOLDER_LABELS;

/** Taille de fichier lisible (« 1,2 Mo »). */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024).toLocaleString("fr-FR")} ko`;
  return `${(bytes / 1024 / 1024).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} Mo`;
}
