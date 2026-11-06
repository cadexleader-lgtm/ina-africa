import type { Metadata } from "next";

import { AuthCard, AuthLink } from "@/components/admin/AuthLayout";
import { PasswordResetRequestForm } from "@/components/admin/AuthForms";
import { AUTH_TEXT } from "@/components/admin/auth-texts";
import { Alert } from "@/components/ui/Alert";
import { hasPublicSupabaseEnv } from "@/lib/public-env";

const T = AUTH_TEXT;

export const metadata: Metadata = { title: T.reset.metaTitle };

/** Demande d'un lien de réinitialisation : réponse identique qu'un compte existe ou non. */
export default function ForgotPasswordPage() {
  const configured = hasPublicSupabaseEnv();
  return (
    <AuthCard
      title={T.reset.title}
      intro={T.reset.intro}
      footer={<AuthLink href="/admin/connexion">{T.common.backToLogin}</AuthLink>}
    >
      {!configured && (
        <Alert tone="warning" title={T.common.unconfiguredTitle} role="none">
          {T.common.unconfigured}
        </Alert>
      )}
      <PasswordResetRequestForm disabled={!configured} />
    </AuthCard>
  );
}
