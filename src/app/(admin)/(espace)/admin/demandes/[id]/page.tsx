import type { Metadata } from "next";
import { Suspense } from "react";
import { Mail, Phone, SearchX } from "lucide-react";

import {
  formatDateTime,
  mailtoHref,
  REQUEST_STATUS,
  REQUEST_TYPE_LABELS,
  requestDetails,
  telHref,
} from "@/components/admin/gestion/labels";
import { RequestActions } from "@/components/admin/gestion/RequestActions";
import { DetailList, GestionHeader, Panel, StatusBadge } from "@/components/admin/gestion/ui";
import { buttonClasses, LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { requireAdminPage } from "@/server/auth/guard";
import { getRequest } from "@/server/data/admin/inbox";

// Lit la session : rendu à chaque visite, jamais mis en cache.
export const instant = false;

export const metadata: Metadata = { title: "Détail d'une demande" };

const BACK = { href: "/admin/demandes", label: "Retour aux demandes" };

async function RequestDetail({ id }: { id: string }) {
  const request = await getRequest(id);
  if (!request) {
    return (
      <div className="flex flex-col gap-8">
        <GestionHeader title="Demande introuvable" back={BACK} />
        <EmptyState
          icon={SearchX}
          headingLevel="h2"
          surface="white"
          title="Cette demande n'existe pas ou a été supprimée"
          action={<LinkButton href="/admin/demandes">Voir les demandes</LinkButton>}
        />
      </div>
    );
  }

  const type = REQUEST_TYPE_LABELS[request.type];
  const status = REQUEST_STATUS[request.status];
  const replySubject = request.subject ? `Re : ${request.subject}` : `Votre demande (${type.toLowerCase()}) — INA-AFRICA`;
  const email = mailtoHref(request.email, replySubject);
  const phone = telHref(request.phone);
  const details = requestDetails(request.details);

  return (
    <div className="flex flex-col gap-8">
      <GestionHeader
        title={request.fullName}
        description={`${type} · reçue le ${formatDateTime(request.createdAt)}`}
        back={BACK}
      />

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Panel id="demande-message" title={request.subject ?? "Message"}>
          {request.message ? (
            <p className="max-w-measure text-body whitespace-pre-line break-words text-ink">{request.message}</p>
          ) : (
            <p className="text-body text-muted">Aucun message.</p>
          )}
          {details.length > 0 && (
            <div className="mt-6 border-t border-line pt-4">
              <DetailList items={details} />
            </div>
          )}
        </Panel>

        <div className="flex flex-col gap-6">
          <Panel id="demande-contact" title="Coordonnées">
            <div className="flex flex-col gap-4">
              <DetailList
                items={[
                  { label: "Organisation", value: request.organization },
                  { label: "Email", value: request.email },
                  { label: "Téléphone", value: request.phone },
                ]}
              />
              <div className="flex flex-wrap gap-3">
                {email && (
                  <a href={email} className={buttonClasses({ variant: "primary", size: "sm" })}>
                    <Mail aria-hidden="true" />
                    Répondre par email
                  </a>
                )}
                {phone && (
                  <a href={phone} className={buttonClasses({ variant: "secondary", size: "sm" })}>
                    <Phone aria-hidden="true" />
                    Appeler
                  </a>
                )}
              </div>
            </div>
          </Panel>

          <Panel id="demande-suivi" title="Suivi">
            <div className="flex flex-col gap-4">
              <p>
                <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
              </p>
              <DetailList
                items={[
                  { label: "Dernier changement", value: request.handledAt ? formatDateTime(request.handledAt) : null },
                  { label: "Par", value: request.handledByName },
                  { label: "Consentement donné le", value: formatDateTime(request.consentAt) },
                ]}
              />
              <RequestActions id={request.id} status={request.status} name={request.fullName} />
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

/** Détail d'une demande (admin) : lecture, réponse, suivi, suppression. */
export default async function RequestPage({ params }: PageProps<"/admin/demandes/[id]">) {
  await requireAdminPage("admin");
  const { id } = await params;
  return (
    <Suspense fallback={<LoadingState variant="text" count={3} label="Chargement de la demande…" />}>
      <RequestDetail id={id} />
    </Suspense>
  );
}
