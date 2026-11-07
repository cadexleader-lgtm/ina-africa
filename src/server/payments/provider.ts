import "server-only";

import { getKkiapayConfig, type KkiapayMode } from "@/server/payments/kkiapay";

/**
 * Paiement en ligne : quel prestataire est RÉELLEMENT configuré ?
 *
 * Aujourd'hui seul KKiaPay est branché (src/server/payments/kkiapay.ts).
 * Sans ses clés, getActiveProvider() renvoie null : le site n'affiche AUCUN
 * paiement en ligne et l'action de don refuse avant toute écriture.
 *
 * Règles :
 *  1. le formulaire ne fait que PRÉPARER un paiement (don et transaction
 *     « pending » en mode réel, rien du tout en mode test) ;
 *  2. un paiement n'est confirmé qu'après vérification auprès de l'API du
 *     prestataire (jamais sur la foi du navigateur ni d'une notification
 *     seule), puis par la fonction SQL confirm_payment_transaction()
 *     (montant et devise revérifiés par la base) ;
 *  3. toute notification (webhook) est authentifiée avant d'être lue ;
 *  4. les clés privées ne sont lues que côté serveur.
 */

export type PaymentProviderId = "kkiapay" | "cinetpay";

/** Statuts d'une transaction (mêmes valeurs que le type SQL transaction_status). */
export type TransactionStatus = "pending" | "succeeded" | "failed" | "cancelled" | "refunded";

export type ActivePaymentProvider = {
  id: "kkiapay";
  /** Nom affiché au visiteur. */
  label: string;
  /** sandbox = paiements de test, rien n'est enregistré ; live = vrais dons. */
  mode: KkiapayMode;
};

/** Prestataire réellement configuré, ou null. */
export function getActiveProvider(): ActivePaymentProvider | null {
  const kkiapay = getKkiapayConfig();
  if (kkiapay) return { id: "kkiapay", label: "KKiaPay", mode: kkiapay.mode };
  return null;
}

/** Le paiement en ligne peut-il être proposé ? */
export function isOnlinePaymentAvailable(): boolean {
  return getActiveProvider() !== null;
}
