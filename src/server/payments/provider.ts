import "server-only";

/**
 * Interface commune des prestataires de paiement en ligne (KKiaPay, CinetPay).
 *
 * AUCUN ADAPTATEUR N'EST ÉCRIT : ils viendront en Phase 4, après validation
 * du compte marchand de l'ONG. Tant qu'aucun adaptateur réel n'est enregistré
 * dans PROVIDER_FACTORIES, getActiveProvider() renvoie null : le site n'affiche
 * AUCUN paiement en ligne et l'action de don refuse avant toute écriture.
 *
 * Règles que tout adaptateur devra respecter :
 *  1. createPayment ne fait que DEMANDER un paiement (statut « pending ») ;
 *  2. un paiement n'est confirmé qu'après verifyTransaction() auprès de l'API
 *     du prestataire (jamais sur la foi d'une page de retour ni d'une
 *     notification seule), puis par la fonction SQL
 *     confirm_payment_transaction() (montant et devise revérifiés par la base) ;
 *  3. toute notification (webhook) est authentifiée par verifySignature()
 *     AVANT d'être lue ;
 *  4. les clés ne sont lues que côté serveur (src/server/env.ts).
 */

export type PaymentProviderId = "kkiapay" | "cinetpay";

/** Statuts d'une transaction (mêmes valeurs que le type SQL transaction_status). */
export type TransactionStatus = "pending" | "succeeded" | "failed" | "cancelled" | "refunded";

export type CreatePaymentInput = {
  /** Notre référence aléatoire (payment_transactions.merchant_reference). */
  merchantReference: string;
  /** Montant en francs CFA entiers. */
  amount: number;
  currency: "XOF";
  /** Libellé affiché par le prestataire (ex. « Don à INA-AFRICA »). */
  description: string;
  /** Page de suivi : /faire-un-don/suivi?tx=<merchantReference> (adresse absolue). */
  returnUrl: string;
  /** Adresse des notifications du prestataire (route serveur, Phase 4). */
  notifyUrl: string;
  customer: { name?: string; email?: string; phone?: string };
};

export type CreatePaymentResult = {
  /** Page de paiement du prestataire (toujours https://). */
  paymentUrl: string;
  /** Identifiant du prestataire, s'il est connu dès la création. */
  providerTransactionId?: string;
  /** Réponse brute, conservée pour le support (sans données de carte). */
  raw?: unknown;
};

/** Résultat de la vérification auprès de l'API du prestataire. */
export type VerifiedTransaction = {
  status: TransactionStatus;
  providerTransactionId: string;
  amount: number;
  currency: string;
  paymentMethod?: string;
  failureReason?: string;
  raw?: unknown;
};

/** Notification reçue du prestataire, une fois sa signature vérifiée. */
export type PaymentNotification = {
  merchantReference?: string;
  providerTransactionId?: string;
};

export type IncomingWebhook = {
  headers: Headers;
  /** Corps brut, tel que reçu (la signature porte sur lui). */
  rawBody: string;
};

export interface PaymentProvider {
  readonly id: PaymentProviderId;
  /** Nom affiché au visiteur (« KKiaPay », « CinetPay »). */
  readonly label: string;
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
  verifyTransaction(reference: { merchantReference: string; providerTransactionId?: string }): Promise<VerifiedTransaction>;
  /** Vrai seulement si la notification vient bien du prestataire. */
  verifySignature(webhook: IncomingWebhook): Promise<boolean>;
  /** Lit une notification DÉJÀ authentifiée ; null si elle n'est pas exploitable. */
  parseWebhook(webhook: IncomingWebhook): PaymentNotification | null;
}

/**
 * Adaptateurs disponibles. VIDE tant que le compte marchand n'est pas validé.
 * En Phase 4 : `kkiapay: () => createKkiapayProvider(env) ?? null`, qui ne
 * renvoie un adaptateur que si ses clés sont configurées.
 */
const PROVIDER_FACTORIES: Partial<Record<PaymentProviderId, () => PaymentProvider | null>> = {};

/** Ordre de préférence si plusieurs prestataires sont configurés. */
const PREFERENCE: PaymentProviderId[] = ["kkiapay", "cinetpay"];

/** Prestataire RÉELLEMENT actif, ou null (aujourd'hui : toujours null). */
export function getActiveProvider(): PaymentProvider | null {
  for (const id of PREFERENCE) {
    const provider = PROVIDER_FACTORIES[id]?.();
    if (provider) return provider;
  }
  return null;
}

/** Le paiement en ligne peut-il être proposé ? */
export function isOnlinePaymentAvailable(): boolean {
  return getActiveProvider() !== null;
}
