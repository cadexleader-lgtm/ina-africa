import { roleAtLeast, type AppRole } from "@/server/auth/roles";

/**
 * Menu de l'espace d'administration, selon le rôle (lu sur le serveur) :
 *  - editor      : Tableau de bord, Articles, Médias ;
 *  - admin       : tout sauf Comptes ;
 *  - super_admin : tout.
 * Le menu ne protège rien : chaque page appelle requireAdminPage(rôle).
 */

export type AdminNavIcon =
  | "dashboard"
  | "articles"
  | "categories"
  | "projects"
  | "areas"
  | "gallery"
  | "partners"
  | "team"
  | "campaigns"
  | "donations"
  | "requests"
  | "newsletter"
  | "media"
  | "settings"
  | "accounts";

export type AdminNavItem = {
  href: string;
  label: string;
  icon: AdminNavIcon;
  /** Rôle minimal pour voir le lien. */
  min: AppRole;
};

export type AdminNavGroup = { label: string | null; items: AdminNavItem[] };

export const ADMIN_NAV: AdminNavGroup[] = [
  {
    label: null,
    items: [{ href: "/admin", label: "Tableau de bord", icon: "dashboard", min: "editor" }],
  },
  {
    label: "Contenus",
    items: [
      { href: "/admin/articles", label: "Articles", icon: "articles", min: "editor" },
      { href: "/admin/categories", label: "Catégories", icon: "categories", min: "admin" },
      { href: "/admin/projets", label: "Projets", icon: "projects", min: "admin" },
      { href: "/admin/domaines", label: "Domaines", icon: "areas", min: "admin" },
      { href: "/admin/galerie", label: "Galerie", icon: "gallery", min: "admin" },
      { href: "/admin/partenaires", label: "Partenaires", icon: "partners", min: "admin" },
      { href: "/admin/equipe", label: "Équipe", icon: "team", min: "admin" },
      { href: "/admin/medias", label: "Médias", icon: "media", min: "editor" },
    ],
  },
  {
    label: "Dons et contacts",
    items: [
      { href: "/admin/appels-aux-dons", label: "Appels aux dons", icon: "campaigns", min: "admin" },
      { href: "/admin/dons", label: "Dons", icon: "donations", min: "admin" },
      { href: "/admin/demandes", label: "Demandes", icon: "requests", min: "admin" },
      { href: "/admin/newsletter", label: "Newsletter", icon: "newsletter", min: "admin" },
    ],
  },
  {
    label: "Réglages",
    items: [
      { href: "/admin/parametres", label: "Paramètres", icon: "settings", min: "admin" },
      { href: "/admin/comptes", label: "Comptes", icon: "accounts", min: "super_admin" },
    ],
  },
];

/** Groupes du menu visibles pour un rôle (les groupes vides sont retirés). */
export function adminNavFor(role: AppRole): AdminNavGroup[] {
  return ADMIN_NAV.map((group) => ({ ...group, items: group.items.filter((item) => roleAtLeast(role, item.min)) })).filter(
    (group) => group.items.length > 0,
  );
}

/** Lien actif : l'adresse exacte, ou une sous-page (sauf le tableau de bord, exact seulement). */
export function isActiveNavHref(href: string, pathname: string | null): boolean {
  if (!pathname) return false;
  const path = pathname.replace(/\/+$/, "") || "/";
  if (href === "/admin") return path === "/admin";
  return path === href || path.startsWith(`${href}/`);
}
