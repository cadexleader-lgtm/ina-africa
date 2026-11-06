"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, CheckCheck, Mail, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { deleteRequest, updateRequestStatus } from "@/server/actions/admin/inbox";

import { ConfirmDialog, toOutcome } from "./ConfirmDialog";
import { refocusWithin } from "./focus";
import { LiveStatus, type LiveMessage } from "./LiveStatus";
import type { RequestStatus } from "./labels";

const DONE_MESSAGES: Record<RequestStatus, string> = {
  unread: "La demande est de nouveau marquée comme non lue.",
  read: "La demande est marquée comme lue.",
  processed: "La demande est marquée comme traitée.",
  archived: "La demande est archivée.",
};

/**
 * Suivi d'une demande : passage automatique à « lue » à l'ouverture, puis
 * traitée, archivée, ou de nouveau non lue ; suppression avec confirmation
 * (à la demande de la personne, droit à l'effacement).
 */
export function RequestActions({ id, status, name }: { id: string; status: RequestStatus; name: string }) {
  const router = useRouter();
  const [pending, setPending] = useState<RequestStatus | null>(null);
  const [message, setMessage] = useState<LiveMessage>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const autoRead = useRef(false);
  const zone = useRef<HTMLDivElement>(null);

  async function setStatus(next: RequestStatus, silent = false) {
    setPending(next);
    if (!silent) setMessage(null);
    try {
      const result = await updateRequestStatus({ id, status: next });
      if (result.ok) {
        setMessage({ tone: "success", text: DONE_MESSAGES[next] });
        router.refresh();
      } else if (!silent) {
        setMessage({ tone: "error", text: result.error.message });
      }
    } catch {
      if (!silent) setMessage({ tone: "error", text: "Le statut n'a pas pu être changé. Réessayez dans un instant." });
    } finally {
      setPending(null);
      if (!silent) refocusWithin(zone.current);
    }
  }

  // Ouvrir une demande non lue la marque comme lue (une seule fois).
  useEffect(() => {
    if (status !== "unread" || autoRead.current) return;
    autoRead.current = true;
    void setStatus("read", true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- uniquement à l'ouverture
  }, []);

  const buttons: { next: RequestStatus; label: string; icon: React.ReactNode }[] = [
    { next: "processed", label: "Marquer comme traitée", icon: <CheckCheck /> },
    { next: "archived", label: "Archiver", icon: <Archive /> },
    { next: "unread", label: "Marquer comme non lue", icon: <Mail /> },
  ];

  return (
    <div ref={zone} className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-3">
        {buttons
          .filter((button) => button.next !== status)
          .map((button) => (
            <Button
              key={button.next}
              variant="secondary"
              size="sm"
              iconLeft={button.icon}
              loading={pending === button.next}
              disabled={pending !== null}
              onClick={() => void setStatus(button.next)}
            >
              {button.label}
            </Button>
          ))}
        <Button variant="ghost" size="sm" iconLeft={<Trash2 />} disabled={pending !== null} onClick={() => setConfirmDelete(true)}>
          Supprimer
        </Button>
      </div>
      <LiveStatus message={message} />
      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Supprimer cette demande ?"
        description={
          <p>
            La demande de {name} sera supprimée définitivement, avec les coordonnées qu&apos;elle contient. À faire
            notamment si la personne demande l&apos;effacement de ses données. Pour simplement la ranger, utilisez
            plutôt « Archiver ».
          </p>
        }
        confirmLabel="Supprimer définitivement"
        pendingLabel="Suppression…"
        onConfirm={async () => {
          const result = await deleteRequest({ id });
          if (result.ok) router.replace("/admin/demandes?supprimee=1");
          return toOutcome(result);
        }}
      />
    </div>
  );
}
