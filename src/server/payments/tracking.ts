import "server-only";

import { MERCHANT_REFERENCE } from "@/lib/validation/forms";
import type { TransactionStatus } from "@/server/payments/provider";
import { getFormsBackend } from "@/server/security/forms-backend";

/**
 * Statut d'un paiement pour la page /faire-un-don/suivi?tx=<référence>.
 * Lu CÔTÉ SERVEUR (client privilégié) en ne sélectionnant que le statut, le
 * montant et le titre de l'appel aux dons : aucune donnée personnelle.
 * Rien n'est déduit des autres paramètres de l'adresse (ceux qu'ajoute un
 * prestataire au retour ne prouvent rien).
 */
export type PaymentTracking =
  | { kind: "unavailable" }
  | { kind: "not_found" }
  | { kind: "found"; status: TransactionStatus; amount: number; campaignTitle: string | null; campaignSlug: string | null };

type Row = {
  status: TransactionStatus;
  amount: number | string;
  donations: { donation_campaigns: { title: string; slug: string } | { title: string; slug: string }[] | null } | null;
};

const STATUSES: TransactionStatus[] = ["pending", "succeeded", "failed", "cancelled", "refunded"];

export async function readPaymentTracking(reference: unknown): Promise<PaymentTracking> {
  if (typeof reference !== "string" || !MERCHANT_REFERENCE.test(reference)) return { kind: "not_found" };
  const backend = getFormsBackend();
  if (!backend) return { kind: "unavailable" };

  const { data, error } = await backend.db
    .from("payment_transactions")
    .select("status, amount, donations(donation_campaigns(title, slug))")
    .eq("merchant_reference", reference)
    .maybeSingle<Row>();
  if (error) {
    console.error("[ina-africa] lecture du suivi de paiement impossible", error.code ?? "");
    return { kind: "not_found" };
  }
  if (!data || !STATUSES.includes(data.status)) return { kind: "not_found" };

  const campaign = data.donations?.donation_campaigns;
  const first = Array.isArray(campaign) ? campaign[0] : campaign;
  return {
    kind: "found",
    status: data.status,
    amount: Number(data.amount),
    campaignTitle: first?.title ?? null,
    campaignSlug: first?.slug ?? null,
  };
}
