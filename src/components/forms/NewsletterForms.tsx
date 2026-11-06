"use client";

import { CircleAlert } from "lucide-react";
import { useActionState, useEffect, useRef, useState, type ReactNode } from "react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/FormField";
import type { OrgContacts } from "@/components/forms/ContactAlternatives";
import { EmailField } from "@/components/forms/fields";
import { FORM_IDS } from "@/components/forms/ids";
import { ConsentField, PublicForm, type FormAction } from "@/components/forms/PublicForm";
import { FORM_TEXT } from "@/content/fr/forms";
import { INITIAL_FORM_STATE, LIMITS, SPAM_FIELDS } from "@/lib/validation/forms";

const N = FORM_TEXT.newsletter;

/** Un jeton est redemandé s'il a plus de 90 minutes (il expire à 2 h). */
const TOKEN_REFRESH_MS = 90 * 60 * 1000;

/** Message d'erreur lisible sur fond bleu foncé. */
function InverseError({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={id} className="flex items-start gap-1.5 rounded-field bg-danger-50 px-3 py-2 text-small font-medium text-danger">
      <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

/**
 * Inscription depuis le PIED DE PAGE (présent sur toutes les pages, qui
 * restent statiques) : l'horodatage signé est demandé au serveur quand le
 * visiteur commence à remplir le champ. Sans JavaScript, l'action renvoie
 * vers la page /newsletter, dont le formulaire fonctionne sans script.
 */
export function NewsletterSignup({
  subscribeAction,
  tokenAction,
  contacts,
}: {
  subscribeAction: FormAction;
  tokenAction: () => Promise<string | null>;
  contacts: OrgContacts;
}) {
  const [token, setToken] = useState<{ value: string; at: number } | null>(null);
  const requesting = useRef(false);

  function ensureToken() {
    if (requesting.current || (token && Date.now() - token.at < TOKEN_REFRESH_MS)) return;
    requesting.current = true;
    tokenAction()
      .then((value) => {
        if (value) setToken({ value, at: Date.now() });
      })
      .catch(() => {
        // Sans jeton, le serveur l'indiquera clairement à l'envoi.
      })
      .finally(() => {
        requesting.current = false;
      });
  }

  const id = FORM_IDS.newsletterFooter;

  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:items-start lg:gap-16">
      <div>
        <span aria-hidden="true" className="mb-5 block h-1 w-12 rounded-full bg-gold" />
        <h2 className="text-h3">{N.footerTitle}</h2>
        <p className="mt-3 max-w-measure text-body text-muted-inverse">{N.footerText}</p>
        <p className="mt-3 max-w-measure text-small text-muted-inverse">{N.doubleOptIn}</p>
      </div>
      <div onFocusCapture={ensureToken} onPointerDownCapture={ensureToken}>
        <PublicForm
          id={id}
          action={subscribeAction}
          contacts={contacts}
          inverse
          hideRequiredNote
          submitLabel={N.submit}
          submittingLabel={N.submitting}
          security={
            <>
              <input type="hidden" name="source" value="footer" />
              {token && <input type="hidden" name={SPAM_FIELDS.token} value={token.value} />}
            </>
          }
        >
          {(field) => {
            const emailError = field.error("email");
            const consentError = field.error("consent");
            return (
              <>
                <div className="flex flex-col gap-2">
                  <label htmlFor={field.id("email")} className="text-small font-semibold text-white">
                    {N.emailLabel}
                    <span aria-hidden="true"> *</span>
                  </label>
                  <Input
                    id={field.id("email")}
                    name="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    required
                    maxLength={LIMITS.email}
                    defaultValue={field.value("email")}
                    aria-invalid={emailError ? true : undefined}
                    aria-describedby={emailError ? `${field.id("email")}-erreur` : undefined}
                  />
                  {emailError && <InverseError id={`${field.id("email")}-erreur`}>{emailError}</InverseError>}
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-start gap-3">
                    <input
                      id={field.id("consent")}
                      type="checkbox"
                      name="consent"
                      required
                      defaultChecked={field.checked("consent")}
                      aria-invalid={consentError ? true : undefined}
                      aria-describedby={consentError ? `${field.id("consent")}-erreur` : undefined}
                      className="mt-0.5 size-5 shrink-0 cursor-pointer accent-gold"
                    />
                    <label htmlFor={field.id("consent")} className="cursor-pointer text-small leading-snug text-white">
                      {N.consent}
                      <span aria-hidden="true"> *</span>
                    </label>
                  </div>
                  {consentError && <InverseError id={`${field.id("consent")}-erreur`}>{consentError}</InverseError>}
                </div>
              </>
            );
          }}
        </PublicForm>
      </div>
    </div>
  );
}

/** Formulaire de la page /newsletter : fonctionne aussi sans JavaScript (horodatage posé par FormGuard). */
export function NewsletterPageForm({
  action,
  security,
  contacts,
}: {
  action: FormAction;
  security: ReactNode;
  contacts: OrgContacts;
}) {
  return (
    <PublicForm
      id={FORM_IDS.newsletterPage}
      action={action}
      contacts={contacts}
      submitLabel={N.submit}
      submittingLabel={N.submitting}
      security={
        <>
          <input type="hidden" name="source" value="page" />
          {security}
        </>
      }
    >
      {(field) => (
        <>
          <EmailField field={field} label={N.emailLabel} />
          <ConsentField field={field} label={N.consent} />
          <p className="text-small text-muted">{N.doubleOptIn}</p>
        </>
      )}
    </PublicForm>
  );
}

/**
 * Bouton de confirmation / désinscription. Le jeton du lien reçu par email
 * est posé par le serveur (champ caché rattaché par l'attribut `form`) :
 * RIEN n'est fait au simple chargement de la page, seulement au clic.
 */
export function LinkActionForm({
  id,
  action,
  token,
  submitLabel,
  pendingLabel,
}: {
  id: string;
  action: FormAction;
  /** Champ caché du jeton (composant serveur sous Suspense). */
  token: ReactNode;
  submitLabel: string;
  pendingLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, INITIAL_FORM_STATE);
  const messageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.respondedAt) messageRef.current?.focus();
  }, [state.respondedAt]);

  if (state.status === "success") {
    return (
      <div ref={messageRef} tabIndex={-1} className="focus:outline-none">
        <Alert tone="success" role="status">
          <p>{state.message}</p>
        </Alert>
      </div>
    );
  }

  return (
    <form id={id} action={formAction} className="flex flex-col gap-6" aria-busy={pending || undefined}>
      {token}
      <div ref={messageRef} tabIndex={-1} className="empty:hidden focus:outline-none">
        {state.status === "error" && state.message && (
          <Alert tone="error" role="alert">
            <p>{state.message}</p>
          </Alert>
        )}
        {state.status === "unavailable" && (
          <Alert tone="warning" title={FORM_TEXT.errors.unavailableTitle} role="alert">
            <p>{state.message}</p>
          </Alert>
        )}
      </div>
      <div>
        <Button type="submit" size="lg" loading={pending} loadingLabel={pendingLabel} className="w-full sm:w-auto">
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
