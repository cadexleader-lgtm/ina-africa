"use server";

import { cancelDonationSchema, donationFiltersSchema, offlineDonationSchema } from "@/lib/validation/admin/donations";
import { adminAction, check, invalidate } from "@/server/admin/action";
import { csvFile, type CsvCell, type CsvFile } from "@/server/admin/csv";
import { firstOf, queryDonations, type DonationRow } from "@/server/admin/donations";
import { TAGS } from "@/server/data/tags";
import { AppError, type ActionResult } from "@/server/errors";

/*
 * Dons (admin). Les dons EN LIGNE ne sont jamais écrits ici (Phase 4,
 * confirmation après vérification chez le prestataire). Les dons HORS LIGNE
 * passent par les fonctions SQL record_offline_donation() (clé
 * d'idempotence : un double clic n'enregistre qu'un don) et
 * cancel_offline_donation() (motif obligatoire, jamais de suppression).
 * Les jauges publiques des appels aux dons sont invalidées après chaque saisie.
 */

type DonationRef = { id: string; reference: string; paymentStatus: string };

type DonationRecord = { id: string; reference: string; payment_status: string };

export async function recordOfflineDonation(input: unknown): Promise<ActionResult<DonationRef>> {
  return adminAction("admin", offlineDonationSchema, input, async (data, { db }) => {
    const row = check(
      await db.rpc("record_offline_donation", {
        p_amount: data.amount,
        p_received_on: data.receivedOn,
        p_payment_method: data.paymentMethod,
        p_external_reference: data.externalReference,
        p_operator_or_bank: data.operatorOrBank,
        p_donor_name: data.donorName,
        p_donor_email: data.donorEmail,
        p_donor_phone: data.donorPhone,
        p_is_anonymous: data.isAnonymous,
        p_campaign_id: data.campaignId,
        p_proof_path: data.proofPath,
        p_donor_message: data.donorMessage,
        p_idempotency_key: data.idempotencyKey,
      }),
    ) as DonationRecord | null;
    if (!row) throw new AppError("INTERNAL", "Le don n'a pas pu être enregistré. Réessayez dans un instant.");
    invalidate(TAGS.campaignProgress);
    return { id: row.id, reference: row.reference, paymentStatus: row.payment_status };
  });
}

export async function cancelOfflineDonation(input: unknown): Promise<ActionResult<DonationRef>> {
  return adminAction("admin", cancelDonationSchema, input, async ({ id, reason }, { db }) => {
    const row = check(
      await db.rpc("cancel_offline_donation", { p_donation_id: id, p_reason: reason }),
    ) as DonationRecord | null;
    if (!row) throw new AppError("NOT_FOUND", "Don hors ligne introuvable.");
    invalidate(TAGS.campaignProgress);
    return { id: row.id, reference: row.reference, paymentStatus: row.payment_status };
  });
}

// ---------------------------------------------------------------------------
// Export CSV (admin)
// ---------------------------------------------------------------------------

/** Plafond d'un export (au-delà : affiner les filtres). */
const DONATIONS_EXPORT_LIMIT = 20_000;
const BATCH = 1000;

const CHANNEL_LABELS: Record<DonationRow["channel"], string> = { online: "En ligne", offline: "Hors ligne" };
const STATUS_LABELS: Record<DonationRow["payment_status"], string> = {
  pending: "En attente",
  paid: "Payé",
  failed: "Échoué",
  cancelled: "Annulé",
  refunded: "Remboursé",
};
const METHOD_LABELS: Record<string, string> = { mobile_money: "Mobile Money", bank_transfer: "Virement bancaire" };

const HEADERS = [
  "Référence",
  "Enregistré le",
  "Canal",
  "Statut",
  "Montant",
  "Devise",
  "Mode de paiement",
  "Prestataire",
  "Opérateur ou banque",
  "Référence de l'opération",
  "Reçu le",
  "Payé le",
  "Appel aux dons",
  "Donateur",
  "Email",
  "Téléphone",
  "Anonyme sur le site",
  "Message",
  "Justificatif",
  "Saisi par",
  "Annulé le",
  "Motif d'annulation",
  "Source (utm)",
  "Support (utm)",
  "Campagne (utm)",
];

function toCsvRow(row: DonationRow): CsvCell[] {
  return [
    row.reference,
    row.created_at,
    CHANNEL_LABELS[row.channel],
    STATUS_LABELS[row.payment_status],
    Number(row.amount),
    row.currency,
    row.payment_method ? (METHOD_LABELS[row.payment_method] ?? row.payment_method) : null,
    row.provider,
    row.operator_or_bank,
    row.external_reference,
    row.received_on,
    row.paid_at,
    firstOf(row.campaign)?.title,
    row.donor_name,
    row.donor_email,
    row.donor_phone,
    row.is_anonymous,
    row.donor_message,
    row.proof_path ? "oui" : "non",
    firstOf(row.recorder)?.full_name,
    row.cancelled_at,
    row.cancellation_reason,
    row.utm_source,
    row.utm_medium,
    row.utm_campaign,
  ];
}

export type DonationsExport = CsvFile & { truncated: boolean };

/**
 * Export des dons filtrés (canal, statut, appel aux dons, période), en CSV
 * pour Excel. Le navigateur en fait un fichier à télécharger.
 */
export async function exportDonationsCsv(input: unknown): Promise<ActionResult<DonationsExport>> {
  return adminAction("admin", donationFiltersSchema, input ?? {}, async (filters, { db }) => {
    const rows: DonationRow[] = [];
    let total = 0;
    for (let from = 0; from < DONATIONS_EXPORT_LIMIT; from += BATCH) {
      const page = await queryDonations(db, filters, { from, to: from + BATCH - 1 });
      total = page.total;
      rows.push(...page.rows);
      if (page.rows.length < BATCH || rows.length >= total) break;
    }
    return { ...csvFile("dons", HEADERS, rows.map(toCsvRow)), truncated: total > rows.length };
  });
}
