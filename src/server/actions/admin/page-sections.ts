"use server";

import { z } from "zod";

import { findSection } from "@/content/page-sections";
import { sectionContentSchema } from "@/lib/page-content/validation";
import { sectionId } from "@/lib/page-content/types";
import { adminAction, check, invalidate } from "@/server/admin/action";
import { TAGS } from "@/server/data/tags";
import { fail, type ActionResult } from "@/server/errors";

/*
 * Pages du site (admin) : une section s'enregistre d'un coup (tous ses champs).
 * « Revenir au texte d'origine » supprime la ligne : le site réaffiche les
 * valeurs d'origine (src/content/page-sections/).
 */

const UNKNOWN_SECTION = "Section introuvable : rechargez la page.";

function sectionOf(input: unknown) {
  if (!input || typeof input !== "object") return null;
  const { page, section } = input as Record<string, unknown>;
  return typeof page === "string" && typeof section === "string" ? findSection(page, section) : null;
}

export async function savePageSection(input: unknown): Promise<ActionResult<{ updatedAt: string }>> {
  const found = sectionOf(input);
  if (!found) return fail("VALIDATION", UNKNOWN_SECTION);
  const schema = z.object({
    page: z.literal(found.page.key),
    section: z.literal(found.section.key),
    content: sectionContentSchema(found.section),
  });
  return adminAction("admin", schema, input, async (data, { db }) => {
    const row = check(
      await db
        .from("page_sections")
        .upsert({ id: sectionId(data.page, data.section), content: data.content }, { onConflict: "id" })
        .select("updated_at")
        .single(),
    ) as { updated_at: string };
    invalidate(TAGS.pageSections);
    return { updatedAt: row.updated_at };
  });
}

export async function resetPageSection(input: unknown): Promise<ActionResult<{ reset: true }>> {
  const found = sectionOf(input);
  if (!found) return fail("VALIDATION", UNKNOWN_SECTION);
  const schema = z.object({ page: z.literal(found.page.key), section: z.literal(found.section.key) });
  return adminAction("admin", schema, input, async (data, { db }) => {
    check(await db.from("page_sections").delete().eq("id", sectionId(data.page, data.section)).select("id"));
    invalidate(TAGS.pageSections);
    return { reset: true as const };
  });
}
