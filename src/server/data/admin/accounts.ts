import "server-only";

import { check } from "@/server/admin/action";
import { adminReader } from "@/server/data/admin/reader";
import type { AdminAccount } from "@/server/data/admin/types";

type ProfileRow = { id: string; full_name: string; email: string; created_at: string };
type RoleRow = { user_id: string; role: AdminAccount["role"]; created_at: string; updated_at: string };

/** Membres de l'administration et leur rôle (super_admin). Un compte sans rôle n'a aucun accès. */
export async function listAdminAccounts(): Promise<AdminAccount[]> {
  const { db } = await adminReader("super_admin");
  const [profiles, roles] = await Promise.all([
    db.from("profiles").select("id, full_name, email, created_at").order("full_name"),
    db.from("user_roles").select("user_id, role, created_at, updated_at"),
  ]);
  const roleByUser = new Map(((check(roles) ?? []) as RoleRow[]).map((row) => [row.user_id, row]));
  return ((check(profiles) ?? []) as ProfileRow[]).map((profile) => {
    const role = roleByUser.get(profile.id);
    return {
      userId: profile.id,
      fullName: profile.full_name,
      email: profile.email,
      role: role?.role ?? null,
      createdAt: profile.created_at,
      roleGrantedAt: role?.updated_at ?? null,
    };
  });
}
