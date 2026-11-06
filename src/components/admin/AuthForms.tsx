"use client";

import { useActionState, useEffect, useRef, type ReactNode } from "react";
import { KeyRound, LogIn, Mail, ShieldCheck } from "lucide-react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { FormField, Input } from "@/components/ui/FormField";
import {
  INITIAL_AUTH_STATE,
  INITIAL_ENROLL_STATE,
  PASSWORD_RULES,
  type AuthFormState,
  type EnrollState,
} from "@/lib/validation/auth";
import {
  confirmEmailLinkAction,
  confirmTotpEnrollmentAction,
  requestPasswordResetAction,
  signInAction,
  startTotpEnrollmentAction,
  updatePasswordAction,
  verifyTotpAction,
} from "@/server/auth/actions";

import { AUTH_TEXT } from "./auth-texts";

const T = AUTH_TEXT;

const FOCUSABLE = "input:not([type=hidden]), textarea, select";

/** Après chaque réponse : focus sur le premier champ en erreur, sinon sur le message. */
function useFocusAfterResponse(state: AuthFormState) {
  const formRef = useRef<HTMLFormElement>(null);
  const messageRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!state.respondedAt) return;
    const invalid = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
    if (invalid?.matches(FOCUSABLE)) {
      invalid.focus();
      return;
    }
    messageRef.current?.focus();
  }, [state.respondedAt]);
  return { formRef, messageRef };
}

function FormMessage({ state, messageRef }: { state: AuthFormState; messageRef: React.RefObject<HTMLDivElement | null> }) {
  return (
    <div ref={messageRef} tabIndex={-1} className="focus:outline-none empty:hidden">
      {state.status === "error" && state.message && <Alert tone="error">{state.message}</Alert>}
    </div>
  );
}

function SuiteField({ suite }: { suite?: string | null }) {
  return suite ? <input type="hidden" name="suite" value={suite} /> : null;
}

function TotpCodeField({ id, error, disabled }: { id: string; error?: string; disabled?: boolean }) {
  return (
    <FormField id={id} label={T.mfa.code} hint={T.mfa.codeHint} error={error} required>
      {(field) => (
        <Input
          {...field}
          name="code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={9}
          spellCheck={false}
          disabled={disabled}
          className="max-w-48 text-center font-heading text-h4 tracking-[0.3em]"
        />
      )}
    </FormField>
  );
}

// ---------------------------------------------------------------------------
// Connexion
// ---------------------------------------------------------------------------

