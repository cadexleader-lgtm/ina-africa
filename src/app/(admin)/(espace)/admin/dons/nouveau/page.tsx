import type { Metadata } from "next";
import { Suspense } from "react";

import { OfflineDonationForm } from "@/components/admin/gestion/OfflineDonationForm";
import { GestionHeader } from "@/components/admin/gestion/ui";
import { LoadingState } from "@/components/ui/LoadingState";
import { todayIso } from "@/lib/validation/admin/common";
import { requireAdminPage } from "@/server/auth/guard";
import { listAdminCampaigns } from "@/server/data/admin/campaigns";

// Lit la session : rendu à chaque visite, jamais mis en cache.
export const instant = false;

export const metadata: Metadata = { title: "Enregistrer un don hors ligne" };

async function Form() {
  const campaigns = await listAdminCampaigns();
  // Actifs d'abord : ce sont ceux auxquels répondent la plupart des dons.
  const options = [...campaigns]
    .sort((a, b) => Number(b.isActive) - Number(a.isActive))
    .map((campaign) => ({ id: campaign.id, title: campaign.title, isActive: campaign.isActive }));
  // Clé d'idempotence créée à l'affichage du formulaire (un double clic n'enregistre qu'un don).
  return <OfflineDonationForm idempotencyKey={crypto.randomUUID()} campaigns={options} maxDate={todayIso()} />;
}

/** Saisie d'un don reçu par Mobile Money ou virement (admin). */
export default async function NewOfflineDonationPage() {
  await requireAdminPage("admin");
  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <GestionHeader
        title="Enregistrer un don hors ligne"
        description="Pour un don déjà reçu par Mobile Money ou par virement. Il est compté immédiatement dans les dons hors ligne ; une erreur se corrige ensuite en annulant le don (jamais en le supprimant)."
        back={{ href: "/admin/dons", label: "Retour aux dons" }}
      />
      <p className="text-small text-muted">Les champs marqués d&apos;un astérisque sont obligatoires.</p>
      <Suspense fallback={<LoadingState variant="text" count={3} label="Chargement du formulaire…" />}>
        <Form />
      </Suspense>
    </div>
  );
}
