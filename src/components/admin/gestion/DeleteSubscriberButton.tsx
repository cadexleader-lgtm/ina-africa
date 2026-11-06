"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { deleteNewsletterSubscriber } from "@/server/actions/admin/inbox";

import { ConfirmDialog, toOutcome } from "./ConfirmDialog";

/** Suppression définitive d'un inscrit (droit à l'effacement), avec confirmation. */
export function DeleteSubscriberButton({ id, email, returnHref }: { id: string; email: string; returnHref: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="ghost" size="sm" iconLeft={<Trash2 />} onClick={() => setOpen(true)}>
        Supprimer<span className="sr-only"> {email}</span>
      </Button>
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        title="Supprimer cet inscrit ?"
        description={
          <p>
            L&apos;adresse <strong className="font-semibold break-all">{email}</strong> sera supprimée définitivement de la
            liste. Elle ne recevra plus la lettre d&apos;information (la personne pourra se réinscrire elle-même).
          </p>
        }
        confirmLabel="Supprimer définitivement"
        pendingLabel="Suppression…"
        onConfirm={async () => {
          const result = await deleteNewsletterSubscriber({ id });
          if (result.ok) router.replace(returnHref, { scroll: false });
          return toOutcome(result);
        }}
      />
    </>
  );
}
