/**
 * Rôles de l'administration, dans l'ordre de la base (type SQL app_role) :
 * editor < admin < super_admin. Sans rôle = aucun accès.
 *
 * Aucune dépendance serveur : utilisable dans les tests et les composants.
 */
export type AppRole = "editor" | "admin" | "super_admin";

export const APP_ROLES = ["editor", "admin", "super_admin"] as const satisfies readonly AppRole[];

const RANK: Record<AppRole, number> = { editor: 1, admin: 2, super_admin: 3 };

/** Libellés affichés dans l'interface. */
export const ROLE_LABELS: Record<AppRole, string> = {
  editor: "Éditeur",
  admin: "Administrateur",
  super_admin: "Super administrateur",
};

export function isAppRole(value: unknown): value is AppRole {
  return typeof value === "string" && (APP_ROLES as readonly string[]).includes(value);
}

/** Vrai si `role` donne au moins les droits de `min` (même règle que private.has_role). */
export function roleAtLeast(role: AppRole, min: AppRole): boolean {
  return RANK[role] >= RANK[min];
}

/**
 * Double authentification OBLIGATOIRE pour ces rôles : la base leur refuse
 * tout droit tant que la session n'est pas au niveau aal2
 * (private.current_app_role, migration …100100_accounts_and_roles.sql).
 */
export function requiresMfa(role: AppRole): boolean {
  return roleAtLeast(role, "admin");
}
