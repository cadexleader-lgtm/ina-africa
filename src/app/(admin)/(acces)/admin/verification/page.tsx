import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthCard } from "@/components/admin/AuthLayout";
import { TotpVerifyForm } from "@/components/admin/AuthForms";
import { AUTH_TEXT } from "@/components/admin/auth-texts";
import { SignOutButton } from "@/components/admin/SignOutButton";
import { adminRedirectTarget, safeAdminPath } from "@/lib/validation/auth";
import { getAuthState, nextAuthStep } from "@/server/auth/guard";

const T = AUTH_TEXT;

export const instant = false;

export const metadata: Metadata = { title: T.mfa.verifyMetaTitle };

/** Second facteur à la connexion : code TOTP → session aal2. */
export default async function VerifyPage({ searchParams }: PageProps<"/admin/verification">) {
  const params = await searchParams;
  const suite = safeAdminPath(Array.isArray(params.suite) ? params.suite[0] : params.suite);

  const state = await getAuthState();
  if (state.kind !== "signed_in") redirect(nextAuthStep(state, suite) ?? "/admin/connexion");
  // Déjà validée, ou rien à valider (aucun facteur) : étape suivante du parcours.
  if (state.aal === "aal2" || !state.hasVerifiedFactor) redirect(nextAuthStep(state, suite) ?? adminRedirectTarget(suite));

  return (
    <AuthCard
      title={T.mfa.verifyTitle}
      intro={T.mfa.verifyIntro}
      footer={
        <>
          <p className="text-muted">{T.mfa.lostDevice}</p>
          <SignOutButton variant="ghost" />
        </>
      }
    >
      <TotpVerifyForm suite={suite} />
    </AuthCard>
  );
}
