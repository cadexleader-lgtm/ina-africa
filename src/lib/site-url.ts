/**
 * Adresse publique du site (NEXT_PUBLIC_SITE_URL), pour les liens absolus :
 * partage, données structurées, plan du site, emails.
 * En développement sans configuration : http://localhost:3000.
 */
export function siteOrigin(): string {
  const value = process.env.NEXT_PUBLIC_SITE_URL;
  try {
    if (value) return new URL(value).origin;
  } catch {
    // adresse mal formée : valeur par défaut ci-dessous
  }
  return "http://localhost:3000";
}

/** Adresse absolue d'un chemin du site (« /actualites/x » → « https://…/actualites/x »). */
export function absoluteUrl(path = "/"): string {
  return new URL(path.startsWith("/") ? path : `/${path}`, siteOrigin()).toString();
}
