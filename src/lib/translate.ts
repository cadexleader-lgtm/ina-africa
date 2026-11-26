/**
 * Traduction automatique du site par Google Traduction (choix de l'ONG, 26/11/2026).
 *
 * Le site est écrit en français. Le bouton « EN » de l'en-tête pose le cookie
 * `googtrans=/fr/en` (celui que lit le module Google) puis charge le script de
 * Google ; « FR » efface ce cookie et recharge la page (texte d'origine).
 * Le script Google n'est JAMAIS chargé tant que le visiteur reste en français.
 */

export type SiteLanguage = "fr" | "en";

export const TRANSLATE_COOKIE = "googtrans";
/** Valeur du cookie pour l'anglais (langue d'origine / langue voulue). */
export const ENGLISH_COOKIE_VALUE = "/fr/en";
/** Évènement interne émis quand la langue change (même onglet). */
export const LANGUAGE_EVENT = "ina-africa:language";

/** Langue demandée d'après les cookies du navigateur (français par défaut). */
export function languageFromCookie(cookie: string): SiteLanguage {
  const match = cookie.match(/(?:^|;\s*)googtrans=([^;]*)/);
  if (!match) return "fr";
  let value = match[1] ?? "";
  try {
    value = decodeURIComponent(value);
  } catch {
    return "fr";
  }
  return /^\/[a-z-]+\/en$/i.test(value.trim()) ? "en" : "fr";
}

/**
 * Domaines sur lesquels Google a pu poser le cookie : sans domaine (cookie de
 * l'adresse exacte), puis « .adresse » et chaque domaine parent. Il faut tous
 * les effacer pour revenir au français.
 */
export function cookieDomains(hostname: string): (string | null)[] {
  const domains: (string | null)[] = [null];
  if (!hostname || hostname === "localhost" || /^[\d.]+$/.test(hostname) || hostname.includes(":")) return domains;
  const parts = hostname.split(".");
  for (let i = 0; i <= parts.length - 2; i++) domains.push(`.${parts.slice(i).join(".")}`);
  return domains;
}
