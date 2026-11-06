// BOUCHON agent B — remplacé par l'implémentation de l'agent A à la fusion
import "server-only";

import { fail, type ActionResult } from "@/server/errors";

/*
 * Contrat d'authentification de l'administration (implémenté par l'agent A).
 * Ce bouchon refuse tout : il ne sert qu'à compiler les actions de
 * l'administration en attendant la vraie implémentation.
 */

export type AppRole = "editor" | "admin" | "super_admin";

export type AdminSession = {
  userId: string;
  email: string;
  fullName: string;
  role: AppRole;
  mfaVerified: boolean;
};

const NOT_IMPLEMENTED = "Authentification de l'administration non implémentée (bouchon).";

export async function getAdminSession(): Promise<AdminSession | null> {
  throw new Error(NOT_IMPLEMENTED);
}

export async function requireAdminPage(min: AppRole): Promise<AdminSession> {
  void min;
  throw new Error(NOT_IMPLEMENTED);
}

export async function authorize(min: AppRole): Promise<ActionResult<AdminSession>> {
  void min;
  return fail("UNAUTHENTICATED", "Connectez-vous pour continuer.");
}

export function roleAtLeast(role: AppRole, min: AppRole): boolean {
  void role;
  void min;
  throw new Error(NOT_IMPLEMENTED);
}
