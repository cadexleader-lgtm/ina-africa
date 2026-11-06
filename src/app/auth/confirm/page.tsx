import type { Metadata } from "next";

import { AuthCard, AuthLink } from "@/components/admin/AuthLayout";
import { EmailLinkForm } from "@/components/admin/AuthForms";
import { AUTH_TEXT } from "@/components/admin/auth-texts";
import { Alert } from "@/components/ui/Alert";
import { isEmailLinkType } from "@/server/auth/email-link";

const T = AUTH_TEXT.link;

// Lit l'adresse (jeton du lien) : rendu à chaque visite, jamais mis en cache.
export const instant = false;

export const metadata: Metadata = { title: T.metaTitle };

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Lien reçu par email (réinitialisation du mot de passe, invitation).
 * Le jeton n'est utilisé qu'au CLIC sur « Continuer » (Server Action
 * verifyOtp) : les filtres de messagerie qui ouvrent les liens ne le consomment pas.
 */
export default async function ConfirmEmailLinkPage({ searchParams }: PageProps<"/auth/confirm">) {
  const params = await searchParams;
  const tokenHash = first(params.token_hash);
  const type = first(params.type);
  const code = first(params.code);
  const valid = (tokenHash && isEmailLinkType(type)) || (!tokenHash && code);

  if (!valid) {
    return (
      <AuthCard title={T.title} footer={<AuthLink href="/admin/connexion">{AUTH_TEXT.common.backToLogin}</AuthLink>}>
        <Alert tone="error" role="none">
          {T.missing}
        </Alert>
        <AuthLink href="/admin/mot-de-passe-oublie">{T.requestNew}</AuthLink>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title={T.title}
      intro={type === "invite" ? T.inviteIntro : T.recoveryIntro}
      footer={<AuthLink href="/admin/mot-de-passe-oublie">{T.requestNew}</AuthLink>}
    >
      <EmailLinkForm tokenHash={tokenHash} type={type} code={tokenHash ? undefined : code} />
    </AuthCard>
  );
}
