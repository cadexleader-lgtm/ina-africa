import { createHash, timingSafeEqual } from "node:crypto";

import { MERCHANT_REFERENCE } from "@/lib/validation/forms";
import { getKkiapayConfig, KKIAPAY_TRANSACTION_ID } from "@/server/payments/kkiapay";
import { reconcileKkiapayPayment } from "@/server/payments/reconcile";
import { getFormsBackend } from "@/server/security/forms-backend";

/**
 * Notifications (webhook) de KKiaPay : POST /api/paiements/notification
 *
 *  1. authentifiée par l'en-tête x-kkiapay-secret, comparé au secret choisi
 *     dans le tableau de bord KKiaPay (KKIAPAY_WEBHOOK_SECRET) ;
 *  2. son contenu n'est PAS cru : on n'en garde que la référence (partnerId)
 *     et l'identifiant KKiaPay, puis le paiement est relu chez KKiaPay
 *     (reconcileKkiapayPayment) ;
 *  3. mode test : rien n'est enregistré, la notification est simplement acquittée.
 *
 * Réponse 2xx dès que la notification est authentifiée (sinon KKiaPay la renvoie).
 */

const MAX_BODY = 20_000;

function sameSecret(received: string, expected: string): boolean {
  const a = createHash("sha256").update(received).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

function json(status: number, body: Record<string, unknown>) {
  return Response.json(body, { status, headers: { "cache-control": "no-store" } });
}

export async function POST(request: Request) {
  const expected = process.env.KKIAPAY_WEBHOOK_SECRET?.trim();
  if (!expected) return json(503, { ok: false });

  const received = request.headers.get("x-kkiapay-secret")?.trim() ?? "";
  if (!received || !sameSecret(received, expected)) return json(401, { ok: false });

  const raw = await request.text();
  if (raw.length > MAX_BODY) return json(413, { ok: false });

  let payload: Record<string, unknown> = {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === "object") payload = parsed as Record<string, unknown>;
  } catch {
    return json(200, { ok: true, ignored: "body" });
  }

  const config = getKkiapayConfig();
  const backend = getFormsBackend();
  if (!config || config.mode !== "live" || !backend) return json(200, { ok: true, ignored: "mode" });

  const reference = typeof payload.partnerId === "string" ? payload.partnerId.trim() : "";
  const transactionId = typeof payload.transactionId === "string" ? payload.transactionId.trim() : "";
  if (!MERCHANT_REFERENCE.test(reference) || !KKIAPAY_TRANSACTION_ID.test(transactionId)) {
    return json(200, { ok: true, ignored: "reference" });
  }

  const outcome = await reconcileKkiapayPayment(backend, config, reference, transactionId);
  // Erreur passagère (KKiaPay ou base injoignable) : 503 pour que KKiaPay réessaie.
  if (outcome === "error") return json(503, { ok: false });
  return json(200, { ok: true, outcome });
}
