import "server-only";

import type { TransactionStatus } from "@/server/payments/provider";

/**
 * KKiaPay : configuration et vérification d'un paiement côté serveur.
 *
 * Deux modes, choisis par les variables d'environnement :
 *  - « sandbox » (KKIAPAY_SANDBOX=true + clé publique de test) : paiements de
 *    TEST, sans argent réel. Rien n'est enregistré dans la base : le site
 *    vérifie seulement le paiement auprès de KKiaPay et l'annonce comme test.
 *  - « live » (clé publique + clé privée + secret, KKIAPAY_SANDBOX absent ou
 *    false) : vrais dons, à n'activer qu'après validation du compte marchand.
 *
 * Un paiement n'est JAMAIS cru sur la foi du navigateur ou d'une notification :
 * son statut et son montant sont toujours relus auprès de l'API de KKiaPay
 * (même adresse et mêmes en-têtes que le SDK serveur officiel
 * @kkiapay-org/nodejs-sdk).
 */

export type KkiapayMode = "sandbox" | "live";

export type KkiapayConfig = {
  mode: KkiapayMode;
  publicKey: string;
  privateKey?: string;
  secretKey?: string;
};

const API_BASE: Record<KkiapayMode, string> = {
  sandbox: "https://api-sandbox.kkiapay.me",
  live: "https://api.kkiapay.me",
};
const STATUS_PATH = "/api/v1/transactions/status";

const KEY = /^[A-Za-z0-9_-]{16,128}$/;
/** Identifiant de transaction KKiaPay (ex. « 0845058258857440 », « 3iH6wjHJ3 »). */
export const KKIAPAY_TRANSACTION_ID = /^[A-Za-z0-9_-]{4,64}$/;

function readKey(value: string | undefined): string | undefined {
  const key = value?.trim();
  return key && KEY.test(key) ? key : undefined;
}

/** Configuration active, ou null si KKiaPay n'est pas configuré (aucun paiement proposé). */
export function getKkiapayConfig(): KkiapayConfig | null {
  const publicKey = readKey(process.env.NEXT_PUBLIC_KKIAPAY_PUBLIC_KEY);
  if (!publicKey) return null;
  const privateKey = readKey(process.env.KKIAPAY_PRIVATE_KEY);
  const secretKey = readKey(process.env.KKIAPAY_SECRET);

  if (process.env.KKIAPAY_SANDBOX?.trim().toLowerCase() === "true") {
    return { mode: "sandbox", publicKey, privateKey, secretKey };
  }
  // Vrais paiements : les trois clés sont obligatoires (vérification serveur).
  if (!privateKey || !secretKey) return null;
  return { mode: "live", publicKey, privateKey, secretKey };
}

export type KkiapayVerification =
  | {
      kind: "found";
      status: TransactionStatus;
      transactionId: string;
      amount: number;
      /** Notre référence, renvoyée par KKiaPay si elle a été transmise au widget. */
      partnerId: string | null;
      /** MOBILE_MONEY, CARD, WALLET… */
      method: string | null;
      failureReason: string | null;
      raw: Record<string, unknown>;
    }
  | { kind: "not_found" }
  | { kind: "error" };

function mapStatus(value: unknown): TransactionStatus {
  const status = typeof value === "string" ? value.trim().toUpperCase() : "";
  if (status === "SUCCESS") return "succeeded";
  if (status === "FAILED" || status === "FAILURE") return "failed";
  return "pending";
}

function text(value: unknown, max = 200): string | null {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, max) : null;
}

/** Réponse conservée pour le support : sans les coordonnées du payeur. */
function keepForSupport(data: Record<string, unknown>): Record<string, unknown> {
  const kept: Record<string, unknown> = {};
  for (const key of ["status", "type", "source", "source_common_name", "amount", "fees", "reason", "failureCode", "failureMessage", "partnerId", "transactionId", "performed_at"]) {
    if (key in data) kept[key] = data[key];
  }
  return kept;
}

/** Interroge KKiaPay sur une transaction. Ne lève jamais d'exception. */
export async function verifyKkiapayTransaction(
  config: KkiapayConfig,
  transactionId: string,
  fetcher: typeof fetch = fetch,
): Promise<KkiapayVerification> {
  if (!KKIAPAY_TRANSACTION_ID.test(transactionId)) return { kind: "not_found" };

  const headers: Record<string, string> = {
    "content-type": "application/json",
    accept: "application/json",
    "x-api-key": config.publicKey,
  };
  if (config.privateKey) headers["x-private-key"] = config.privateKey;
  if (config.secretKey) headers["x-secret-key"] = config.secretKey;

  let response: Response;
  try {
    response = await fetcher(`${API_BASE[config.mode]}${STATUS_PATH}`, {
      method: "POST",
      headers,
      body: JSON.stringify({ transactionId }),
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    console.error("[ina-africa] KKiaPay injoignable pendant la vérification d'un paiement");
    return { kind: "error" };
  }

  let data: unknown = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }
  const body = data && typeof data === "object" ? (data as Record<string, unknown>) : {};

  if (!response.ok) {
    if (body.status === "TRANSACTION_NOT_FOUND" || response.status === 404) return { kind: "not_found" };
    console.error("[ina-africa] vérification KKiaPay refusée", response.status, text(body.status, 60) ?? "");
    return { kind: "error" };
  }

  const amount = Number(body.amount);
  const id = text(body.transactionId, 100) ?? transactionId;
  if (!Number.isFinite(amount) || id !== transactionId) {
    console.error("[ina-africa] réponse KKiaPay inattendue pendant la vérification");
    return { kind: "error" };
  }

  return {
    kind: "found",
    status: mapStatus(body.status),
    transactionId: id,
    amount,
    partnerId: text(body.partnerId, 100),
    method: text(body.source, 50),
    failureReason: text(body.failureMessage, 300) ?? text(body.failureCode, 300),
    raw: keepForSupport(body),
  };
}

/** Moyen de paiement lisible, enregistré avec le don. */
export function paymentMethodLabel(method: string | null): string | null {
  switch (method?.toUpperCase()) {
    case "MOBILE_MONEY":
      return "mobile_money";
    case "CARD":
      return "card";
    case "WALLET":
      return "wallet";
    default:
      return method ? method.toLowerCase().slice(0, 50) : null;
  }
}
