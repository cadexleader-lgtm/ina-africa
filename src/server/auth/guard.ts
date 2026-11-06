import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { hasPublicSupabaseEnv } from "@/lib/public-env";
import { ADMIN_LOGIN_PATH, safeAdminPath, withSuite } from "@/lib/validation/auth";
import { fail, ok, type ActionResult } from "@/server/errors";
import { createSessionClient } from "@/server/supabase/server";

import { isAppRole, requiresMfa, roleAtLeast, type AppRole } from "./roles";

export { roleAtLeast, type AppRole } from "./roles";

/**
 * Garde de l'ADMINISTRATION (Phase 2). Contrat utilisé par les pages et les
 * Server Actions de l'administration :
 *  - getAdminSession()   : session complète ou null ;
 *  - requireAdminPage()  : pour une page, redirige si besoin ;
 *  - authorize()         : pour une Server Action, ActionResult.
 *
 * Toujours `auth.getUser()` (vérifié par Supabase Auth), jamais
 * `getSession()` seul. Le rôle est lu avec le client de session (RLS : chacun
 * lit son propre rôle). La base revérifie tout (private.has_role).
 */

export type AdminSession = {
  userId: string;
  email: string;
  fullName: string;
  role: AppRole;
  /** Session validée par le second facteur (aal2). */
  mfaVerified: boolean;
};

/** Adresses du parcours de connexion. */
export const AUTH_PATHS = {
  login: ADMIN_LOGIN_PATH,
  verify: "/admin/verification",
  enrollMfa: "/admin/securite/double-authentification",
  forbidden: "/admin/acces-refuse",
  /** Déconnecte un compte sans rôle puis renvoie à la connexion avec un message. */
  noAccess: "/auth/sans-acces",
} as const;

/** En-tête posé par le proxy (src/proxy.ts) : adresse demandée, pour `?suite=`. */
export const ADMIN_PATH_HEADER = "x-ina-admin-path";

/** État d'authentification de la personne qui fait la requête. */
export type AuthState =
  | { kind: "unconfigured" }
  | { kind: "anonymous" }
  | { kind: "no_role"; userId: string; email: string }
  | {
      kind: "signed_in";
      userId: string;
      email: string;
      fullName: string;
      role: AppRole;
      aal: "aal1" | "aal2";
      /** Au moins un facteur TOTP vérifié. */
      hasVerifiedFactor: boolean;
      /** Identifiant du facteur TOTP vérifié à utiliser pour la vérification. */
      verifiedFactorId: string | null;
    };

type SessionClient = Awaited<ReturnType<typeof createSessionClient>>;

/**
 * Lit l'état d'authentification avec un client donné, SANS cache (à utiliser
 * dans une Server Action juste après une connexion ou une vérification).
 * Lève une erreur si la base ne répond pas (jamais « pas de rôle » par erreur).
 */
export async function readAuthState(supabase: SessionClient): Promise<AuthState> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData?.user;
  if (userError || !user) return { kind: "anonymous" };

  const [aalResult, roleResult, profileResult] = await Promise.all([
    supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
    supabase.from("user_roles").select("role").eq("user_id", user.id).maybeSingle(),
    supabase.from("profiles").select("full_name, email").eq("id", user.id).maybeSingle(),
  ]);

  if (roleResult.error) {
    throw new Error(`[ina-africa] lecture du rôle impossible : ${roleResult.error.message}`);
  }

  const email = (user.email ?? "").toLowerCase();
  const role: unknown = roleResult.data?.role;
  if (!isAppRole(role)) return { kind: "no_role", userId: user.id, email };

  // Le niveau vient du jeton que getUser() vient de faire vérifier par Supabase Auth.
  const aal = aalResult.data?.currentLevel === "aal2" ? "aal2" : "aal1";
  // Facteurs à jour (getUser) plutôt que ceux, éventuellement anciens, du cookie.
  const verifiedTotp = (user.factors ?? []).filter((factor) => factor.factor_type === "totp" && factor.status === "verified");

  const profile = profileResult.data as { full_name?: unknown; email?: unknown } | null;
  const fullName = typeof profile?.full_name === "string" && profile.full_name.trim() ? profile.full_name.trim() : email;

  return {
    kind: "signed_in",
    userId: user.id,
    email,
    fullName,
    role,
    aal,
    hasVerifiedFactor: verifiedTotp.length > 0,
    verifiedFactorId: verifiedTotp[0]?.id ?? null,
  };
}

