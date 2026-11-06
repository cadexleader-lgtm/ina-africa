import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchX } from "lucide-react";

import { CancelDonationButton, ProofLink } from "@/components/admin/gestion/DonationActions";
import { Flash } from "@/components/admin/gestion/Flash";
import {
  canCancelDonation,
  CHANNEL_LABELS,
  DONATION_STATUS,
  formatDateTime,
  formatFcfa,
  formatShortDate,
  mailtoHref,
  param,
  paymentMethodLabel,
  PROVIDER_LABELS,
  telHref,
  TRANSACTION_STATUS,
} from "@/components/admin/gestion/labels";
import { DetailList, GestionHeader, Panel, StatusBadge, TABLE, TableFrame, TD, TH } from "@/components/admin/gestion/ui";
import { LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { requireAdminPage } from "@/server/auth/guard";
import { getDonation } from "@/server/data/admin/donations";

// Lit la session : rendu à chaque visite, jamais mis en cache.
export const instant = false;

export const metadata: Metadata = { title: "Détail d'un don" };

const BACK = { href: "/admin/dons", label: "Retour aux dons" };

const LINK = "text-link underline underline-offset-4 hover:text-link-strong";

async function DonationDetail({ id, cancelled }: { id: string; cancelled: boolean }) {
  const donation = await getDonation(id);
  if (!donation) {
    return (
      <div className="flex flex-col gap-8">
        <GestionHeader title="Don introuvable" back={BACK} />
        <EmptyState
          icon={SearchX}
          headingLevel="h2"
          surface="white"
          title="Ce don n'existe pas ou n'est plus accessible"
          action={<LinkButton href="/admin/dons">Voir la liste des dons</LinkButton>}
        />
      </div>
    );
  }

  const status = DONATION_STATUS[donation.status];
  const email = mailtoHref(donation.donorEmail, `Votre don ${donation.reference} à INA-AFRICA`);
  const phone = telHref(donation.donorPhone);
  const isOffline = donation.channel === "offline";

  return (
    <div className="flex flex-col gap-8">
      <GestionHeader
        title={`Don ${donation.reference}`}
        description={`${CHANNEL_LABELS[donation.channel]} · enregistré le ${formatDateTime(donation.createdAt)}`}
        back={BACK}
        actions={
          canCancelDonation(donation) ? (
            <CancelDonationButton donationId={donation.id} reference={donation.reference} amount={donation.amount} />
          ) : undefined
        }
      />

      {cancelled && donation.status === "cancelled" && <Flash text="Le don a été annulé : il n'est plus compté dans les totaux." />}

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel id="don-montant" title="Montant et statut">
          <DetailList
            items={[
              { label: "Montant", value: <strong className="font-heading text-h3 text-brand">{formatFcfa(donation.amount)}</strong> },
              { label: "Statut", value: <StatusBadge tone={status.tone}>{status.label}</StatusBadge> },
              { label: "Canal", value: CHANNEL_LABELS[donation.channel] },
              { label: "Mode de paiement", value: paymentMethodLabel(donation.paymentMethod) },
              { label: "Prestataire", value: donation.provider ? PROVIDER_LABELS[donation.provider] : null },
              { label: "Opérateur ou banque", value: isOffline ? donation.operatorOrBank : null },
              { label: "Référence de l'opération", value: donation.externalReference },
              { label: "Reçu le", value: donation.receivedOn ? formatShortDate(donation.receivedOn) : null },
              { label: "Payé le", value: donation.paidAt ? formatDateTime(donation.paidAt) : null },
              { label: "Appel aux dons", value: donation.campaign?.title },
              { label: "Saisi par", value: isOffline ? donation.recordedByName : null },
              { label: "Annulé le", value: donation.cancelledAt ? formatDateTime(donation.cancelledAt) : null },
              { label: "Motif de l'annulation", value: donation.cancellationReason },
            ]}
          />
        </Panel>

        <Panel id="don-donateur" title="Donateur">
          {donation.donorName || donation.donorEmail || donation.donorPhone || donation.donorMessage ? (
            <DetailList
              items={[
                { label: "Nom", value: donation.donorName },
                {
                  label: "Sur le site",
                  value: donation.isAnonymous ? "Anonyme (nom jamais affiché)" : "Nom affichable",
                },
                {
                  label: "Email",
                  value: donation.donorEmail ? (
                    email ? (
                      <a href={email} className={LINK}>
                        {donation.donorEmail}
                      </a>
                    ) : (
                      donation.donorEmail
                    )
                  ) : null,
                },
                {
                  label: "Téléphone",
                  value: donation.donorPhone ? (
                    phone ? (
                      <a href={phone} className={LINK}>
                        {donation.donorPhone}
                      </a>
                    ) : (
                      donation.donorPhone
                    )
                  ) : null,
                },
                {
                  label: "Message",
                  value: donation.donorMessage ? <span className="whitespace-pre-line">{donation.donorMessage}</span> : null,
                },
              ]}
            />
          ) : (
            <p className="text-body text-muted">Aucune information sur le donateur.</p>
          )}
        </Panel>
      </div>

      {isOffline ? (
        <Panel id="don-justificatif" title="Justificatif" description="Document privé : lien temporaire, réservé aux administrateurs.">
          {donation.proofMediaId ? (
            <ProofLink mediaId={donation.proofMediaId} />
          ) : (
            <p className="text-body text-muted">
              {donation.proofPath
                ? "Le justificatif n'est plus disponible dans la médiathèque."
                : "Aucun justificatif n'a été joint à ce don."}
            </p>
          )}
        </Panel>
      ) : (
        <Panel
          id="don-transactions"
          title="Tentatives de paiement"
          description="Lecture seule : seul le serveur enregistre le résultat, après vérification auprès du prestataire."
        >
          {donation.transactions.length === 0 ? (
            <p className="text-body text-muted">Aucune tentative de paiement enregistrée.</p>
          ) : (
            <TableFrame label="Tentatives de paiement">
              <table className={TABLE}>
                <thead>
                  <tr>
                    <th scope="col" className={TH}>
                      Date
                    </th>
                    <th scope="col" className={TH}>
                      Prestataire
                    </th>
                    <th scope="col" className={`${TH} text-right`}>
                      Montant
                    </th>
                    <th scope="col" className={TH}>
                      Statut
                    </th>
                    <th scope="col" className={TH}>
                      Vérifié le
                    </th>
                    <th scope="col" className={TH}>
                      Motif d&apos;échec
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {donation.transactions.map((tx) => {
                    const txStatus = TRANSACTION_STATUS[tx.status];
                    return (
                      <tr key={tx.id}>
                        <td className={`${TD} whitespace-nowrap text-small`}>{formatDateTime(tx.createdAt)}</td>
                        <td className={TD}>{PROVIDER_LABELS[tx.provider] ?? tx.provider}</td>
                        <td className={`${TD} text-right whitespace-nowrap tabular-nums`}>{formatFcfa(tx.amount)}</td>
                        <td className={TD}>
                          <StatusBadge tone={txStatus.tone}>{txStatus.label}</StatusBadge>
                        </td>
                        <td className={`${TD} whitespace-nowrap text-small`}>
                          {tx.verifiedAt ? formatDateTime(tx.verifiedAt) : "Non vérifié"}
                        </td>
                        <td className={`${TD} text-small`}>{tx.failureReason ?? "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </TableFrame>
          )}
          {(donation.utm.source || donation.utm.medium || donation.utm.campaign) && (
            <div className="mt-6">
              <h3 className="text-small font-semibold text-brand">Origine de la visite</h3>
              <div className="mt-2">
                <DetailList
                  items={[
                    { label: "Source", value: donation.utm.source },
                    { label: "Support", value: donation.utm.medium },
                    { label: "Campagne", value: donation.utm.campaign },
                  ]}
                />
              </div>
            </div>
          )}
        </Panel>
      )}
    </div>
  );
}

/** Détail d'un don (admin) : lecture, justificatif, annulation d'un don hors ligne. */
export default async function DonationPage({ params, searchParams }: PageProps<"/admin/dons/[id]">) {
  await requireAdminPage("admin");
  const { id } = await params;
  const cancelled = param(await searchParams, "annule") === "1";
  return (
    <Suspense fallback={<LoadingState variant="text" count={3} label="Chargement du don…" />}>
      <DonationDetail id={id} cancelled={cancelled} />
    </Suspense>
  );
}
