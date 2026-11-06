"use server";

import { idInputSchema, noInputSchema } from "@/lib/validation/admin/common";
import { requestStatusSchema } from "@/lib/validation/admin/inbox";
import { adminAction, check, deleteRow, updateRow } from "@/server/admin/action";
import { csvFile, type CsvFile } from "@/server/admin/csv";
import type { ActionResult } from "@/server/errors";

/*
 * Boîte de réception (« Nous rejoindre / Contact ») et newsletter (admin).
 * Ces données ne sont jamais affichées sur le site public : aucun cache à
 * invalider. Seul le statut d'une demande change (la base trace qui l'a
 * traitée et quand) ; une suppression se fait à la demande de la personne.
 */

type RequestRef = { id: string; status: string; handled_at: string | null };

export async function updateRequestStatus(input: unknown): Promise<ActionResult<RequestRef>> {
  return adminAction("admin", requestStatusSchema, input, async ({ id, status }, { db }) =>
    updateRow<RequestRef>(db, "contact_requests", id, { status }, "id, status, handled_at"),
  );
}

export async function deleteRequest(input: unknown): Promise<ActionResult<{ id: string }>> {
  return adminAction("admin", idInputSchema, input, async ({ id }, { db }) => {
    await deleteRow(db, "contact_requests", id);
    return { id };
  });
}

// ---------------------------------------------------------------------------
// Newsletter
// ---------------------------------------------------------------------------

/** Suppression définitive d'un inscrit (droit à l'effacement). */
export async function deleteNewsletterSubscriber(input: unknown): Promise<ActionResult<{ id: string }>> {
  return adminAction("admin", idInputSchema, input, async ({ id }, { db }) => {
    await deleteRow(db, "newsletter_subscribers", id);
    return { id };
  });
}

const BATCH = 1000;
const EXPORT_LIMIT = 50_000;

/**
 * Export CSV des SEULS abonnés confirmés (double confirmation faite, non
 * désinscrits) : jamais les inscriptions en attente ni les désinscrits.
 */
export async function exportNewsletterCsv(): Promise<ActionResult<CsvFile>> {
  return adminAction("admin", noInputSchema, {}, async (_input, { db }) => {
    const rows: { email: string; confirmed_at: string | null; source: string | null }[] = [];
    for (let from = 0; from < EXPORT_LIMIT; from += BATCH) {
      const batch = check(
        await db
          .from("newsletter_subscribers")
          .select("email, confirmed_at, source")
          .eq("status", "subscribed")
          .order("confirmed_at", { ascending: true })
          .range(from, from + BATCH - 1),
      ) as typeof rows | null;
      rows.push(...(batch ?? []));
      if (!batch || batch.length < BATCH) break;
    }
    return csvFile(
      "newsletter-abonnes",
      ["Email", "Confirmé le", "Origine"],
      rows.map((row) => [row.email, row.confirmed_at, row.source]),
    );
  });
}
