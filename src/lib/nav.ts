/**
 * Vrai si le lien `href` correspond à la page courante : égalité stricte pour
 * l'accueil, sinon la page elle-même ou une de ses sous-pages
 * (/projets/mon-projet active « Nos projets »).
 */
export function isActivePath(pathname: string | null | undefined, href: string): boolean {
  if (!pathname) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
