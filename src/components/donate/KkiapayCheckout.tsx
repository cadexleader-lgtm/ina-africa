"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CreditCard, RotateCcw } from "lucide-react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { DONATE_TEXT } from "@/content/fr/forms";
import { formatFcfa } from "@/lib/money";
import type { KkiapayCheckout as Checkout, PaymentCheckResult } from "@/lib/payments/checkout";
import { checkOnlinePayment } from "@/server/actions/donations";

/**
 * Fenêtre de paiement KKiaPay (SDK officiel https://cdn.kkiapay.me/k.js,
 * chargé seulement ici, au moment de payer).
 *
 * Le navigateur ne décide de rien : à la fin du paiement, il transmet
 * l'identifiant KKiaPay au serveur, qui relit le paiement chez KKiaPay
 * (checkOnlinePayment). En mode réel, le visiteur est ensuite envoyé sur la
 * page de suivi du don.
 */

const SDK_URL = "https://cdn.kkiapay.me/k.js";
const THEME = "#17465a";

type KkiapayWindow = Window & {
  openKkiapayWidget?: (options: Record<string, unknown>) => void;
  closeKkiapayWidget?: () => void;
  addSuccessListener?: (listener: (response: { transactionId?: string } | undefined) => void) => void;
  addFailedListener?: (listener: (error: unknown) => void) => void;
  addKkiapayCloseListener?: (listener: () => void) => void;
};

let sdkPromise: Promise<void> | null = null;

function loadSdk(): Promise<void> {
  const w = window as KkiapayWindow;
  if (w.openKkiapayWidget) return Promise.resolve();
  if (!sdkPromise) {
    sdkPromise = new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = SDK_URL;
      script.async = true;
      script.onload = () => (w.openKkiapayWidget ? resolve() : reject(new Error("sdk")));
      script.onerror = () => reject(new Error("sdk"));
      document.body.appendChild(script);
    }).catch((error) => {
      sdkPromise = null; // nouvel essai possible
      throw error;
    });
  }
  return sdkPromise;
}

type Phase =
  | { kind: "loading" }
  | { kind: "open" }
  | { kind: "closed" }
  | { kind: "script_failed" }
  | { kind: "checking" }
  | { kind: "failed"; message: string }
  | { kind: "pending" }
  | { kind: "error"; message: string }
  | { kind: "test_succeeded"; amount: number };

