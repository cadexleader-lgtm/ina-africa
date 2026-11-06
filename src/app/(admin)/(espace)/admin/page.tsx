import type { Metadata } from "next";
import { Suspense } from "react";

import { AUTH_TEXT } from "@/components/admin/auth-texts";
import { DashboardStatsView } from "@/components/admin/DashboardStatsView";
import { Alert } from "@/components/ui/Alert";
import { LinkButton } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/LoadingState";
import { requireAdminPage, roleAtLeast } from "@/server/auth/guard";
import { ROLE_LABELS } from "@/server/auth/roles";

import { readDashboardStats } from "./dashboard-stats";

// Lit la session : rendu à chaque visite, jamais mis en cache.
export const instant = false;

export const metadata: Metadata = { title: "Tableau de bord" };

async function Stats() {
  return <DashboardStatsView stats={await readDashboardStats()} />;
}

/**
 * Tableau de bord : chiffres de admin_dashboard_stats() avec un lien vers
 * chaque page concernée. La fonction ne renvoie dons, demandes et lettre
 * d'information qu'aux administrateurs : un éditeur ne voit que les contenus.
 */
export default async function DashboardPage({ searchParams }: PageProps<"/admin">) {
  const session = await requireAdminPage("editor");
  const params = await searchParams;
  const passwordChanged = params["mot-de-passe"] === "modifie";

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-h2">Tableau de bord</h1>
        <p className="mt-2 text-body text-muted">
          {session.fullName} · {ROLE_LABELS[session.role]}
        </p>
        <p className="mt-1 max-w-measure text-small text-muted">
          {roleAtLeast(session.role, "admin")
            ? "Ce qui attend une action, les dons reçus et l'activité du site, en un coup d'œil."
            : "Vos articles et les contenus du site en un coup d'œil."}
        </p>
      </div>

      {passwordChanged && (
        <Alert tone="success" role="status">
          {AUTH_TEXT.password.changed}
        </Alert>
      )}

      {!session.mfaVerified && (
        <Alert
          tone="info"
          title="Protégez votre compte"
          role="none"
          action={
            <LinkButton href="/admin/securite/double-authentification" variant="secondary" size="sm">
              Activer la double authentification
            </LinkButton>
          }
        >
          {AUTH_TEXT.mfa.enrollOptional}
        </Alert>
      )}

      <Suspense fallback={<LoadingState variant="list" count={4} label="Chargement des chiffres…" />}>
        <Stats />
      </Suspense>
    </div>
  );
}
