"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, type ReactNode } from "react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/FormField";
import { ContactAlternatives, hasContacts, type OrgContacts } from "@/components/forms/ContactAlternatives";
import { Honeypot, TurnstileField } from "@/components/forms/SpamFields";
import { FORM_TEXT } from "@/content/fr/forms";
import { cn } from "@/lib/cn";
import { INITIAL_FORM_STATE, type FormState } from "@/lib/validation/forms";

export type FormAction = (state: FormState, formData: FormData) => Promise<FormState>;

/** Aides passées aux champs : erreur, valeur saisie (renvoyée par le serveur), état d'envoi. */
export type FieldHelpers = {
  formId: string;
  /** id d'un champ : `<formId>-<nom>`. */
  id: (name: string) => string;
  error: (name: string) => string | undefined;
  value: (name: string) => string | undefined;
  checked: (name: string) => boolean | undefined;
  pending: boolean;
};

type PublicFormProps = {
  /** id de l'élément <form> (le même que celui donné à FormGuard). */
  id: string;
  /** Action serveur, transmise par la page (composant serveur). */
  action: FormAction;
  /** Partie calculée par le serveur à chaque visite (FormGuard). */
  security?: ReactNode;
  contacts: OrgContacts;
  submitLabel: string;
  submittingLabel?: string;
  /** Icône du bouton d'envoi. */
  submitIcon?: ReactNode;
  successTitle?: string;
  /** Lien « Envoyer une autre demande » (recharge la page). */
  resetHref?: string;
  /** Sur fond sombre (pied de page). */
  inverse?: boolean;
  /** Masque la mention des champs obligatoires (formulaires d'un seul champ). */
  hideRequiredNote?: boolean;
  /** Bouton pleine largeur. */
  fullWidthSubmit?: boolean;
  className?: string;
  /** Affiché à la place du formulaire quand l'action répond « checkout » (paiement à ouvrir). */
  renderCheckout?: (state: FormState) => ReactNode;
  children: (field: FieldHelpers) => ReactNode;
};

const FOCUSABLE = "input:not([type=hidden]), textarea, select";

/**
 * Formulaire public commun :
 *  - fonctionne SANS JavaScript (action serveur sur <form action>) ;
 *  - avec JavaScript (useActionState) : erreurs sous chaque champ, focus sur
 *    la première erreur, bouton en chargement, succès annoncé (role="status") ;
 *  - la saisie est conservée après une erreur (valeurs renvoyées par le serveur) ;
 *  - champ piège et anti-robot (si configuré) inclus.
 */
export function PublicForm({
  id,
  action,
  security,
  contacts,
  submitLabel,
  submittingLabel = FORM_TEXT.common.sending,
  submitIcon,
  successTitle = FORM_TEXT.common.successTitle,
  resetHref,
  inverse = false,
  hideRequiredNote = false,
  fullWidthSubmit = false,
  className,
  renderCheckout,
  children,
}: PublicFormProps) {
  const [state, formAction, pending] = useActionState(action, INITIAL_FORM_STATE);
  const formRef = useRef<HTMLFormElement>(null);
  const messageRef = useRef<HTMLDivElement>(null);

  // Après chaque réponse : focus sur le premier champ en erreur, sinon sur le message.
  useEffect(() => {
    if (!state.respondedAt) return;
    const invalid = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
    if (invalid) {
      const target = invalid.matches(FOCUSABLE) ? invalid : invalid.querySelector<HTMLElement>(FOCUSABLE);
      (target ?? invalid).focus();
      return;
    }
    messageRef.current?.focus();
  }, [state.respondedAt]);

  const helpers: FieldHelpers = {
    formId: id,
    id: (name) => `${id}-${name}`,
    error: (name) => state.fieldErrors?.[name] || undefined,
    value: (name) => {
      const value = state.values?.[name];
      return typeof value === "string" ? value : undefined;
    },
    checked: (name) => {
      const value = state.values?.[name];
      return typeof value === "boolean" ? value : undefined;
    },
    pending,
  };

  if (state.status === "checkout" && renderCheckout) {
    return <div className={className}>{renderCheckout(state)}</div>;
  }

  if (state.status === "success") {
    return (
      <div ref={messageRef} tabIndex={-1} className={cn("focus:outline-none", className)}>
        <Alert tone="success" title={successTitle} role="status">
          <p>{state.message}</p>
        </Alert>
        {resetHref && (
          <p className="mt-5">
            {/* Lien natif : recharge la page (nouveau formulaire vide), avec ou sans JavaScript. */}
            <a
              href={resetHref}
              className={cn(
                "font-semibold underline underline-offset-4",
                inverse ? "text-white" : "text-link hover:text-link-strong",
              )}
            >
              {FORM_TEXT.common.anotherRequest}
            </a>
          </p>
        )}
      </div>
    );
  }

  return (
    <form
      // Remonté après chaque réponse : valeurs renvoyées par le serveur, nouveau jeton anti-robot.
      key={state.respondedAt ?? 0}
      ref={formRef}
      id={id}
      action={formAction}
      noValidate
      aria-busy={pending || undefined}
      className={cn("relative flex flex-col gap-6", className)}
    >
      {security}

      <div ref={messageRef} tabIndex={-1} className="empty:hidden focus:outline-none">
        {state.status === "error" && state.message && (
          <Alert tone="error" title={FORM_TEXT.common.errorTitle} role="alert">
            <p>{state.message}</p>
          </Alert>
        )}
        {state.status === "unavailable" && (
          <Alert tone="warning" title={FORM_TEXT.errors.unavailableTitle} role="alert">
            <p>{state.message}</p>
            {hasContacts(contacts) ? (
              <>
                <p className="mt-2">{FORM_TEXT.errors.unavailableContact}</p>
                <ContactAlternatives contacts={contacts} className="mt-2" />
              </>
            ) : (
              <p className="mt-2">{FORM_TEXT.errors.unavailableLater}</p>
            )}
          </Alert>
        )}
      </div>

      {!hideRequiredNote && (
        <p className={cn("text-small", inverse ? "text-muted-inverse" : "text-muted")}>{FORM_TEXT.common.requiredNote}</p>
      )}

      {children(helpers)}

      <Honeypot formId={id} />
      <TurnstileField theme={inverse ? "dark" : "light"} />

      <div>
        <Button
          type="submit"
          variant={inverse ? "inverse" : "primary"}
          size="lg"
          fullWidth={fullWidthSubmit}
          loading={pending}
          loadingLabel={submittingLabel}
          iconRight={submitIcon}
          className={fullWidthSubmit ? undefined : "w-full sm:w-auto"}
        >
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

/** Case de consentement (obligatoire), avec le lien vers la politique de confidentialité. */
export function ConsentField({ field, label }: { field: FieldHelpers; label?: ReactNode }) {
  const C = FORM_TEXT.common;
  return (
    <Checkbox
      id={field.id("consent")}
      name="consent"
      required
      error={field.error("consent")}
      defaultChecked={field.checked("consent")}
      label={
        label ?? (
          <>
            {C.consentLead}
            <Link
              href="/politique-de-confidentialite"
              className="font-medium text-link underline underline-offset-4 hover:text-link-strong"
            >
              {C.consentLink}
            </Link>
            {C.consentEnd}
          </>
        )
      }
    />
  );
}
