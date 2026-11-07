"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type FormEvent, type ReactNode, type RefObject } from "react";
import { Heart, ShieldCheck } from "lucide-react";

import { Checkbox, FieldError } from "@/components/ui/FormField";
import type { OrgContacts } from "@/components/forms/ContactAlternatives";
import { LineField, TextAreaField } from "@/components/forms/fields";
import { FORM_IDS } from "@/components/forms/ids";
import { ConsentField, PublicForm, type FieldHelpers, type FormAction } from "@/components/forms/PublicForm";
import { KkiapayCheckout } from "@/components/donate/KkiapayCheckout";
import { Alert } from "@/components/ui/Alert";
import { DONATE_TEXT } from "@/content/fr/forms";
import { formatFcfa, parseAmount } from "@/lib/money";
import { LIMITS } from "@/lib/validation/forms";

/**
 * Formulaire de don EN LIGNE. N'est rendu QUE si un prestataire réel est
 * actif (décidé par le serveur, voir OnlineDonation). Le montant est revalidé
 * côté serveur ; le paiement se fait chez le prestataire.
 */
type DonationFormProps = {
  action: FormAction;
  security: ReactNode;
  contacts: OrgContacts;
  suggestedAmounts: number[];
  minAmount: number;
  providerLabel: string;
  /** Paiements de TEST (sandbox KKiaPay) : bandeau explicite, rien n'est enregistré. */
  testMode?: boolean;
  campaign?: { slug: string; title: string };
};

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign"] as const;

const noSubscription = () => () => {};
const readSearch = () => window.location.search;
const readNoSearch = () => "";

/**
 * Clé anti double-soumission : créée dans le navigateur (jamais pendant le
 * prérendu de la page, qui la figerait pour tous les visiteurs), puis gardée
 * tant que la page est ouverte, même quand le formulaire est réaffiché.
 */
function IdempotencyKeyField({ keyRef }: { keyRef: RefObject<string | null> }) {
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!keyRef.current) keyRef.current = crypto.randomUUID();
    if (inputRef.current) inputRef.current.value = keyRef.current;
  }, [keyRef]);
  return <input ref={inputRef} type="hidden" name="idempotencyKey" defaultValue="" />;
}

function AmountField({ field, suggested, minAmount }: { field: FieldHelpers; suggested: number[]; minAmount: number }) {
  const O = DONATE_TEXT.online;
  const error = field.error("amount");
  const errorId = `${field.id("amount")}-erreur`;
  const previousChoice = field.value("amountChoice");
  const initialChoice = previousChoice ?? (suggested.length > 0 ? String(suggested[0]) : "autre");
  const option =
    "flex min-h-12 cursor-pointer items-center justify-center rounded-field border border-line-strong bg-white px-4 font-semibold text-brand tabular-nums transition-colors " +
    "hover:border-brand has-[:checked]:border-brand has-[:checked]:bg-brand has-[:checked]:text-white " +
    "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-(--focus-ring-color)";

  // Saisir un montant libre sélectionne « Autre montant » (sans JavaScript : le visiteur le coche lui-même).
  function selectOther(event: FormEvent<HTMLDivElement>) {
    const radio = event.currentTarget.closest("fieldset")?.querySelector<HTMLInputElement>('input[value="autre"]');
    if (radio) radio.checked = true;
  }

  return (
    <fieldset
      role="radiogroup"
      aria-required="true"
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? errorId : undefined}
      className="flex flex-col gap-3"
    >
      <legend className="mb-1 text-small font-semibold text-brand">
        {O.amountLegend}
        <span className="text-danger" aria-hidden="true">
          {" "}
          *
        </span>
      </legend>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[...suggested.map(String), "autre"].map((value) => (
          <label key={value} className={option}>
            <input type="radio" name="amountChoice" value={value} defaultChecked={initialChoice === value} className="sr-only" />
            {value === "autre" ? O.otherAmount : formatFcfa(Number(value))}
          </label>
        ))}
      </div>
      <div onInput={selectOther}>
        <LineField
          field={field}
          name="customAmount"
          label={O.customAmount}
          hint={O.customAmountHint(formatFcfa(minAmount))}
          maxLength={15}
          inputMode="text"
          autoComplete="off"
        />
      </div>
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </fieldset>
  );
}

