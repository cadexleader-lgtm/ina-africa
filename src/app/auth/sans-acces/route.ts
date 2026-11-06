import { redirect } from "next/navigation";

import { hasPublicSupabaseEnv } from "@/lib/public-env";
import { readAuthState } from "@/server/auth/guard";
import { createSessionClient } from "@/server/supabase/server";

/**
 * Compte connecté SANS rôle dans user_roles (rôle retiré, compte créé sans
 * rôle) : la session est fermée puis la page de connexion affiche « Ce compte
 * n'a pas accès à l'administration ». Ne déconnecte QUE les comptes sans rôle
 * (un lien piégé ne peut pas déconnecter un membre de l'équipe).
 */
export async function GET() {
  if (!hasPublicSupabaseEnv()) redirect("/admin/connexion");

  const supabase = await createSessionClient();
  let kind: string;
  try {
    kind = (await readAuthState(supabase)).kind;
  } catch (error) {
    console.error("[ina-africa] vérification du rôle impossible", error);
    redirect("/admin/connexion");
  }

  if (kind === "no_role") {
    const { error } = await supabase.auth.signOut({ scope: "local" });
    if (error) console.error("[ina-africa] déconnexion d'un compte sans rôle", { code: error.code, status: error.status });
    redirect("/admin/connexion?erreur=sans-acces");
  }
  redirect(kind === "signed_in" ? "/admin" : "/admin/connexion");
}
