/**
 * Données transmises au navigateur pour ouvrir la fenêtre de paiement
 * KKiaPay. Aucune clé secrète : seulement la clé PUBLIQUE, faite pour être
 * visible (documentation KKiaPay).
 */
export type KkiapayCheckout = {
  /** Notre référence (aléatoire), renvoyée par KKiaPay sous le nom partnerId. */
  reference: string;
  /** Montant en francs CFA entiers. */
  amount: number;
  publicKey: string;
  /** Vrai = paiement de TEST (aucun argent réel, rien d'enregistré). */
  sandbox: boolean;
  /** Libellé affiché par KKiaPay. */
  reason: string;
  name?: string;
  email?: string;
  phone?: string;
};

/** Préfixe des références des paiements de test (jamais enregistrées). */
export const TEST_REFERENCE_PREFIX = "TEST-";

/** Résultat de la vérification d'un paiement, renvoyé au navigateur. */
export type PaymentCheckResult =
  | { status: "test_succeeded"; amount: number }
  | { status: "succeeded"; trackingUrl: string }
  | { status: "pending"; trackingUrl?: string }
  | { status: "failed"; message: string }
  | { status: "error"; message: string };

/**
 * Numéro pour préremplir le widget : chiffres seulement, sans l'indicatif du
 * Bénin. Rien si le format n'est pas reconnu (le visiteur le saisira).
 */
export function widgetPhone(phone: string | undefined): string | undefined {
  if (!phone) return undefined;
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("00229")) digits = digits.slice(5);
  else if (digits.startsWith("229") && digits.length > 10) digits = digits.slice(3);
  return /^\d{8,10}$/.test(digits) ? digits : undefined;
}
