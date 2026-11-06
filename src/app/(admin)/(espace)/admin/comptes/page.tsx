import type { Metadata } from "next";
import { Suspense } from "react";

import { InviteMemberForm, MemberActions } from "@/components/admin/gestion/AccountForms";
import { Flash } from "@/components/admin/gestion/Flash";
import { formatShortDate, param } from "@/components/admin/gestion/labels";
import { GestionHeader, Panel, StatusBadge } from "@/components/admin/gestion/ui";
import { LoadingState } from "@/components/ui/LoadingState";
import { requireAdminPage } from "@/server/auth/guard";
import { ROLE_LABELS } from "@/server/auth/roles";
import { listAdminAccounts } from "@/server/data/admin/accounts";

// Lit la session : rendu à chaque visite, jamais mis en cache.
export const instant = false;

export const metadata: Metadata = { title: "Comptes" };

async function MemberList({ currentUserId }: { currentUserId: string }) {
  const accounts = await listAdminAccounts();
  // Membres avec un rôle d'abord, puis les comptes sans accès.
  const sorted = [...accounts].sort((a, b) => Number(b.role !== null) - Number(a.role !== null));

  if (sorted.length === 0) {
    return <p className="text-body text-muted">Aucun compte.</p>;
  }

  return (
    <ul className="flex flex-col gap-4">
      {sorted.map((account) => {
        const self = account.userId === currentUserId;
        return (
          <li key={account.userId} className="rounded-card border border-line bg-white p-5 shadow-card sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex min-w-0 flex-col gap-1">
                <h3 className="text-h4">
                  {account.fullName || account.email}
                  {self && <span className="ml-2 text-small font-normal text-muted">(vous)</span>}
                </h3>
                <p className="text-body break-all text-ink">{account.email}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  {account.role ? (
                    <StatusBadge tone={account.role === "editor" ? "neutral" : "info"}>{ROLE_LABELS[account.role]}</StatusBadge>
                  ) : (
                    <StatusBadge tone="warning">Aucun accès</StatusBadge>
                  )}
                  <span className="text-small text-muted">
                    {account.role && account.roleGrantedAt
                      ? `Rôle attribué le ${formatShortDate(account.roleGrantedAt)}`
                      : `Compte créé le ${formatShortDate(account.createdAt)}`}
                  </span>
                </div>
              </div>
              {self ? (
                <p className="max-w-xs text-small text-muted">
                  Vous ne pouvez pas modifier votre propre accès : demandez-le à un autre super administrateur.
                </p>
              ) : (
                <MemberActions
                  member={{ userId: account.userId, fullName: account.fullName || account.email, email: account.email, role: account.role }}
                />
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/** Comptes de l'administration (super administrateur) : membres, rôles, invitations. */
export default async function AccountsPage({ searchParams }: PageProps<"/admin/comptes">) {
  const session = await requireAdminPage("super_admin");
  const deleted = param(await searchParams, "supprime") === "1";

  return (
    <div className="flex flex-col gap-8">
      <GestionHeader
        title="Comptes"
        description="Personnes qui ont accès à l'administration et leur rôle. Il n'y a pas d'inscription libre : chaque membre est invité par email."
      />
      {deleted && <Flash text="Le compte a été supprimé." />}

      <Panel
        id="comptes-inviter"
        title="Inviter un membre"
        description="La personne reçoit un email avec un lien pour choisir son mot de passe. Les administrateurs devront activer la double authentification à leur première connexion."
      >
        <InviteMemberForm />
      </Panel>

      <section aria-labelledby="comptes-membres" className="flex flex-col gap-4">
        <h2 id="comptes-membres" className="text-h3">
          Membres
        </h2>
        <Suspense fallback={<LoadingState variant="list" count={3} label="Chargement des comptes…" />}>
          <MemberList currentUserId={session.userId} />
        </Suspense>
      </section>
    </div>
  );
}