export function DonationForm({
  action,
  security,
  contacts,
  suggestedAmounts,
  minAmount,
  providerLabel,
  testMode = false,
  campaign,
}: DonationFormProps) {
  const O = DONATE_TEXT.online;
  // Clé anti double-soumission : la même tant que la page est ouverte (voir IdempotencyKeyField).
  const idempotencyKeyRef = useRef<string | null>(null);
  // Montant choisi, repris sur le bouton (« Je donne 5 000 FCFA ») ; le serveur revalide tout.
  const [amount, setAmount] = useState<number | null>(suggestedAmounts[0] ?? null);
  function trackAmount(event: FormEvent<HTMLDivElement>) {
    const root = event.currentTarget;
    const choice = root.querySelector<HTMLInputElement>('input[name="amountChoice"]:checked')?.value;
    const custom = root.querySelector<HTMLInputElement>('input[name="customAmount"]')?.value;
    setAmount(choice && choice !== "autre" ? Number(choice) : parseAmount(custom));
  }
  const validAmount = amount !== null && Number.isSafeInteger(amount) && amount >= minAmount ? amount : null;
  // Provenance (liens partagés avec ?utm_source=…) : lue dans le navigateur, revalidée par le serveur.
  const search = useSyncExternalStore(noSubscription, readSearch, readNoSearch);
  const utm = useMemo(() => {
    const params = new URLSearchParams(search);
    return Object.fromEntries(UTM_KEYS.map((key) => [key, (params.get(key) ?? "").slice(0, 100)]));
  }, [search]);

  return (
    <PublicForm
      id={FORM_IDS.donation}
      action={action}
      contacts={contacts}
      submitLabel={validAmount ? O.submitWithAmount(formatFcfa(validAmount)) : O.submit}
      submittingLabel={O.submitting}
      submitIcon={<Heart aria-hidden="true" />}
      renderCheckout={(state) =>
        state.checkout ? (
          <KkiapayCheckout
            checkout={state.checkout}
            editHref={campaign ? `/faire-un-don/${encodeURIComponent(campaign.slug)}` : "/faire-un-don"}
            cause={campaign?.title ?? null}
          />
        ) : null
      }
      security={
        <>
          {security}
          <IdempotencyKeyField keyRef={idempotencyKeyRef} />
          {campaign && <input type="hidden" name="campaign" value={campaign.slug} />}
          {UTM_KEYS.map((key) => (utm[key] ? <input key={key} type="hidden" name={key} value={utm[key]} /> : null))}
        </>
      }
    >
      {(field) => (
        <>
          {testMode && (
            <Alert tone="warning" title={O.testTitle} role="none">
              <p>{O.testText}</p>
            </Alert>
          )}
          {campaign && <p className="rounded-field bg-brand-50 px-4 py-3 text-brand">{O.campaignNote(campaign.title)}</p>}
          <div onChange={trackAmount} onInput={trackAmount}>
            <AmountField field={field} suggested={suggestedAmounts} minAmount={minAmount} />
          </div>
          <fieldset className="flex flex-col gap-5">
            <legend className="mb-1 text-h4 text-brand">{O.donorTitle}</legend>
            <p className="-mt-2 text-small text-muted">{O.reachHint}</p>
            <LineField field={field} name="donorName" label={O.donorName} maxLength={LIMITS.donorName} autoComplete="name" />
            <div className="grid gap-5 sm:grid-cols-2">
              <LineField field={field} name="email" type="email" inputMode="email" label="Adresse email" maxLength={LIMITS.email} autoComplete="email" />
              <LineField field={field} name="phone" type="tel" inputMode="tel" label="Téléphone" maxLength={LIMITS.phone.max} autoComplete="tel" />
            </div>
            <Checkbox id={field.id("isAnonymous")} name="isAnonymous" label={O.anonymous} defaultChecked={field.checked("isAnonymous")} />
            <TextAreaField field={field} name="donorMessage" label={O.message} maxLength={LIMITS.donorMessage} rows={3} />
          </fieldset>
          <ConsentField field={field} />
          <div className="flex gap-3 rounded-card border border-success/30 bg-success-50 p-4">
            <ShieldCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-success" />
            <div className="flex flex-col gap-1 text-small text-ink">
              <p className="font-semibold text-brand">{O.providerNote(providerLabel)}</p>
              <ul className="flex flex-col gap-0.5">
                {O.trust.slice(1).map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}
    </PublicForm>
  );
}
