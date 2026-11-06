"use server";

import { absoluteUrl } from "@/lib/site-url";
import { changeRoleSchema, inviteMemberSchema, memberIdSchema } from "@/lib/validation/admin/accounts";
import { adminAction, check, databaseError, found, loadRow, type SessionDb } from "@/server/admin/action";
import type { AppRole } from "@/server/auth/guard";
import { AppError, type ActionResult } from "@/server/errors";
import { createPrivilegedClient } from "@/server/supabase/admin";

/*
 * Comptes de l'administration (super_admin uniquement).
 *  - Les RÔLES s'écrivent avec le client de SESSION : les règles RLS (seul un
 *    super_admin attribue un rôle), le journal d'audit et la protection du
 *    dernier super_admin (trigger) s'appliquent.
 *  - Le client PRIVILÉGIÉ ne sert qu'aux opérations de Supabase Auth
 *    impossibles autrement : envoyer une invitation, supprimer un compte.
 *  - Personne ne change son propre rôle ni ne supprime son propre compte
 *    (évite de se retirer l'accès par erreur).
 */

/** Page où mène le lien de l'invitation (configurée dans Supabase → URL Configuration). */
const INVITE_REDIRECT_PATH = "/auth/confirm";

const SELF_MESSAGE = "Vous ne pouvez pas modifier votre propre accès : demandez-le à un autre super administrateur.";

type MemberRef = { userId: string; role: AppRole | null };

async function assertMemberExists(db: SessionDb, userId: string): Promise<{ id: string; email: string }> {
  return loadRow<{ id: string; email: string }>(db, "profiles", userId, "id, email");
}

/** Invite une personne par email, avec son rôle. Elle choisit son mot de passe en suivant le lien reçu. */
export async function inviteMember(input: unknown): Promise<ActionResult<MemberRef & { email: string }>> {
  return adminAction("super_admin", inviteMemberSchema, input, async ({ email, fullName, role }, { db }) => {
    const existing = check(await db.from("profiles").select("id").eq("email", email).maybeSingle());
    if (existing) {
      throw new AppError("CONFLICT", "Un compte existe déjà avec cette adresse : modifiez son rôle dans la liste des membres.");
    }

    const privileged = createPrivilegedClient();
    const { data, error } = await privileged.auth.admin.inviteUserByEmail(email, {
      data: { full_name: fullName },
      redirectTo: absoluteUrl(INVITE_REDIRECT_PATH),
    });
    if (error || !data?.user) {
      if (error?.code === "email_exists" || error?.status === 422) {
        throw new AppError("CONFLICT", "Un compte existe déjà avec cette adresse.");
      }
      console.error("[ina-africa] invitation impossible", error?.code ?? "", error?.status ?? "");
      throw new AppError("INTERNAL", "L'invitation n'a pas pu être envoyée. Réessayez dans un instant.");
    }

    const userId = data.user.id;
    const { error: roleError } = await db.from("user_roles").insert({ user_id: userId, role });
    if (roleError) {
      // Pas de compte sans rôle : l'invitation est annulée.
      const { error: cleanupError } = await privileged.auth.admin.deleteUser(userId);
      if (cleanupError) console.error("[ina-africa] annulation de l'invitation impossible", cleanupError.code ?? "");
      throw databaseError(roleError);
    }
    return { userId, email, role };
  });
}

/** Change le rôle d'un membre (ou en donne un à un compte qui n'en a plus). */
export async function changeMemberRole(input: unknown): Promise<ActionResult<MemberRef>> {
  return adminAction("super_admin", changeRoleSchema, input, async ({ userId, role }, { db, session }) => {
    if (userId === session.userId) throw new AppError("FORBIDDEN", SELF_MESSAGE);
    await assertMemberExists(db, userId);
    const row = check(
      await db.from("user_roles").upsert({ user_id: userId, role }, { onConflict: "user_id" }).select("user_id, role").maybeSingle(),
    ) as { user_id: string; role: AppRole } | null;
    const saved = found(row);
    return { userId: saved.user_id, role: saved.role };
  });
}

/** Retire l'accès (le compte reste, sans rôle : il ne voit plus rien). La base protège le dernier super_admin. */
export async function revokeMemberAccess(input: unknown): Promise<ActionResult<MemberRef>> {
  return adminAction("super_admin", memberIdSchema, input, async ({ userId }, { db, session }) => {
    if (userId === session.userId) throw new AppError("FORBIDDEN", SELF_MESSAGE);
    const rows = check(await db.from("user_roles").delete().eq("user_id", userId).select("user_id")) as unknown[] | null;
    if (!rows || rows.length === 0) throw new AppError("NOT_FOUND", "Ce compte n'a déjà plus d'accès.");
    return { userId, role: null };
  });
}

/**
 * Supprime définitivement le compte. Le rôle est d'abord retiré avec la
 * session (la base refuse s'il s'agit du dernier super_admin) ; les contenus
 * de la personne restent (auteur vidé).
 */
export async function deleteMemberAccount(input: unknown): Promise<ActionResult<{ userId: string }>> {
  return adminAction("super_admin", memberIdSchema, input, async ({ userId }, { db, session }) => {
    if (userId === session.userId) throw new AppError("FORBIDDEN", SELF_MESSAGE);
    await assertMemberExists(db, userId);
    check(await db.from("user_roles").delete().eq("user_id", userId).select("user_id"));

    const { error } = await createPrivilegedClient().auth.admin.deleteUser(userId);
    if (error) {
      console.error("[ina-africa] suppression du compte impossible", error.code ?? "", error.status ?? "");
      throw new AppError("INTERNAL", "Le compte n'a pas pu être supprimé (son accès est déjà retiré). Réessayez dans un instant.");
    }
    return { userId };
  });
}
