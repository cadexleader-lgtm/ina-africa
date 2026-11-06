"use server";

import { z } from "zod";

import { pageField } from "@/lib/validation/admin/common";
import { adminAction, check } from "@/server/admin/action";
import { pageRange, paginated } from "@/server/data/reader";
import type { Paginated } from "@/server/data/admin/types";
import type { ActionResult } from "@/server/errors";

/*
 * Choix d'une image déjà envoyée (fenêtre « Choisir dans la médiathèque » des
 * formulaires et de l'éditeur de texte). Ajout de l'interface d'administration
 * (agent D) : la lecture src/server/data/admin/media.ts sert les PAGES ; une
 * fenêtre ouverte dans le navigateur a besoin d'une Server Action.
 * Lecture seule, photos du site uniquement (public-media), session de la
 * personne (règles RLS) ; rôle minimal : éditeur.
 */

export type PickerMedia = {
  id: string;
  path: string;
  fileName: string;
  altText: string | null;
  createdAt: string;
};

const PICKER_PAGE_SIZE = 24;

const browseSchema = z.object({ page: pageField });

type Row = { id: string; storage_path: string; file_name: string; alt_text: string | null; created_at: string };

export async function browsePublicMedia(input: unknown): Promise<ActionResult<Paginated<PickerMedia>>> {
  return adminAction("editor", browseSchema, input ?? {}, async ({ page }, { db }) => {
    const range = pageRange(page, PICKER_PAGE_SIZE);
    const result = await db
      .from("media")
      .select("id, storage_path, file_name, alt_text, created_at", { count: "exact" })
      .eq("bucket", "public-media")
      .order("created_at", { ascending: false })
      .range(range.from, range.to);
    const rows = (check(result) ?? []) as unknown as Row[];
    const items = rows.map((row) => ({
      id: row.id,
      path: row.storage_path,
      fileName: row.file_name,
      altText: row.alt_text,
      createdAt: row.created_at,
    }));
    return paginated(items, result.count ?? items.length, range.page, PICKER_PAGE_SIZE);
  });
}
