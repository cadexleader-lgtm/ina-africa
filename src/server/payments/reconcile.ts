import "server-only";

import { MERCHANT_REFERENCE } from "@/lib/validation/forms";
import {
  KKIAPAY_TRANSACTION_ID,
  paymentMethodLabel,
  verifyKkiapayTransaction,
  type KkiapayConfig,
} from "@/server/payments/kkiapay";
import type { TransactionStatus } from "@/server/payments/provider";
import type { FormsBackend } from "@/server/security/forms-backend";

/**
 * Rapproche un paiement KKiaPay (mode RÉEL uniquement) de notre transaction
 * `pending` : relit le paiement chez KKiaPay, puis le confirme par la
 * fonction SQL confirm_payment_transaction() (idempotente, montant revérifié
 * par la base). Appelée par le navigateur après le paiement, par la page de
 * suivi et par la notification (webhook) : peu importe qui arrive le premier.
 *
 * Un échec signalé par KKiaPay ne clôt PAS la transaction : le visiteur peut
 * réessayer dans la même fenêtre de paiement (nouvel identifiant KKiaPay,
 * même référence).
 */
export type ReconcileOutcome = "succeeded" | "failed" | "pending" | "not_found" | "error";

type TxRow = {
  id: string;
  status: TransactionStatus;
  amount: number | string;
  provider: string;
  provider_transaction_id: string | null;
};

export async function reconcileKkiapayPayment(
  backend: FormsBackend,
  config: KkiapayConfig,
  reference: string,
  transactionId: string,
  fetcher?: typeof fetch,
): Promise<ReconcileOutcome> {
  if (config.mode !== "live") return "error";
  if (!MERCHANT_REFERENCE.test(reference) || !KKIAPAY_TRANSACTION_ID.test(transactionId)) return "not_found";

  const { data: tx, error } = await backend.db
    .from("payment_transactions")
    .select("id, status, amount, provider, provider_transaction_id")
    .eq("merchant_reference", reference)
    .maybeSingle<TxRow>();
  if (error) {
    console.error("[ina-africa] lecture de la transaction impossible", error.code ?? "");
    return "error";
  }
  if (!tx || tx.provider !== "kkiapay") return "not_found";
  if (tx.status === "succeeded" || tx.status === "refunded") return "succeeded";
  if (tx.status !== "pending") return "failed";

  const verified = await verifyKkiapayTransaction(config, transactionId, fetcher);
  if (verified.kind === "not_found") return "pending";
  if (verified.kind === "error") return "error";

  // Le paiement doit concerner CE don : même référence (si KKiaPay la renvoie) et même montant.
  if (verified.partnerId && verified.partnerId !== reference) {
    console.error("[ina-africa] paiement KKiaPay rattaché à une autre référence : ignoré");
    return "error";
  }
  if (verified.status === "failed") return "failed";
  if (verified.status !== "succeeded") return "pending";
  if (verified.amount !== Number(tx.amount)) {
    console.error("[ina-africa] montant KKiaPay différent du don : confirmation refusée");
    return "error";
  }

  const { error: confirmError } = await backend.db.rpc("confirm_payment_transaction", {
    p_transaction_id: tx.id,
    p_provider_transaction_id: verified.transactionId,
    p_amount: verified.amount,
    p_currency: "XOF",
    p_payment_method: paymentMethodLabel(verified.method),
    p_provider_response: verified.raw,
  });
  if (confirmError) {
    // Ex. : identifiant KKiaPay déjà utilisé pour un autre don (index unique).
    console.error("[ina-africa] confirmation du paiement refusée par la base", confirmError.code ?? "");
    return "error";
  }
  return "succeeded";
}
