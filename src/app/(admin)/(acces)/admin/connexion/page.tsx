import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthCard, AuthLink } from "@/components/admin/AuthLayout";
import { LoginForm } from "@/components/admin/AuthForms";
import { AUTH_TEXT } from "@/components/admin/auth-texts";
import { Alert } from "@/components/ui/Alert";
import { hasPublicSupabaseEnv } from "@/lib/public-env";
import { adminRedirectTarget, safeAdminPath } from "@/lib/validation/auth";
import { getAuthState, nextAuthStep } from "@/server/auth/guard";

const T = AUTH_TEXT;

// Lit la session et l'adresse (?suite=) : rendu à chaque visite.
export const instant = false;

export const metadata: Metadata = { title: T.login.metaTitle };

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Connexion à l'administration (email + mot de passe). Pas d'inscription en
 * ligne : les comptes sont créés par un super administrateur.
 */
export default async function LoginPage({ searchParams }: PageProps<"/admin/connexion">) {
  const params = await searchParams;
  const suite = safeAdminPath(first(params.suite));
  const configured = hasPublicSupabaseEnv();

  // Déjà connecté : on reprend le parcours là où il en est.
  const state = await getAuthState();
  if (state.kind === "signed_in") redirect(nextAuthStep(state, suite) ?? adminRedirectTarget(suite));

  const reason = first(params.erreur);
  let notice = null;
  if (!configured) {
    notice = (
      <Alert tone="warning" title={T.common.unconfiguredTitle} role="none">
        {T.common.unconfigured}
      </Alert>
    );
  } else if (reason === "sans-acces") {
    notice = (
      <Alert tone="error" title={T.login.noAccess} role="none">
        {T.login.noAccessHint}
      </Alert>
    );
  } else if (reason === "lien") {
    notice = (
      <Alert tone="error" role="none">
        {T.login.linkInvalid}
      </Alert>
    );
  } else if (first(params.deconnexion) === "1") {
    notice = (
      <Alert tone="success" role="none">
        {T.login.signedOut}
      </Alert>
    );
  }

  return (
    <AuthCard
      title={T.login.title}
      intro={T.login.intro}
      footer={
        <>
          <AuthLink href="/admin/mot-de-passe-oublie">{T.login.forgot}</AuthLink>
          <p className="text-muted">{T.login.noPublicSignup}</p>
        </>
      }
    >
      <LoginForm suite={suite} disabled={!configured} notice={notice} />
    </AuthCard>
  );
}
