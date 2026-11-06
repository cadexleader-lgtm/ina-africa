"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, ExternalLink, FileText } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { FormField, Textarea } from "@/components/ui/FormField";
import { T } from "@/content/fr/site";
import { cancelOfflineDonation } from "@/server/actions/admin/donations";
import { getPrivateDocumentUrl } from "@/server/actions/admin/media";

import { ConfirmDialog } from "./ConfirmDialog";
import { refocusWithin } from "./focus";
import { LiveStatus, type LiveMessage } from "./LiveStatus";
import { formatFcfa } from "./labels";

/**
 * Ouverture d'un justificatif : le serveur fournit une adresse temporaire
 * (5 minutes) ; un lien s'affiche alors (pas de fenêtre surgissante bloquée
 * par le navigateur).
 */
export function ProofLink({ mediaId }: { mediaId: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<LiveMessage>(null);
  const zone = useRef<HTMLDivElement>(null);

  async function prepare() {
    setPending(true);
    setMessage(null);
    try {
      const result = await getPrivateDocumentUrl({ id: mediaId });
      if (result.ok) {
        setUrl(result.data.url);
        setMessage({ tone: "success", text: "Le justificatif est prêt : le lien est valable 5 minutes." });
        window.setTimeout(() => setUrl(null), result.data.expiresIn * 1000);
      } else {
        setMessage({ tone: "error", text: result.error.message });
      }
    } catch {
      setMessage({ tone: "error", text: "Le justificatif ne peut pas être affiché pour le moment." });
    } finally {
      setPending(false);
      refocusWithin(zone.current);
    }
  }

  return (
    <div ref={zone} className="flex flex-col items-start gap-2">
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center gap-2 font-semibold text-link underline-offset-4 hover:text-link-strong hover:underline [&_svg]:size-4.5"
        >
          <ExternalLink aria-hidden="true" />
          Ouvrir le justificatif
          <span className="sr-only"> {T.a11y.newTab}</span>
        </a>
      ) : (
        <Button variant="secondary" size="sm" onClick={prepare} loading={pending} loadingLabel="Préparation…" iconLeft={<FileText />}>
          Afficher le justificatif
        </Button>
      )}
      <LiveStatus message={message} />
    </div>
  );
}

/** Annulation d'un don HORS LIGNE saisi par erreur (motif obligatoire, jamais de suppression). */
export function CancelDonationButton({ donationId, reference, amount }: { donationId: string; reference: string; amount: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-start gap-2">
      <Button
        variant="secondary"
        size="sm"
        iconLeft={<Ban />}
        onClick={() => {
          setReasonError(null);
          setOpen(true);
        }}
      >
        Annuler ce don
      </Button>
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        title="Annuler ce don hors ligne ?"
        description={
          <p>
            Le don {reference} de {formatFcfa(amount)} ne sera plus compté dans les totaux. Il reste visible dans la liste
            avec le statut « Annulé » et le motif indiqué. Cette annulation est définitive.
          </p>
        }
        confirmLabel="Annuler le don"
        pendingLabel="Annulation…"
        formId="annuler-don"
        onConfirm={async () => {
          if (reason.trim().length < 3) {
            setReasonError("Indiquez le motif de l'annulation.");
            return { ok: false, message: "Le motif de l'annulation est obligatoire." };
          }
          setReasonError(null);
          const result = await cancelOfflineDonation({ id: donationId, reason });
          if (!result.ok) {
            const fieldError = result.error.fieldErrors?.reason?.[0] ?? null;
            setReasonError(fieldError);
            return { ok: false, message: fieldError ? "Indiquez le motif de l'annulation." : result.error.message };
          }
          router.replace(`/admin/dons/${donationId}?annule=1`);
          return { ok: true };
        }}
      >
        <FormField
          id="annulation-motif"
          label="Motif de l'annulation"
          hint="Ex. : saisi deux fois, montant erroné (un nouveau don correct sera saisi)."
          error={reasonError}
          required
        >
          {(field) => (
            <Textarea
              {...field}
              name="reason"
              rows={3}
              maxLength={500}
              value={reason}
              onChange={(event) => setReason(event.currentTarget.value)}
            />
          )}
        </FormField>
      </ConfirmDialog>
    </div>
  );
}
