import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Inbox } from "lucide-react";

import { Flash } from "@/components/admin/gestion/Flash";
import {
  formatDateTime,
  hasActiveFilters,
  param,
  plural,
  REQUEST_STATUS,
  REQUEST_TYPE_LABELS,
  requestFiltersFromParams,
  type RequestListFilters,
} from "@/components/admin/gestion/labels";
import { FilterForm, GestionHeader, StatusBadge, TABLE, TableFrame, TD, TH } from "@/components/admin/gestion/ui";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { Pagination } from "@/components/ui/Pagination";
import { cn } from "@/lib/cn";
import { requireAdminPage } from "@/server/auth/guard";
import { listRequests } from "@/server/data/admin/inbox";

// Lit la session : rendu à chaque visite, jamais mis en cache.
export const instant = false;

export const metadata: Metadata = { title: "Demandes" };

async function RequestList({ filters }: { filters: RequestListFilters }) {
  const params = { type: filters.type, statut: filters.status };
  const filtered = hasActiveFilters(params);
  const result = await listRequests({ page: filters.page, type: filters.type, status: filters.status });

  if (result.total === 0) {
    return (
      <EmptyState
        icon={Inbox}
        headingLevel="h2"
        surface="white"
        title={filtered ? "Aucune demande ne correspond à ces filtres" : "Aucune demande reçue pour le moment"}
        description={
          filtered
            ? "Modifiez ou effacez les filtres pour voir les autres demandes."
            : "Les messages envoyés depuis les formulaires Contact et Nous rejoindre arriveront ici."
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-small text-muted">
        {plural(result.total, "demande", "demandes")}
        {filtered ? " correspondant aux filtres" : ""}, de la plus récente à la plus ancienne. Les demandes non lues sont
        en gras.
      </p>
      <TableFrame label="Liste des demandes">
        <table className={TABLE}>
          <caption className="sr-only">Demandes reçues, de la plus récente à la plus ancienne</caption>
          <thead>
            <tr>
              <th scope="col" className={TH}>
                Nom
              </th>
              <th scope="col" className={TH}>
                Type
              </th>
              <th scope="col" className={TH}>
                Objet
              </th>
              <th scope="col" className={TH}>
                Reçue le
              </th>
              <th scope="col" className={TH}>
                Statut
              </th>
            </tr>
          </thead>
          <tbody>
            {result.items.map((request) => {
              const unread = request.status === "unread";
              const status = REQUEST_STATUS[request.status];
              return (
                <tr key={request.id} className="hover:bg-ivory">
                  <th scope="row" className={cn(TD, unread ? "font-bold" : "font-normal")}>
                    <Link
                      href={`/admin/demandes/${request.id}`}
                      className="text-link underline underline-offset-4 hover:text-link-strong"
                    >
                      {request.fullName}
                    </Link>
                  </th>
                  <td className={cn(TD, "whitespace-nowrap", unread && "font-semibold")}>
                    {REQUEST_TYPE_LABELS[request.type]}
                  </td>
                  <td className={cn(TD, "text-small", unread && "font-semibold")}>{request.subject ?? "—"}</td>
                  <td className={cn(TD, "whitespace-nowrap text-small")}>{formatDateTime(request.createdAt)}</td>
                  <td className={TD}>
                    <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
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
        basePath="/admin/demandes"
        searchParams={params}
        label="Pages de la liste des demandes"
      />
    </div>
  );
}

/** Boîte de réception unique : contact, bénévolat, adhésion, partenariat (admin). */
export default async function RequestsPage({ searchParams }: PageProps<"/admin/demandes">) {
  await requireAdminPage("admin");
  const params = await searchParams;
  const filters = requestFiltersFromParams(params);
  const deleted = param(params, "supprimee") === "1";

  return (
    <div className="flex flex-col gap-8">
      <GestionHeader
        title="Demandes"
        description="Messages reçus par les formulaires Contact et Nous rejoindre (bénévolat, adhésion, partenariat). Ouvrir une demande la marque comme lue."
      />
      {deleted && <Flash text="La demande a été supprimée." />}
      <FilterForm
        action="/admin/demandes"
        label="Filtrer les demandes"
        active={hasActiveFilters({ type: filters.type, statut: filters.status })}
        selects={[
          {
            name: "type",
            label: "Type de demande",
            value: filters.type,
            allLabel: "Tous les types",
            options: Object.entries(REQUEST_TYPE_LABELS).map(([value, label]) => ({ value, label })),
          },
          {
            name: "statut",
            label: "Statut",
            value: filters.status,
            allLabel: "Tous les statuts",
            options: Object.entries(REQUEST_STATUS).map(([value, { label }]) => ({ value, label })),
          },
        ]}
      />
      <Suspense key={JSON.stringify(filters)} fallback={<LoadingState variant="list" count={5} label="Chargement des demandes…" />}>
        <RequestList filters={filters} />
      </Suspense>
    </div>
  );
}
