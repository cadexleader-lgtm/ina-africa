import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthCard, AuthLink } from "@/components/admin/AuthLayout";
import { NewPasswordForm } from "@/components/admin/AuthForms";
import { AUTH_TEXT } from "@/components/admin/auth-texts";
import { Alert } from "@/components/ui/Alert";
import { withSuite } from "@/lib/validation/auth";
import { AUTH_PATHS, getAuthState } from "@/server/auth/guard";

const T = AUTH_TEXT;

export const instant = false;

export const metadata: Metadata = { title: T.password.metaTitle };

/**
 * Nouveau mot de passe, après le lien reçu par email (réinitialisation ou
 * invitation, validé par /auth/confirm qui ouvre une session).
 */
export default async function NewPasswordPage() {
  const state = await getAuthState();

  if (state.kind === "unconfigured" || state.kind === "anonymous") {
    return (
      <AuthCard
        title={T.password.sessionMissingTitle}
        footer={<AuthLink href="/admin/connexion">{T.common.backToLogin}</AuthLink>}
      >
        <Alert tone="error" role="none">
          {T.password.sessionMissing}
        </Alert>
        <AuthLink href="/admin/mot-de-passe-oublie">{T.link.requestNew}</AuthLink>
      </AuthCard>
    );
  }

  // Compte protégé par la double authentification : Supabase exige aal2 pour changer le mot de passe.
  if (state.kind === "signed_in" && state.hasVerifiedFactor && state.aal !== "aal2") {
    redirect(withSuite(AUTH_PATHS.verify, "/admin/nouveau-mot-de-passe"));
  }

  return (
    <AuthCard title={T.password.title} intro={T.password.intro}>
      <NewPasswordForm />
    </AuthCard>
  );
}
