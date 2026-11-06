/**
 * Adresse publique du site, pour les liens absolus : partage, données
 * structurées, plan du site, emails.
 *
 * Ordre de choix (le premier valide l'emporte) :
 *  1. NEXT_PUBLIC_SITE_URL (adresse officielle, à renseigner pour la production) ;
 *  2. sur Vercel, les adresses fournies automatiquement :
 *     - production : VERCEL_PROJECT_PRODUCTION_URL (« ina-africa.vercel.app »,
 *       puis le nom de domaine personnalisé dès qu'il est ajouté) ;
 *     - prévisualisation : VERCEL_BRANCH_URL, sinon VERCEL_URL ;
 *  3. http://localhost:3000 (développement, build local sans configuration).
 *
 * Jamais d'erreur : une valeur absente ou mal formée passe à la suivante, le
 * build ne casse pas. next.config.ts fige le résultat au moment du build
 * (dans NEXT_PUBLIC_SITE_URL) pour que le serveur et le navigateur voient la
 * même adresse.
 *
 * Ce fichier est aussi importé par next.config.ts : pas d'alias « @/ » ici.
 */

type Env = Record<string, string | undefined>;

export const LOCAL_SITE_URL = "http://localhost:3000";

/** Origine (https://hôte) d'une adresse complète ou d'un simple nom d'hôte (variables Vercel), ou null. */
function toOrigin(value: string | undefined): string | null {
  const raw = value?.trim();
  if (!raw) return null;
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(withScheme);
    return url.protocol === "https:" || url.protocol === "http:" ? url.origin : null;
  } catch {
    return null;
  }
}

/** Adresse du site choisie selon l'ordre ci-dessus (origine, sans barre finale). */
export function resolveSiteOrigin(env: Env): string {
  const explicit = toOrigin(env.NEXT_PUBLIC_SITE_URL);
  if (explicit) return explicit;

  const vercelCandidates =
    env.VERCEL_ENV === "production"
      ? [env.VERCEL_PROJECT_PRODUCTION_URL, env.VERCEL_URL]
      : [env.VERCEL_BRANCH_URL, env.VERCEL_URL];
  for (const candidate of vercelCandidates) {
    const origin = toOrigin(candidate);
    if (origin) return origin;
  }

  return LOCAL_SITE_URL;
}

/** Adresse publique du site (origine, sans barre finale). */
export function siteOrigin(): string {
  // Lectures directes : Next.js remplace NEXT_PUBLIC_SITE_URL au build dans le
  // code envoyé au navigateur (les variables VERCEL_* n'y existent pas).
  return resolveSiteOrigin({
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    VERCEL_ENV: process.env.VERCEL_ENV,
    VERCEL_PROJECT_PRODUCTION_URL: process.env.VERCEL_PROJECT_PRODUCTION_URL,
    VERCEL_BRANCH_URL: process.env.VERCEL_BRANCH_URL,
    VERCEL_URL: process.env.VERCEL_URL,
  });
}

/** Adresse absolue d'un chemin du site (« /actualites/x » → « https://…/actualites/x »). */
export function absoluteUrl(path = "/"): string {
  return new URL(path.startsWith("/") ? path : `/${path}`, siteOrigin()).toString();
}
