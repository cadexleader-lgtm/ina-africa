import "server-only";

import { updateTag } from "next/cache";
import type { z } from "zod";

import { parseAdminInput } from "@/lib/validation/admin/common";
import { authorize, type AdminSession, type AppRole } from "@/server/auth/guard";
import { AppError, fail, fromDatabaseError, runAction, type ActionResult, type DatabaseErrorLike } from "@/server/errors";
import { createSessionClient } from "@/server/supabase/server";

/*
 * Socle commun des Server Actions de l'administration :
 *  1. authorize(min)        → refus sans session ou si le rôle ne suffit pas ;
 *  2. validation Zod        → messages en français par champ ;
 *  3. client de SESSION     → les règles RLS de la base s'appliquent ;
 *  4. erreurs               → ActionResult, jamais de détail technique.
 * L'invalidation du cache public (updateTag) est faite par chaque action,
 * après l'écriture réussie.
 */

export type SessionDb = Awaited<ReturnType<typeof createSessionClient>>;

export type AdminContext = { session: AdminSession; db: SessionDb };

export const INVALID_INPUT_MESSAGE = "Certaines informations sont à corriger.";

export async function adminAction<S extends z.ZodType, T>(
  min: AppRole,
  schema: S,
  input: unknown,
  run: (data: z.output<S>, context: AdminContext) => Promise<T>,
): Promise<ActionResult<T>> {
  const auth = await authorize(min);
  if (!auth.ok) return auth;

  const parsed = parseAdminInput(schema, input);
  if (!parsed.ok) return fail("VALIDATION", INVALID_INPUT_MESSAGE, parsed.fieldErrors);

  return runAction(async () => {
    const db = await createSessionClient();
    return run(parsed.data, { session: auth.data, db });
  });
}

/** Invalide les étiquettes du cache public (lecture de ses propres écritures, voir src/server/data/tags.ts). */
export function invalidate(...tags: (string | null | undefined)[]) {
  for (const tag of new Set(tags.filter((tag): tag is string => Boolean(tag)))) {
    updateTag(tag);
  }
}

/** Erreur de la base → AppError ; les erreurs inattendues sont journalisées (code seulement). */
export function databaseError(error: DatabaseErrorLike): AppError {
  const appError = fromDatabaseError(error);
  if (appError.code === "INTERNAL") {
    console.error("[ina-africa] erreur de la base (administration)", error.code ?? "", error.message ?? "");
  }
  return appError;
}

/** Résultat d'une requête Supabase : les données, ou l'erreur traduite. */
export function check<T>(result: { data: T; error: DatabaseErrorLike | null }): T {
  if (result.error) throw databaseError(result.error);
  return result.data;
}

export const NOT_FOUND_MESSAGE = "Élément introuvable : il a peut-être été supprimé, ou vous n'avez pas les droits.";

/** La ligne attendue, ou NOT_FOUND (ligne absente ou masquée par les règles RLS). */
export function found<T>(row: T | null | undefined, message = NOT_FOUND_MESSAGE): T {
  if (row === null || row === undefined) throw new AppError("NOT_FOUND", message);
  return row;
}

// ---------------------------------------------------------------------------
// Opérations courantes sur une table de contenu
// ---------------------------------------------------------------------------

export async function loadRow<T>(db: SessionDb, table: string, id: string, columns: string): Promise<T> {
  const row = check(await db.from(table).select(columns).eq("id", id).maybeSingle());
  return found(row as T | null);
}

export async function insertRow<T>(db: SessionDb, table: string, values: Record<string, unknown>, columns: string): Promise<T> {
  const row = check(await db.from(table).insert(values).select(columns).single());
  return row as T;
}

export async function updateRow<T>(
  db: SessionDb,
  table: string,
  id: string,
  values: Record<string, unknown>,
  columns: string,
): Promise<T> {
  const row = check(await db.from(table).update(values).eq("id", id).select(columns).maybeSingle());
  return found(row as T | null);
}

export async function deleteRow(db: SessionDb, table: string, id: string): Promise<void> {
  const rows = check(await db.from(table).delete().eq("id", id).select("id"));
  if (!rows || (rows as unknown[]).length === 0) throw new AppError("NOT_FOUND", NOT_FOUND_MESSAGE);
}

/**
 * Nouvel ordre d'affichage (display_order = 1, 2, 3…). Une mise à jour par
 * élément : si l'une échoue, les autres sont déjà faites, un nouvel essai
 * remet tout en ordre.
 */
export async function reorderRows(db: SessionDb, table: string, ids: string[]): Promise<void> {
  const results = await Promise.all(
    ids.map((id, index) => db.from(table).update({ display_order: index + 1 }).eq("id", id).select("id")),
  );
  for (const result of results) {
    const rows = check(result);
    if (!rows || (rows as unknown[]).length === 0) throw new AppError("NOT_FOUND", NOT_FOUND_MESSAGE);
  }
}