export function KkiapayCheckout({ checkout, editHref }: { checkout: Checkout; editHref: string }) {
  const C = DONATE_TEXT.checkout;
  const [phase, setPhase] = useState<Phase>({ kind: "loading" });
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const doneRef = useRef(false);
  const messageRef = useRef<HTMLDivElement>(null);

  const verify = useCallback(
    async (transactionId: string) => {
      setPhase({ kind: "checking" });
      let result: PaymentCheckResult;
      try {
        result = await checkOnlinePayment(checkout.reference, transactionId);
      } catch {
        result = { status: "error", message: C.checkFailed };
      }
      if ((result.status === "succeeded" || result.status === "pending") && result.trackingUrl) {
        doneRef.current = true;
        window.location.assign(result.trackingUrl);
        return;
      }
      if (result.status === "test_succeeded") {
        doneRef.current = true;
        setPhase({ kind: "test_succeeded", amount: result.amount });
      } else if (result.status === "failed") setPhase({ kind: "failed", message: result.message });
      else if (result.status === "error") setPhase({ kind: "error", message: result.message });
      else setPhase({ kind: "pending" });
    },
    [checkout.reference, C.checkFailed],
  );

  const open = useCallback(async () => {
    setPhase({ kind: "loading" });
    try {
      await loadSdk();
    } catch {
      setPhase({ kind: "script_failed" });
      return;
    }
    const w = window as KkiapayWindow;
    w.addSuccessListener?.((response) => {
      const id = response?.transactionId;
      if (typeof id !== "string" || !id) return;
      setTransactionId(id);
      w.closeKkiapayWidget?.();
      void verify(id);
    });
    w.addFailedListener?.(() => {
      // Le visiteur peut réessayer dans la même fenêtre : rien n'est clos.
      setPhase({ kind: "failed", message: C.failed });
    });
    w.addKkiapayCloseListener?.(() => {
      setPhase((current) => (current.kind === "open" || current.kind === "loading" ? { kind: "closed" } : current));
    });

    const options: Record<string, unknown> = {
      amount: checkout.amount,
      key: checkout.publicKey,
      sandbox: checkout.sandbox,
      position: "center",
      theme: THEME,
      partnerId: checkout.reference,
      data: checkout.reference,
      reason: checkout.reason,
    };
    if (checkout.name) options.name = checkout.name;
    if (checkout.email) options.email = checkout.email;
    if (checkout.phone) options.phone = checkout.phone;
    w.openKkiapayWidget?.(options);
    setPhase({ kind: "open" });
  }, [checkout, verify, C.failed]);

  // Ouverture automatique, une seule fois.
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void open();
    return () => {
      if (!doneRef.current) (window as KkiapayWindow).closeKkiapayWidget?.();
    };
  }, [open]);

  useEffect(() => {
    if (phase.kind !== "loading" && phase.kind !== "open") messageRef.current?.focus();
  }, [phase.kind]);

  const amount = formatFcfa(checkout.amount);

  if (phase.kind === "test_succeeded") {
    return (
      <div ref={messageRef} tabIndex={-1} className="flex flex-col gap-5 focus:outline-none">
        <Alert tone="success" title={C.testSucceededTitle} role="status">
          <p>{C.testSucceededText(formatFcfa(phase.amount))}</p>
        </Alert>
        <p>
          <a href={editHref} className="font-semibold text-link underline underline-offset-4 hover:text-link-strong">
            {C.another}
          </a>
        </p>
      </div>
    );
  }

  const busy = phase.kind === "loading" || phase.kind === "checking";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-h3">{C.title}</h2>
          {checkout.sandbox && (
            <span className="inline-flex items-center rounded-full border border-gold bg-gold-50 px-3 py-0.5 text-small font-semibold text-brand">
              {C.testBadge}
            </span>
          )}
        </div>
        <p className="text-body text-ink">{C.intro(amount)}</p>
      </div>

      <div ref={messageRef} tabIndex={-1} className="empty:hidden focus:outline-none" aria-live="polite">
        {phase.kind === "checking" && <p className="text-body text-muted">{C.checking}</p>}
        {phase.kind === "closed" && (
          <Alert tone="info" role="status">
            <p>{C.closed}</p>
          </Alert>
        )}
        {phase.kind === "script_failed" && (
          <Alert tone="error" role="alert">
            <p>{C.scriptFailed}</p>
          </Alert>
        )}
        {(phase.kind === "failed" || phase.kind === "error") && (
          <Alert tone="error" role="alert">
            <p>{phase.message}</p>
          </Alert>
        )}
        {phase.kind === "pending" && (
          <Alert tone="warning" role="status">
            <p>{C.pendingTest}</p>
          </Alert>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        {phase.kind === "pending" || (phase.kind === "error" && transactionId) ? (
          <Button
            type="button"
            variant="primary"
            iconLeft={<RotateCcw aria-hidden="true" />}
            onClick={() => transactionId && void verify(transactionId)}
          >
            {C.retryCheck}
          </Button>
        ) : (
          <Button
            type="button"
            variant="donate"
            loading={busy}
            loadingLabel={phase.kind === "checking" ? C.checking : C.loading}
            iconLeft={<CreditCard aria-hidden="true" />}
            onClick={() => void open()}
          >
            {C.open}
          </Button>
        )}
        <a href={editHref} className="font-semibold text-link underline-offset-4 hover:text-link-strong hover:underline">
          {C.edit}
        </a>
      </div>
    </div>
  );
}
