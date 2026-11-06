import "server-only";

import { EMPTY_DOC, richTextDocSchema, type RichTextDoc } from "@/lib/validation/rich-text";
import { createSessionClient } from "@/server/supabase/server";
import { requireAdminPage, type AppRole } from "@/server/auth/guard";

/*
 * Lectures de l'ADMINISTRATION : jamais mises en cache, toujours avec la
 * session de la personne connectée (les règles RLS filtrent). Chaque lecture
 * revérifie le rôle (requireAdminPage) : une page qui oublierait de le faire
 * n'obtient rien. À appeler sous une limite <Suspense> (lecture des cookies).
 */

export const ADMIN_PAGE_SIZE = 20;

export async function adminReader(min: AppRole) {
  const session = await requireAdminPage(min);
  const db = await createSessionClient();
  return { session, db };
}

export function toDoc(value: unknown): RichTextDoc {
  const parsed = richTextDocSchema.safeParse(value);
  return parsed.success ? (parsed.data as RichTextDoc) : EMPTY_DOC;
}

export function first<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : (value ?? null);
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Identifiant venant d'une adresse : un identifiant mal formé = élément introuvable. */
export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID.test(value);
}