/** État d'authentification, mis en cache pour la requête (React cache). */
export const getAuthState = cache(async (): Promise<AuthState> => {
  if (!hasPublicSupabaseEnv()) return { kind: "unconfigured" };
  return readAuthState(await createSessionClient());
});

/** Session complète à partir d'un état (null si incomplète). */
export function sessionFromState(state: AuthState): AdminSession | null {
  if (state.kind !== "signed_in") return null;
  if (requiresMfa(state.role) && state.aal !== "aal2") return null;
  return {
    userId: state.userId,
    email: state.email,
    fullName: state.fullName,
    role: state.role,
    mfaVerified: state.aal === "aal2",
  };
}

/**
 * Mise en cache par requête (React cache). null : pas connecté, pas de rôle,
 * ou admin/super_admin sans aal2.
 */
export const getAdminSession = cache(async (): Promise<AdminSession | null> => {
  return sessionFromState(await getAuthState());
});

/**
 * Prochaine étape du parcours pour un état donné (null : accès accordé).
 * Un compte qui a activé la double authentification la valide à chaque
 * connexion, quel que soit son rôle.
 */
export function nextAuthStep(state: AuthState, suite: string | null): string | null {
  switch (state.kind) {
    case "unconfigured":
    case "anonymous":
      return withSuite(AUTH_PATHS.login, suite);
    case "no_role":
      return AUTH_PATHS.noAccess;
    case "signed_in":
      if (state.hasVerifiedFactor && state.aal !== "aal2") return withSuite(AUTH_PATHS.verify, suite);
      if (!state.hasVerifiedFactor && requiresMfa(state.role)) return withSuite(AUTH_PATHS.enrollMfa, suite);
      return null;
  }
}

async function requestedAdminPath(): Promise<string | null> {
  return safeAdminPath((await headers()).get(ADMIN_PATH_HEADER));
}

/**
 * Pour les pages : redirige vers connexion / vérification / activation MFA ;
 * affiche un refus (page /admin/acces-refuse) si le rôle est insuffisant.
 * Les pages qui l'appellent exportent `instant = false` (lecture de la requête).
 */
export async function requireAdminPage(min: AppRole): Promise<AdminSession> {
  const state = await getAuthState();
  const step = nextAuthStep(state, await requestedAdminPath());
  if (step) redirect(step);

  const session = sessionFromState(state);
  if (!session) redirect(AUTH_PATHS.login);
  if (!roleAtLeast(session.role, min)) redirect(AUTH_PATHS.forbidden);
  return session;
}

/** Pour les Server Actions : ok(session) ou fail("UNAUTHENTICATED" | "FORBIDDEN", message français). */
export async function authorize(min: AppRole): Promise<ActionResult<AdminSession>> {
  let state: AuthState;
  try {
    state = await getAuthState();
  } catch (error) {
    console.error("[ina-africa] vérification de la session impossible", error);
    return fail("UNAUTHENTICATED", "Impossible de vérifier votre session. Réessayez dans un instant.");
  }

  if (state.kind === "unconfigured" || state.kind === "anonymous") {
    return fail("UNAUTHENTICATED", "Votre session a expiré. Reconnectez-vous pour continuer.");
  }
  if (state.kind === "no_role") {
    return fail("FORBIDDEN", "Ce compte n'a pas accès à l'administration.");
  }
  const session = sessionFromState(state);
  if (!session || (state.hasVerifiedFactor && state.aal !== "aal2")) {
    return fail("UNAUTHENTICATED", "Validez la double authentification pour continuer.");
  }
  if (!roleAtLeast(session.role, min)) {
    return fail("FORBIDDEN", "Vous n'avez pas les droits pour cette action.");
  }
  return ok(session);
}