export function LoginForm({ suite, disabled = false, notice }: { suite?: string | null; disabled?: boolean; notice?: ReactNode }) {
  const [state, action, pending] = useActionState(signInAction, INITIAL_AUTH_STATE);
  const { formRef, messageRef } = useFocusAfterResponse(state);
  return (
    <form ref={formRef} action={action} noValidate className="flex flex-col gap-5">
      {state.status === "idle" && notice}
      <FormMessage state={state} messageRef={messageRef} />
      <SuiteField suite={suite} />
      <FormField id="connexion-email" label={T.login.email} error={state.fieldErrors?.email} required>
        {(field) => (
          <Input
            {...field}
            name="email"
            type="email"
            autoComplete="username"
            spellCheck={false}
            defaultValue={state.email}
            disabled={disabled}
          />
        )}
      </FormField>
      <FormField id="connexion-mot-de-passe" label={T.login.password} error={state.fieldErrors?.password} required>
        {(field) => <Input {...field} name="password" type="password" autoComplete="current-password" disabled={disabled} />}
      </FormField>
      <Button type="submit" fullWidth loading={pending} loadingLabel={T.login.submitting} disabled={disabled} iconLeft={<LogIn />}>
        {T.login.submit}
      </Button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Double authentification : vérification
// ---------------------------------------------------------------------------

export function TotpVerifyForm({ suite }: { suite?: string | null }) {
  const [state, action, pending] = useActionState(verifyTotpAction, INITIAL_AUTH_STATE);
  const { formRef, messageRef } = useFocusAfterResponse(state);
  return (
    <form ref={formRef} action={action} noValidate className="flex flex-col gap-5">
      <FormMessage state={state} messageRef={messageRef} />
      <SuiteField suite={suite} />
      <TotpCodeField id="verification-code" error={state.fieldErrors?.code} />
      <Button type="submit" fullWidth loading={pending} loadingLabel={T.mfa.verifying} iconLeft={<ShieldCheck />}>
        {T.mfa.verify}
      </Button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Double authentification : activation
// ---------------------------------------------------------------------------

export function TotpEnrollment({ suite }: { suite?: string | null }) {
  const [started, startAction, starting] = useActionState(startTotpEnrollmentAction, INITIAL_ENROLL_STATE);
  const [confirmed, confirmAction, confirming] = useActionState(confirmTotpEnrollmentAction, INITIAL_ENROLL_STATE);
  const { formRef: startFormRef, messageRef: startMessageRef } = useFocusAfterResponse(started);
  const { formRef: confirmFormRef, messageRef: confirmMessageRef } = useFocusAfterResponse(confirmed);

  // Le QR code le plus récent : celui du démarrage, ou celui conservé après une erreur de code.
  const current: EnrollState =
    confirmed.factorId && confirmed.factorId === started.factorId ? { ...started, ...confirmed } : started;
  const enrolling = Boolean(started.factorId && started.qrCode);

  if (!enrolling) {
    return (
      <form ref={startFormRef} action={startAction} className="flex flex-col gap-5">
        <FormMessage state={started} messageRef={startMessageRef} />
        <SuiteField suite={suite} />
        <ol className="flex list-decimal flex-col gap-2 pl-5 text-body text-ink">
          {T.mfa.enrollSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <Button type="submit" fullWidth loading={starting} loadingLabel={T.mfa.starting} iconLeft={<KeyRound />}>
          {T.mfa.start}
        </Button>
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div ref={startMessageRef} tabIndex={-1} className="flex flex-col items-center gap-4 focus:outline-none">
        {/* eslint-disable-next-line @next/next/no-img-element -- image SVG en adresse data: renvoyée par Supabase */}
        <img
          src={current.qrCode}
          alt={T.mfa.qrAlt}
          width={200}
          height={200}
          className="size-50 rounded-field border border-line bg-white p-2"
        />
        <div className="w-full">
          <p className="text-small text-muted">{T.mfa.secretLabel}</p>
          <p className="mt-1 rounded-field border border-line bg-ivory px-3 py-2 font-[ui-monospace,SFMono-Regular,Menlo,monospace] text-small break-all text-ink select-all">
            {current.secret}
          </p>
        </div>
      </div>
      <form ref={confirmFormRef} action={confirmAction} noValidate className="flex flex-col gap-5">
        <FormMessage state={confirmed} messageRef={confirmMessageRef} />
        <SuiteField suite={suite} />
        <input type="hidden" name="factorId" value={started.factorId} />
        <TotpCodeField id="activation-code" error={confirmed.factorId === started.factorId ? confirmed.fieldErrors?.code : undefined} />
        <Button type="submit" fullWidth loading={confirming} loadingLabel={T.mfa.confirming} iconLeft={<ShieldCheck />}>
          {T.mfa.confirm}
        </Button>
      </form>
      <form action={startAction}>
        <SuiteField suite={suite} />
        <Button type="submit" variant="link" size="sm" disabled={starting || confirming}>
          {T.mfa.restart}
        </Button>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mot de passe oublié
// ---------------------------------------------------------------------------

export function PasswordResetRequestForm({ disabled = false }: { disabled?: boolean }) {
  const [state, action, pending] = useActionState(requestPasswordResetAction, INITIAL_AUTH_STATE);
  const { formRef, messageRef } = useFocusAfterResponse(state);

  if (state.status === "success") {
    return (
      <div ref={messageRef} tabIndex={-1} className="focus:outline-none">
        <Alert tone="success" title={T.reset.sentTitle} role="status">
          <p>{state.message}</p>
        </Alert>
      </div>
    );
  }

  return (
    <form ref={formRef} action={action} noValidate className="flex flex-col gap-5">
      <FormMessage state={state} messageRef={messageRef} />
      <FormField id="oubli-email" label={T.login.email} error={state.fieldErrors?.email} required>
        {(field) => (
          <Input
            {...field}
            name="email"
            type="email"
            autoComplete="email"
            spellCheck={false}
            defaultValue={state.email}
            disabled={disabled}
          />
        )}
      </FormField>
      <Button type="submit" fullWidth loading={pending} loadingLabel={T.reset.submitting} disabled={disabled} iconLeft={<Mail />}>
        {T.reset.submit}
      </Button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Lien reçu par email
// ---------------------------------------------------------------------------

export function EmailLinkForm({ tokenHash, type, code }: { tokenHash?: string; type?: string; code?: string }) {
  const [state, action, pending] = useActionState(confirmEmailLinkAction, INITIAL_AUTH_STATE);
  const { formRef, messageRef } = useFocusAfterResponse(state);
  return (
    <form ref={formRef} action={action} className="flex flex-col gap-5">
      <FormMessage state={state} messageRef={messageRef} />
      {tokenHash && <input type="hidden" name="token_hash" value={tokenHash} />}
      {type && <input type="hidden" name="type" value={type} />}
      {code && <input type="hidden" name="code" value={code} />}
      <Button type="submit" fullWidth loading={pending} loadingLabel={T.link.submitting}>
        {T.link.submit}
      </Button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Nouveau mot de passe
// ---------------------------------------------------------------------------

export function NewPasswordForm() {
  const [state, action, pending] = useActionState(updatePasswordAction, INITIAL_AUTH_STATE);
  const { formRef, messageRef } = useFocusAfterResponse(state);
  return (
    <form ref={formRef} action={action} noValidate className="flex flex-col gap-5">
      <FormMessage state={state} messageRef={messageRef} />
      <FormField
        id="nouveau-mot-de-passe"
        label={T.password.password}
        hint={`Au moins ${PASSWORD_RULES.min} caractères.`}
        error={state.fieldErrors?.password}
        required
      >
        {(field) => <Input {...field} name="password" type="password" autoComplete="new-password" minLength={PASSWORD_RULES.min} />}
      </FormField>
      <FormField id="confirmation-mot-de-passe" label={T.password.confirmation} error={state.fieldErrors?.confirmation} required>
        {(field) => <Input {...field} name="confirmation" type="password" autoComplete="new-password" />}
      </FormField>
      <Button type="submit" fullWidth loading={pending} loadingLabel={T.password.submitting} iconLeft={<KeyRound />}>
        {T.password.submit}
      </Button>
    </form>
  );
}
