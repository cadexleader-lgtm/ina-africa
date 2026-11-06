import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { HandCoins, Plus } from "lucide-react";

import { CsvExportButton } from "@/components/admin/gestion/CsvExportButton";
import {
  CHANNEL_LABELS,
  DONATION_STATUS,
  donationFilterParams,
  donationFiltersFromParams,
  donorLabel,
  formatDateTime,
  formatFcfa,
  hasActiveFilters,
  plural,
  type DonationListFilters,
} from "@/components/admin/gestion/labels";
import { FilterForm, GestionHeader, StatusBadge, TABLE, TableFrame, TD, TH } from "@/components/admin/gestion/ui";
import { LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { Pagination } from "@/components/ui/Pagination";
import { requireAdminPage } from "@/server/auth/guard";
import { listAdminCampaigns } from "@/server/data/admin/campaigns";
import { listDonations } from "@/server/data/admin/donations";

// Lit la session : rendu à chaque visite, jamais mis en cache.
export const instant = false;

export const metadata: Metadata = { title: "Dons" };

async function DonationFilters({ filters }: { filters: DonationListFilters }) {
  const campaigns = await listAdminCampaigns();
  const params = donationFilterParams(filters);
  return (
    <FilterForm
      action="/admin/dons"
      label="Filtrer les dons"
      active={hasActiveFilters(params)}
      selects={[
        {
          name: "canal",
          label: "Canal",
          value: filters.channel,
          allLabel: "En ligne et hors ligne",
          options: [
            { value: "online", label: CHANNEL_LABELS.online },
            { value: "offline", label: CHANNEL_LABELS.offline },
          ],
        },
        {
          name: "statut",
          label: "Statut",
          value: filters.status,
          allLabel: "Tous les statuts",
          options: Object.entries(DONATION_STATUS).map(([value, { label }]) => ({ value, label })),
        },
        {
          name: "appel",
          label: "Appel aux dons",
          value: filters.campaignId,
          allLabel: "Tous les dons",
          options: campaigns.map((campaign) => ({ value: campaign.id, label: campaign.title })),
        },
      ]}
    />
  );
}

async function DonationList({ filters }: { filters: DonationListFilters }) {
  const params = donationFilterParams(filters);
  const result = await listDonations({
    page: filters.page,
    channel: filters.channel,
    status: filters.status,
    campaignId: filters.campaignId,
  });
  const filtered = hasActiveFilters(params);

  if (result.total === 0) {
    return (
      <EmptyState
        icon={HandCoins}
        headingLevel="h2"
        surface="white"
        title={filtered ? "Aucun don ne correspond à ces filtres" : "Aucun don enregistré pour le moment"}
        description={
          filtered
            ? "Modifiez ou effacez les filtres pour voir les autres dons."
            : "Les dons reçus par Mobile Money ou virement sont à enregistrer ici, avec leur justificatif."
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-small text-muted">
        {plural(result.total, "don", "dons")}
        {filtered ? " correspondant aux filtres" : ""}, du plus récent au plus ancien.
      </p>
      <TableFrame label="Liste des dons">
        <table className={TABLE}>
          <caption className="sr-only">Dons, du plus récent au plus ancien</caption>
          <thead>
            <tr>
              <th scope="col" className={TH}>
                Référence
              </th>
              <th scope="col" className={TH}>
                Enregistré le
              </th>
              <th scope="col" className={TH}>
                Donateur
              </th>
              <th scope="col" className={TH}>
                Canal
              </th>
              <th scope="col" className={`${TH} text-right`}>
                Montant
              </th>
              <th scope="col" className={TH}>
                Statut
              </th>
              <th scope="col" className={TH}>
                Appel aux dons
              </th>
            </tr>
          </thead>
          <tbody>
            {result.items.map((donation) => {
              const status = DONATION_STATUS[donation.status];
              return (
                <tr key={donation.id} className="hover:bg-ivory">
                  <th scope="row" className={`${TD} font-semibold`}>
                    <Link
                      href={`/admin/dons/${donation.id}`}
                      className="text-link underline underline-offset-4 hover:text-link-strong"
                    >
                      {donation.reference}
                    </Link>
                  </th>
                  <td className={`${TD} whitespace-nowrap text-small`}>{formatDateTime(donation.createdAt)}</td>
                  <td className={TD}>{donorLabel(donation)}</td>
                  <td className={`${TD} whitespace-nowrap`}>{CHANNEL_LABELS[donation.channel]}</td>
                  <td className={`${TD} text-right font-semibold whitespace-nowrap tabular-nums`}>
                    {formatFcfa(donation.amount)}
                  </td>
                  <td className={TD}>
                    <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
                  </td>
                  <td className={`${TD} text-small`}>{donation.campaign?.title ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </TableFrame>
      <Pagination
        page={result.page}
        pageCount={result.pageCount}
        basePath="/admin/dons"
        searchParams={params}
        label="Pages de la liste des dons"
      />
    </div>
  );
}

/** Dons (admin) : liste, filtres, export, accès à la saisie d'un don hors ligne. */
export default async function DonationsPage({ searchParams }: PageProps<"/admin/dons">) {
  await requireAdminPage("admin");
  const filters = donationFiltersFromParams(await searchParams);

  return (
    <div className="flex flex-col gap-8">
      <GestionHeader
        title="Dons"
        description="Dons en ligne et hors ligne, toujours distingués. Un don en ligne n'est confirmé que par le prestataire de paiement, après vérification par le serveur : il ne se modifie pas ici."
        actions={
          <LinkButton href="/admin/dons/nouveau" iconLeft={<Plus />}>
            Enregistrer un don hors ligne
          </LinkButton>
        }
      />

      <Suspense fallback={<LoadingState variant="text" count={1} label="Chargement des filtres…" />}>
        <DonationFilters filters={filters} />
      </Suspense>

      <CsvExportButton
        kind="donations"
        label="Exporter ces dons en CSV"
        filters={{ channel: filters.channel, status: filters.status, campaignId: filters.campaignId }}
      />

      <Suspense key={JSON.stringify(filters)} fallback={<LoadingState variant="list" count={5} label="Chargement des dons…" />}>
        <DonationList filters={filters} />
      </Suspense>
    </div>
  );
}
