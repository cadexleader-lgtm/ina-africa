"use client";

import type { ReactNode } from "react";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

/**
 * Boîte de confirmation (suppression, dépublication…) : dialogue modal
 * natif (focus gardé, Échap ferme, retour du focus sur le bouton d'origine).
 * Le bouton d'annulation est le premier : un appui sur Entrée par réflexe ne
 * supprime rien.
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  children,
  confirmLabel = "Supprimer définitivement",
  pending = false,
  danger = true,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  children?: ReactNode;
  confirmLabel?: string;
  pending?: boolean;
  danger?: boolean;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={pending} autoFocus>
            Annuler
          </Button>
          <Button
            variant="primary"
            onClick={onConfirm}
            loading={pending}
            loadingLabel="Un instant…"
            iconLeft={danger ? <Trash2 /> : undefined}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3 text-body">{children}</div>
    </Modal>
  );
}
