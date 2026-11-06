"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { Alert } from "@/components/ui/Alert";
import { Button, type ButtonVariant } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

export type ActionOutcome = { ok: true } | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

/**
 * Confirmation d'une action importante (suppression, annulation, retrait
 * d'accès). Le bouton de confirmation dit exactement ce qui va se passer ;
 * « Annuler » ferme sans rien faire. Une erreur s'affiche dans le dialogue
 * (annoncée aux lecteurs d'écran) et le dialogue reste ouvert.
 */
export function ConfirmDialog({
  open,
  onClose,
  title,
  description,
  confirmLabel,
  pendingLabel,
  confirmVariant = "primary",
  onConfirm,
  children,
  formId,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  confirmLabel: string;
  pendingLabel?: string;
  confirmVariant?: ButtonVariant;
  /** Renvoie le résultat ; en cas de succès le dialogue se ferme. */
  onConfirm: () => Promise<ActionOutcome>;
  /** Champs supplémentaires (ex. motif obligatoire). */
  children?: ReactNode;
  /** Identifiant du formulaire (Entrée dans un champ = confirmer). */
  formId?: string;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [failedAt, setFailedAt] = useState(0);
  const body = useRef<HTMLDivElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  // Après un refus : focus sur le champ en erreur, sinon sur le message.
  useEffect(() => {
    if (!failedAt) return;
    const invalid = body.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
    (invalid ?? errorRef.current)?.focus();
  }, [failedAt]);

  async function confirm() {
    setPending(true);
    setError(null);
    try {
      const outcome = await onConfirm();
      if (outcome.ok) onClose();
      else {
        setError(outcome.message);
        setFailedAt(Date.now());
      }
    } catch {
      setError("Une erreur est survenue. Réessayez dans un instant.");
      setFailedAt(Date.now());
    } finally {
      setPending(false);
    }
  }

  function close() {
    if (pending) return;
    setError(null);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={close} disabled={pending}>
            Annuler
          </Button>
          <Button
            variant={confirmVariant}
            type={formId ? "submit" : "button"}
            form={formId}
            onClick={formId ? undefined : confirm}
            loading={pending}
            loadingLabel={pendingLabel}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div ref={body} className="flex flex-col gap-4">
        {description && <div className="text-body text-ink">{description}</div>}
        {formId ? (
          <form
            id={formId}
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              void confirm();
            }}
            className="flex flex-col gap-4"
          >
            {children}
          </form>
        ) : (
          children
        )}
        <div ref={errorRef} tabIndex={-1} className="focus:outline-none empty:hidden">
          {error && <Alert tone="error">{error}</Alert>}
        </div>
      </div>
    </Modal>
  );
}

/** Résultat d'une Server Action → issue d'une confirmation. */
export function toOutcome(result: { ok: true } | { ok: false; error: { message: string; fieldErrors?: Record<string, string[]> } }): ActionOutcome {
  return result.ok ? { ok: true } : { ok: false, message: result.error.message, fieldErrors: result.error.fieldErrors };
}
