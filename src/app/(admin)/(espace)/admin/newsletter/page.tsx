import type { Metadata } from "next";
import { Suspense } from "react";
import { MailOpen } from "lucide-react";

import { CsvExportButton } from "@/components/admin/gestion/CsvExportButton";
import { DeleteSubscriberButton } from "@/components/admin/gestion/DeleteSubscriberButton";
import { Flash } from "@/components/admin/gestion/Flash";
import {
  formatCount,
  formatShortDate,
  hasActiveFilters,
  param,
  plural,
  SUBSCRIBER_STATUS,
  subscriberFiltersFromParams,
  type SubscriberStatus,
  withFlag,
} from "@/components/admin/gestion/labels";
import { FilterForm, GestionHeader, StatusBadge, TABLE, TableFrame, TD, TH } from "@/components/admin/gestion/ui";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { Pagination } from "@/components/ui/Pagination";
import { pageHref } from "@/lib/pagination";
import { requireAdminPage } from "@/server/auth/guard";
import { listNewsletterSubscribers } from "@/server/data/admin/inbox";

// Lit la session : rendu à chaque visite, jamais mis en cache.
export const instant = false;

export const metadata: Metadata = { title: "Lettre d'information" };

async function ConfirmedCount() {
  const confirmed = await listNewsletterSubscribers({ status: "subscribed" });
  return (
    <div className="rounded-card border border-line bg-white p-5 shadow-card sm:p-6">
      <p className="text-small text-muted">Abonnés confirmés</p>
      <p className="font-heading text-h2 text-brand">{formatCount(confirmed.total)}</p>
      <p className="mt-1 text-small text-muted">
        Seules ces adresses ont confirmé leur inscription : ce sont les seules exportées.
      </p>
    </div>
  );
}

async function SubscriberList({ filters }: { filters: { page: number; status?: SubscriberStatus } }) {
  const params = { statut: filters.status };
  const filtered = hasActiveFilters(params);
  const result = await listNewsletterSubscribers({ page: filters.page, status: filters.status });
  const returnHref = withFlag(pageHref("/admin/newsletter", result.page, params), "supprime");

  if (result.total === 0) {
    return (
      <EmptyState
        icon={MailOpen}
        headingLevel="h2"
        surface="white"
        title={filtered ? "Aucune inscription avec ce statut" : "Aucune inscription pour le moment"}
        description="Les inscriptions faites sur le site apparaissent ici après l'envoi du formulaire."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-small text-muted">
        {plural(result.total, "inscription", "inscriptions")}
        {filtered ? " avec ce statut" : ""}, de la plus récente à la plus ancienne.
      </p>
      <TableFrame label="Liste des inscriptions">
        <table className={TABLE}>
          <caption className="sr-only">Inscriptions à la lettre d&apos;information</caption>
          <thead>
            <tr>
              <th scope="col" className={TH}>
                Email
              </th>
              <th scope="col" className={TH}>
                Statut
              </th>
              <th scope="col" className={TH}>
                Inscrit le
              </th>
              <th scope="col" className={TH}>
                Confirmé le
              </th>
              <th scope="col" className={TH}>
                Origine
              </th>
              <th scope="col" className={TH}>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {result.items.map((subscriber) => {
              const status = SUBSCRIBER_STATUS[subscriber.status];
              return (
                <tr key={subscriber.id} className="hover:bg-ivory">
                  <th scope="row" className={`${TD} font-semibold break-all`}>
                    {subscriber.email}
                  </th>
                  <td className={TD}>
                    <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
                  </td>
                  <td className={`${TD} whitespace-nowrap text-small`}>{formatShortDate(subscriber.createdAt)}</td>
                  <td className={`${TD} whitespace-nowrap text-small`}>{formatShortDate(subscriber.confirmedAt)}</td>
                  <td className={`${TD} text-small`}>{subscriber.source ?? "—"}</td>
                  <td className={`${TD} text-right`}>
                    <DeleteSubscriberButton id={subscriber.id} email={subscriber.email} returnHref={returnHref} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </TableFrame>
      <Pagination
        page={result.page}
        pageCount={result.pageCount}
        basePath="/admin/newsletter"
        searchParams={params}
        label="Pages de la liste des inscriptions"
      />
    </div>
  );
}

/** Lettre d'information (admin) : abonnés confirmés, liste, export, suppression. */
export default async function NewsletterPage({ searchParams }: PageProps<"/admin/newsletter">) {
  await requireAdminPage("admin");
  const params = await searchParams;
  const filters = subscriberFiltersFromParams(params);
  const deleted = param(params, "supprime") === "1";

  return (
    <div className="flex flex-col gap-8">
      <GestionHeader
        title="Lettre d'information"
        description="Inscriptions faites sur le site, avec double confirmation par email. Supprimez une adresse si la personne le demande."
      />
      {deleted && <Flash text="L'inscrit a été supprimé." />}

      <div className="grid items-start gap-6 md:grid-cols-[minmax(0,20rem)_1fr]">
        <Suspense fallback={<LoadingState variant="text" count={1} label="Chargement du nombre d'abonnés…" />}>
          <ConfirmedCount />
        </Suspense>
        <div className="flex flex-col gap-2 rounded-card border border-line bg-white p-5 shadow-card sm:p-6">
          <h2 className="text-h4">Exporter les abonnés confirmés</h2>
          <p className="text-small text-muted">
            Fichier CSV lisible dans Excel (email, date de confirmation, origine). Les inscriptions en attente et les
            désinscrits ne sont jamais exportés.
          </p>
          <div className="mt-2">
            <CsvExportButton kind="newsletter" label="Télécharger le fichier CSV" />
          </div>
        </div>
      </div>

      <FilterForm
        action="/admin/newsletter"
        label="Filtrer les inscriptions"
        active={hasActiveFilters({ statut: filters.status })}
        selects={[
          {
            name: "statut",
            label: "Statut",
            value: filters.status,
            allLabel: "Tous les statuts",
            options: Object.entries(SUBSCRIBER_STATUS).map(([value, { label }]) => ({ value, label })),
          },
        ]}
      />

      <Suspense key={JSON.stringify(filters)} fallback={<LoadingState variant="list" count={5} label="Chargement des inscriptions…" />}>
        <SubscriberList filters={filters} />
      </Suspense>
    </div>
  );
}
