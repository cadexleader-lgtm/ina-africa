import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthCard, AuthLink } from "@/components/admin/AuthLayout";
import { TotpEnrollment } from "@/components/admin/AuthForms";
import { AUTH_TEXT } from "@/components/admin/auth-texts";
import { SignOutButton } from "@/components/admin/SignOutButton";
import { Alert } from "@/components/ui/Alert";
import { LinkButton } from "@/components/ui/Button";
import { adminRedirectTarget, safeAdminPath } from "@/lib/validation/auth";
import { AUTH_PATHS, getAuthState, nextAuthStep } from "@/server/auth/guard";
import { requiresMfa } from "@/server/auth/roles";

const T = AUTH_TEXT;

export const instant = false;

export const metadata: Metadata = { title: T.mfa.enrollMetaTitle };

/**
 * Activation de la double authentification (TOTP) : QR code + clé texte
 * renvoyés par Supabase, puis vérification d'un premier code.
 * Obligatoire pour admin et super_admin, facultative pour editor.
 */
export default async function EnrollMfaPage({ searchParams }: PageProps<"/admin/securite/double-authentification">) {
  const params = await searchParams;
  const suite = safeAdminPath(Array.isArray(params.suite) ? params.suite[0] : params.suite);

  const state = await getAuthState();
  if (state.kind !== "signed_in") redirect(nextAuthStep(state, suite) ?? AUTH_PATHS.login);

  if (state.hasVerifiedFactor) {
    if (state.aal !== "aal2") redirect(nextAuthStep(state, suite) ?? adminRedirectTarget(suite));
    return (
      <AuthCard title={T.mfa.enrollTitle}>
        <Alert tone="success" role="none">
          {T.mfa.alreadyEnabled}
        </Alert>
        <LinkButton href={adminRedirectTarget(suite)} fullWidth>
          {AUTH_TEXT.forbidden.back}
        </LinkButton>
      </AuthCard>
    );
  }

  const mandatory = requiresMfa(state.role);
  return (
    <AuthCard
      title={T.mfa.enrollTitle}
      intro={mandatory ? T.mfa.enrollRequired : T.mfa.enrollOptional}
      footer={
        mandatory ? (
          <SignOutButton variant="ghost" />
        ) : (
          <AuthLink href={adminRedirectTarget(suite)}>{T.mfa.later}</AuthLink>
        )
      }
    >
      <TotpEnrollment suite={suite} />
    </AuthCard>
  );
}
