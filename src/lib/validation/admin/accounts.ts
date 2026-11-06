import { z } from "zod";

import { idField, requiredLine } from "@/lib/validation/admin/common";
import { emailField } from "@/lib/validation/forms";

/*
 * Comptes de l'administration (réservé au super_admin). Pas d'inscription
 * publique : chaque membre est invité par email avec un rôle.
 */

export const APP_ROLES = ["editor", "admin", "super_admin"] as const;

const roleField = z.enum(APP_ROLES, { error: "Choisissez un rôle : éditeur, administrateur ou super administrateur." });

export const inviteMemberSchema = z.object({
  email: emailField,
  fullName: requiredLine(1, 120, "Indiquez le nom de la personne."),
  role: roleField,
});

export const changeRoleSchema = z.object({
  userId: idField,
  role: roleField,
});

export const memberIdSchema = z.object({ userId: idField });
