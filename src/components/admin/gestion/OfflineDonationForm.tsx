"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { Plus, Save } from "lucide-react";

import { Alert } from "@/components/ui/Alert";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Checkbox, FieldError, FormField, Input, Select, Textarea } from "@/components/ui/FormField";
import { parseAmount } from "@/lib/money";
import { recordOfflineDonation } from "@/server/actions/admin/donations";

import { formatFcfa } from "./labels";
import { ProofUploadField, type ProofState } from "./ProofUploadField";

type CampaignOption = { id: string; title: string; isActive: boolean };

type Errors = Record<string, string[] | undefined>;

type Saved = { id: string; reference: string; amount: number };

const FOCUSABLE = "input, select, textarea";

/**
 * Saisie d'un don HORS LIGNE (Mobile Money ou virement) déjà reçu par
 * l'ONG. La clé d'idempotence est créée à l'affichage du formulaire : un
 * double clic ou un nouvel essai après une coupure n'enregistre qu'un don.
 * Aucun paiement en ligne n'est saisi ni confirmé ici.
 */
export function OfflineDonationForm({
  idempotencyKey: initialKey,
  campaigns,
  maxDate,
}: {
  idempotencyKey: string;
  campaigns: CampaignOption[];
  /** Date la plus récente acceptée (aujourd'hui, comme la base). */
  maxDate: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const messageRef = useRef<HTMLDivElement>(null);
  const [idempotencyKey, setIdempotencyKey] = useState(initialKey);
  const [method, setMethod] = useState<"mobile_money" | "bank_transfer" | "">("");
  const [amountText, setAmountText] = useState("");
  const [proof, setProof] = useState<ProofState>({ status: "idle" });
  const [errors, setErrors] = useState<Errors>({});
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState<Saved | null>(null);
  const [respondedAt, setRespondedAt] = useState(0);

  // Après une réponse : focus sur le premier champ en erreur, sinon sur le message.
  useEffect(() => {
    if (!respondedAt) return;
    const invalid = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"], [data-invalid="true"]');
    if (invalid?.matches(FOCUSABLE)) invalid.focus();
    else messageRef.current?.focus();
  }, [respondedAt]);

  const error = (name: string) => errors[name]?.[0];
  const amountPreview = parseAmount(amountText);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || proof.status === "uploading") return;
    const data = new FormData(event.currentTarget);
    setPending(true);
    setMessage(null);
    try {
      const result = await recordOfflineDonation({
        amount: data.get("amount"),
        receivedOn: data.get("receivedOn"),
        paymentMethod: data.get("paymentMethod") ?? "",
        operatorOrBank: data.get("operatorOrBank"),
        externalReference: data.get("externalReference"),
        donorName: data.get("donorName"),
        donorEmail: data.get("donorEmail"),
        donorPhone: data.get("donorPhone"),
        isAnonymous: data.get("isAnonymous") === "on",
        campaignId: data.get("campaignId"),
        donorMessage: data.get("donorMessage"),
        proofPath: proof.status === "done" ? proof.proof.path : null,
        idempotencyKey,
      });
      if (result.ok) {
        setErrors({});
        setSaved({ id: result.data.id, reference: result.data.reference, amount: amountPreview ?? 0 });
      } else {
        setErrors(result.error.fieldErrors ?? {});
        setMessage(
          result.error.fieldErrors?.idempotencyKey?.[0] ??
            result.error.fieldErrors?._form?.[0] ??
            result.error.message,
        );
      }
    } catch {
      setMessage("Le don n'a pas pu être enregistré. Vérifiez votre connexion puis réessayez.");
    } finally {
      setPending(false);
      setRespondedAt(Date.now());
    }
  }

  function startOver() {
    formRef.current?.reset();
    setIdempotencyKey(crypto.randomUUID());
    setMethod("");
    setAmountText("");
    setProof({ status: "idle" });
    setErrors({});
    setMessage(null);
    setSaved(null);
    setRespondedAt(0);
    window.setTimeout(() => formRef.current?.querySelector<HTMLElement>("input")?.focus(), 0);
  }

  if (saved) {
    return (
      <div ref={messageRef} tabIndex={-1} className="focus:outline-none">
        <Alert
          tone="success"
          title="Don enregistré"
          action={
            <div className="flex flex-wrap gap-3">
              <Link href={`/admin/dons/${saved.id}`} className={buttonClasses({ variant: "secondary", size: "sm" })}>
                Voir le don
              </Link>
              <Button variant="ghost" size="sm" iconLeft={<Plus />} onClick={startOver}>
                Enregistrer un autre don
              </Button>
            </div>
          }
        >
          Le don {saved.amount ? `de ${formatFcfa(saved.amount)} ` : ""}a été enregistré sous la référence{" "}
          <strong className="font-semibold">{saved.reference}</strong>. Il compte désormais dans les dons hors ligne.
        </Alert>
      </div>
    );
  }

  const operatorLabel =
    method === "bank_transfer" ? "Banque" : method === "mobile_money" ? "Opérateur Mobile Money" : "Opérateur ou banque";

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="flex flex-col gap-8">
      <div ref={messageRef} tabIndex={-1} className="focus:outline-none empty:hidden">
        {message && <Alert tone="error">{message}</Alert>}
      </div>

      <fieldset className="flex flex-col gap-5 rounded-card border border-line bg-white p-5 sm:p-6">
        <legend className="px-1 font-heading text-h4 text-brand">Le don reçu</legend>

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            id="don-montant"
            label="Montant reçu (FCFA)"
            hint={amountPreview ? `Soit ${formatFcfa(amountPreview)}.` : "Nombre entier, sans centimes. Ex. : 25 000"}
            error={error("amount")}
            required
          >
            {(field) => (
              <Input
                {...field}
                name="amount"
                inputMode="numeric"
                autoComplete="off"
                value={amountText}
                onChange={(event) => setAmountText(event.currentTarget.value)}
              />
            )}
          </FormField>

          <FormField
            id="don-date"
            label="Date de réception"
            hint="Jour où l'argent a été reçu (pas dans le futur)."
            error={error("receivedOn")}
            required
          >
            {(field) => <Input {...field} name="receivedOn" type="date" max={maxDate} defaultValue={maxDate} />}
          </FormField>
        </div>

        <fieldset
          aria-describedby={error("paymentMethod") ? "don-mode-erreur" : undefined}
          className="flex flex-col gap-3"
        >
          <legend className="text-small font-semibold text-brand">
            Mode de réception
            <span className="text-danger" aria-hidden="true">
              {" "}
              *
            </span>
          </legend>
          <div className="flex flex-wrap gap-x-8 gap-y-3">
            {(
              [
                ["mobile_money", "Mobile Money"],
                ["bank_transfer", "Virement bancaire"],
              ] as const
            ).map(([value, label]) => (
              <div key={value} className="flex items-center gap-3">
                <input
                  id={`don-mode-${value}`}
                  type="radio"
                  name="paymentMethod"
                  value={value}
                  required
                  checked={method === value}
                  onChange={() => setMethod(value)}
                  data-invalid={error("paymentMethod") ? "true" : undefined}
                  className="size-5 cursor-pointer accent-brand"
                />
                <label htmlFor={`don-mode-${value}`} className="cursor-pointer text-body text-ink">
                  {label}
                </label>
              </div>
            ))}
          </div>
          {error("paymentMethod") && <FieldError id="don-mode-erreur">{error("paymentMethod")}</FieldError>}
        </fieldset>

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            id="don-operateur"
            label={operatorLabel}
            hint={method === "bank_transfer" ? "Ex. : nom de la banque émettrice." : "Ex. : MTN, Moov."}
            error={error("operatorOrBank")}
          >
            {(field) => <Input {...field} name="operatorOrBank" maxLength={100} autoComplete="off" />}
          </FormField>

          <FormField
            id="don-reference"
            label="Référence de l'opération"
            hint="Identifiant de la transaction ou du virement (évite les doublons)."
            error={error("externalReference")}
          >
            {(field) => <Input {...field} name="externalReference" maxLength={100} autoComplete="off" spellCheck={false} />}
          </FormField>
        </div>

        {campaigns.length > 0 && (
          <FormField
            id="don-appel"
            label="Appel aux dons (facultatif)"
            hint="Si le don répond à un appel aux dons précis."
            error={error("campaignId")}
          >
            {(field) => (
              <Select {...field} name="campaignId" defaultValue="">
                <option value="">Aucun appel en particulier</option>
                {campaigns.map((campaign) => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.title}
                    {campaign.isActive ? "" : " (inactif)"}
                  </option>
                ))}
              </Select>
            )}
          </FormField>
        )}

        <ProofUploadField state={proof} onChange={setProof} serverError={error("proofPath")} disabled={pending} />
      </fieldset>

      <fieldset className="flex flex-col gap-5 rounded-card border border-line bg-white p-5 sm:p-6">
        <legend className="px-1 font-heading text-h4 text-brand">Le donateur (facultatif)</legend>
        <p className="-mt-2 text-small text-muted">
          Laissez vide si le donateur n&apos;est pas connu. Ne notez que ce qui est utile au suivi du don.
        </p>

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField id="don-nom" label="Nom" error={error("donorName")}>
            {(field) => <Input {...field} name="donorName" maxLength={120} autoComplete="off" />}
          </FormField>
          <FormField id="don-email" label="Email" error={error("donorEmail")}>
            {(field) => <Input {...field} name="donorEmail" type="email" autoComplete="off" spellCheck={false} />}
          </FormField>
          <FormField id="don-telephone" label="Téléphone" error={error("donorPhone")}>
            {(field) => <Input {...field} name="donorPhone" type="tel" autoComplete="off" />}
          </FormField>
        </div>

        <Checkbox
          id="don-anonyme"
          name="isAnonymous"
          label="Le donateur souhaite rester anonyme"
          hint="Son nom ne sera jamais affiché sur le site."
          error={error("isAnonymous")}
        />

        <FormField id="don-message" label="Message ou remarque" error={error("donorMessage")}>
          {(field) => <Textarea {...field} name="donorMessage" rows={3} maxLength={1000} />}
        </FormField>
      </fieldset>

      <div className="flex flex-wrap items-center gap-4">
        <Button
          type="submit"
          loading={pending}
          loadingLabel="Enregistrement…"
          disabled={proof.status === "uploading"}
          iconLeft={<Save />}
        >
          Enregistrer le don
        </Button>
        {proof.status === "uploading" && (
          <p className="text-small text-muted">Patientez : le justificatif est en cours d&apos;envoi.</p>
        )}
      </div>
    </form>
  );
}
