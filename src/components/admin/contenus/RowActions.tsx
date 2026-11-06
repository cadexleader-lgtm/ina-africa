"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/Button";
import type { ActionResult } from "@/server/errors";

import { ConfirmDialog } from "./ConfirmDialog";
import { moveItem } from "./form-utils";

/*
 * Actions sur une ligne d'une liste (publier / activer, supprimer, déplacer).
 * Chaque action appelle une Server Action existante, puis recharge la liste
 * (router.refresh). Le résultat est annoncé dans la zone de statut de la
 * liste (<ListAnnouncer>), sous forme d'évènement « admin:annonce ».
 */

type Result = ActionResult<unknown>;

const NETWORK_ERROR = "La connexion au serveur a échoué. Réessayez.";

/** Annonce un message dans la zone de statut de la page (voir ListAnnouncer). */
export function announce(message: string, tone: "success" | "error" = "success") {
  window.dispatchEvent(new CustomEvent("admin:annonce", { detail: { message, tone } }));
}

function useRowAction() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const execute = (action: () => Promise<Result>, success: string, after?: () => void) =>
    startTransition(async () => {
      let result: Result;
      try {
        result = await action();
      } catch {
        announce(NETWORK_ERROR, "error");
        return;
      }
      if (!result.ok) {
        announce(result.error.message, "error");
        return;
      }
      after?.();
      announce(success);
      router.refresh();
    });
  return { pending, execute };
}

/** Bouton Publier / Retirer du site (ou Activer / Désactiver). */
export function ToggleButton({
  on,
  name,
  action,
  labels,
}: {
  on: boolean;
  /** Nom de l'élément (pour un libellé de bouton explicite). */
  name: string;
  action: (next: boolean) => Promise<Result>;
  labels: { on: string; off: string; doneOn: string; doneOff: string };
}) {
  const { pending, execute } = useRowAction();
  return (
    <Button
      size="sm"
      variant={on ? "secondary" : "primary"}
      loading={pending}
      iconLeft={on ? <EyeOff /> : <Eye />}
      onClick={() => execute(() => action(!on), `${on ? labels.doneOff : labels.doneOn} : ${name}`)}
      aria-label={`${on ? labels.off : labels.on} : ${name}`}
    >
      {on ? labels.off : labels.on}
    </Button>
  );
}

/** Suppression avec confirmation. */
export function DeleteButton({
  name,
  action,
  warning,
  onDeleted,
  label = "Supprimer",
}: {
  name: string;
  action: () => Promise<Result>;
  warning?: string;
  /** Après la suppression (ex. retour à la liste depuis la page d'édition). */
  onDeleted?: () => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const { pending, execute } = useRowAction();
  return (
    <>
      <Button size="sm" variant="ghost" iconLeft={<Trash2 />} onClick={() => setOpen(true)} aria-label={`${label} : ${name}`}>
        {label}
      </Button>
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        pending={pending}
        title="Confirmer la suppression"
        onConfirm={() =>
          execute(action, `Supprimé : ${name}`, () => {
            setOpen(false);
            onDeleted?.();
          })
        }
      >
        <p>
          Supprimer <strong className="text-brand">« {name} »</strong> ? Cette action est définitive.
        </p>
        {warning && <p className="text-muted">{warning}</p>}
      </ConfirmDialog>
    </>
  );
}

/** Boutons Monter / Descendre (ordre d'affichage sur le site). */
export function MoveButtons({
  ids,
  index,
  name,
  action,
}: {
  /** Identifiants de la liste COMPLÈTE, dans l'ordre affiché. */
  ids: string[];
  index: number;
  name: string;
  action: (input: { ids: string[] }) => Promise<Result>;
}) {
  const { pending, execute } = useRowAction();
  const move = (direction: -1 | 1) => {
    const next = moveItem(ids, index, direction);
    if (!next) return;
    execute(() => action({ ids: next }), `${name} : ${direction < 0 ? "monté" : "descendu"} d'un rang (position ${index + 1 + direction} sur ${ids.length})`);
  };
  return (
    <div className="flex gap-1">
      <Button
        size="sm"
        variant="ghost"
        className="px-2"
        disabled={pending || index === 0}
        onClick={() => move(-1)}
        aria-label={`Monter : ${name}`}
      >
        <ArrowUp aria-hidden="true" />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="px-2"
        disabled={pending || index === ids.length - 1}
        onClick={() => move(1)}
        aria-label={`Descendre : ${name}`}
      >
        <ArrowDown aria-hidden="true" />
      </Button>
    </div>
  );
}
