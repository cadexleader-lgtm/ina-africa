import { afterEach, describe, expect, it, vi } from "vitest";

import { widgetPhone } from "@/lib/payments/checkout";
import { getKkiapayConfig, verifyKkiapayTransaction, type KkiapayConfig } from "@/server/payments/kkiapay";
import { reconcileKkiapayPayment } from "@/server/payments/reconcile";
import type { FormsBackend } from "@/server/security/forms-backend";

const PUBLIC = "e04e1ec0994311f08b5c87d693475c56";
const REFERENCE = "AbCdEfGhIjKlMnOpQrStUvWxYz012345";

function reply(status: number, body: unknown): typeof fetch {
  return vi.fn(async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch;
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("configuration KKiaPay", () => {
  it("aucune clé : aucun paiement proposé", () => {
    vi.stubEnv("NEXT_PUBLIC_KKIAPAY_PUBLIC_KEY", "");
    expect(getKkiapayConfig()).toBeNull();
  });

  it("mode test avec la seule clé publique", () => {
    vi.stubEnv("NEXT_PUBLIC_KKIAPAY_PUBLIC_KEY", PUBLIC);
    vi.stubEnv("KKIAPAY_SANDBOX", "true");
    expect(getKkiapayConfig()).toMatchObject({ mode: "sandbox", publicKey: PUBLIC });
  });

  it("mode réel seulement avec les trois clés", () => {
    vi.stubEnv("NEXT_PUBLIC_KKIAPAY_PUBLIC_KEY", PUBLIC);
    vi.stubEnv("KKIAPAY_SANDBOX", "");
    vi.stubEnv("KKIAPAY_PRIVATE_KEY", "");
    vi.stubEnv("KKIAPAY_SECRET", "");
    expect(getKkiapayConfig()).toBeNull();
    vi.stubEnv("KKIAPAY_PRIVATE_KEY", "pk_0123456789abcdef0123");
    vi.stubEnv("KKIAPAY_SECRET", "sk_0123456789abcdef0123");
    expect(getKkiapayConfig()).toMatchObject({ mode: "live" });
  });

  it("refuse une clé mal formée", () => {
    vi.stubEnv("NEXT_PUBLIC_KKIAPAY_PUBLIC_KEY", "pas une clé !");
    vi.stubEnv("KKIAPAY_SANDBOX", "true");
    expect(getKkiapayConfig()).toBeNull();
  });
});

describe("vérification d'un paiement auprès de KKiaPay", () => {
  const sandbox: KkiapayConfig = { mode: "sandbox", publicKey: PUBLIC };

  it("appelle l'API de test avec la clé publique", async () => {
    const fetcher = reply(200, { status: "SUCCESS", amount: 2000, transactionId: "TX123456", partnerId: "", source: "MOBILE_MONEY" });
    const result = await verifyKkiapayTransaction(sandbox, "TX123456", fetcher);
    expect(result).toMatchObject({ kind: "found", status: "succeeded", amount: 2000, partnerId: null, method: "MOBILE_MONEY" });
    const [url, init] = vi.mocked(fetcher).mock.calls[0]!;
    expect(url).toBe("https://api-sandbox.kkiapay.me/api/v1/transactions/status");
    expect((init?.headers as Record<string, string>)["x-api-key"]).toBe(PUBLIC);
    expect(JSON.parse(String(init?.body))).toEqual({ transactionId: "TX123456" });
  });

  it("traduit les statuts et l'absence de transaction", async () => {
    expect(await verifyKkiapayTransaction(sandbox, "TX1", reply(200, {}))).toEqual({ kind: "not_found" });
    expect(await verifyKkiapayTransaction(sandbox, "TX123456", reply(400, { status: "TRANSACTION_NOT_FOUND" }))).toEqual({
      kind: "not_found",
    });
    expect(
      await verifyKkiapayTransaction(sandbox, "TX123456", reply(200, { status: "FAILED", amount: 2000, transactionId: "TX123456" })),
    ).toMatchObject({ status: "failed" });
    expect(
      await verifyKkiapayTransaction(sandbox, "TX123456", reply(200, { status: "PENDING", amount: 2000, transactionId: "TX123456" })),
    ).toMatchObject({ status: "pending" });
    expect(await verifyKkiapayTransaction(sandbox, "TX123456", reply(500, {}))).toEqual({ kind: "error" });
  });

  it("refuse une réponse qui parle d'une autre transaction", async () => {
    const fetcher = reply(200, { status: "SUCCESS", amount: 2000, transactionId: "AUTRE999" });
    expect(await verifyKkiapayTransaction(sandbox, "TX123456", fetcher)).toEqual({ kind: "error" });
  });

  it("ne garde pas les coordonnées du payeur", async () => {
    const fetcher = reply(200, {
      status: "SUCCESS",
      amount: 2000,
      transactionId: "TX123456",
      client: { fullname: "Jean", phone: "22997000000", email: "j@example.com" },
    });
    const result = await verifyKkiapayTransaction(sandbox, "TX123456", fetcher);
    expect(result.kind === "found" && "client" in result.raw).toBe(false);
  });
});

describe("rapprochement d'un vrai paiement avec le don", () => {
  const live: KkiapayConfig = { mode: "live", publicKey: PUBLIC, privateKey: "pk_0123456789abcdef0123", secretKey: "sk_0123456789abcdef0123" };

  function fakeBackend(tx: Record<string, unknown> | null, rpcError: unknown = null) {
    const rpc = vi.fn(async () => ({ data: "confirmed", error: rpcError }));
    const query = {
      select: () => query,
      eq: () => query,
      maybeSingle: async () => ({ data: tx, error: null }),
    };
    const backend = { db: { from: () => query, rpc }, env: {} } as unknown as FormsBackend;
    return { backend, rpc };
  }

  const pendingTx = { id: "tx-1", status: "pending", amount: 5000, provider: "kkiapay", provider_transaction_id: null };

  it("confirme un paiement réussi au bon montant", async () => {
    const { backend, rpc } = fakeBackend(pendingTx);
    const fetcher = reply(200, { status: "SUCCESS", amount: 5000, transactionId: "KK123456", partnerId: REFERENCE, source: "MOBILE_MONEY" });
    expect(await reconcileKkiapayPayment(backend, live, REFERENCE, "KK123456", fetcher)).toBe("succeeded");
    expect(rpc).toHaveBeenCalledWith(
      "confirm_payment_transaction",
      expect.objectContaining({ p_transaction_id: "tx-1", p_provider_transaction_id: "KK123456", p_amount: 5000, p_payment_method: "mobile_money" }),
    );
    const headers = vi.mocked(fetcher).mock.calls[0]![1]?.headers as Record<string, string>;
    expect(vi.mocked(fetcher).mock.calls[0]![0]).toBe("https://api.kkiapay.me/api/v1/transactions/status");
    expect(headers["x-private-key"]).toBe(live.privateKey);
    expect(headers["x-secret-key"]).toBe(live.secretKey);
  });

  it("refuse un montant différent ou une autre référence", async () => {
    const { backend, rpc } = fakeBackend(pendingTx);
    expect(
      await reconcileKkiapayPayment(backend, live, REFERENCE, "KK123456", reply(200, { status: "SUCCESS", amount: 100, transactionId: "KK123456" })),
    ).toBe("error");
    expect(
      await reconcileKkiapayPayment(
        backend,
        live,
        REFERENCE,
        "KK123456",
        reply(200, { status: "SUCCESS", amount: 5000, transactionId: "KK123456", partnerId: "UneAutreReference0123456789" }),
      ),
    ).toBe("error");
    expect(rpc).not.toHaveBeenCalled();
  });

  it("un échec ne clôt pas la tentative (nouvel essai possible)", async () => {
    const { backend, rpc } = fakeBackend(pendingTx);
    expect(
      await reconcileKkiapayPayment(backend, live, REFERENCE, "KK123456", reply(200, { status: "FAILED", amount: 5000, transactionId: "KK123456" })),
    ).toBe("failed");
    expect(rpc).not.toHaveBeenCalled();
  });

  it("ne touche jamais à la base en mode test", async () => {
    const { backend, rpc } = fakeBackend(pendingTx);
    const sandbox: KkiapayConfig = { mode: "sandbox", publicKey: PUBLIC };
    expect(await reconcileKkiapayPayment(backend, sandbox, REFERENCE, "KK123456", reply(200, {}))).toBe("error");
    expect(rpc).not.toHaveBeenCalled();
  });

  it("transaction déjà confirmée : rien à refaire", async () => {
    const { backend, rpc } = fakeBackend({ ...pendingTx, status: "succeeded" });
    const fetcher = reply(200, {});
    expect(await reconcileKkiapayPayment(backend, live, REFERENCE, "KK123456", fetcher)).toBe("succeeded");
    expect(fetcher).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
  });
});

describe("numéro prérempli dans le widget", () => {
  it("garde les chiffres et retire l'indicatif du Bénin", () => {
    expect(widgetPhone("+229 01 97 00 00 00")).toBe("0197000000");
    expect(widgetPhone("97 00 00 00")).toBe("97000000");
    expect(widgetPhone("00229 61000000")).toBe("61000000");
    expect(widgetPhone("12")).toBeUndefined();
    expect(widgetPhone(undefined)).toBeUndefined();
  });
});
