import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Alert } from "@/components/ui/Alert";
import { formatFcfa } from "@/lib/money";

/** Forme des chiffres affichés (voir src/app/(admin)/(espace)/admin/dashboard-stats.ts). */
export type DashboardStatsData = {
  articles: { published: number; in_review: number; draft: number };
  projects_published: number;
  donations?: {
    online: { count: number; amount: number };
    offline: { count: number; amount: number };
    total_amount: number;
  };
  campaigns_active?: number;
  requests_unread?: { contact: number; volunteer: number; membership: number; sponsorship: number };
  newsletter_subscribed?: number;
};

const NUMBER = new Intl.NumberFormat("fr-FR");

function plural(count: number, one: string, many: string): string {
  return `${NUMBER.format(count)} ${count > 1 ? many : one}`;
}

function StatGroup({
  id,
  title,
  description,
  children,
  columns = "sm:grid-cols-2 xl:grid-cols-4",
}: {
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
  columns?: string;
}) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 id={id} className="text-h3">
          {title}
        </h2>
        {description && <p className="max-w-measure text-small text-muted">{description}</p>}
      </div>
      <ul className={`grid gap-4 ${columns}`}>{children}</ul>
    </section>
  );
}

/**
 * Un chiffre, son libellé et (facultatif) le lien vers la page concernée.
 * Le lien porte un texte explicite (pas seulement « voir »).
 */
function Stat({
  label,
  value,
  detail,
  href,
  linkLabel,
  highlight = false,
}: {
  label: string;
  value: string;
  detail?: string;
  href?: string;
  linkLabel?: string;
  highlight?: boolean;
}) {
  return (
    <li className={`flex flex-col gap-1 rounded-card border bg-white p-5 shadow-card ${highlight ? "border-gold" : "border-line"}`}>
      <p className="text-small text-muted">{label}</p>
      <p className="font-heading text-h3 text-brand tabular-nums">{value}</p>
      {detail && <p className="text-small text-muted">{detail}</p>}
      {href && linkLabel && (
        <Link
          href={href}
          className="mt-2 inline-flex min-h-9 items-center gap-1.5 self-start text-small font-semibold text-link underline-offset-4 hover:text-link-strong hover:underline"
        >
          {linkLabel}
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      )}
    </li>
  );
}

/**
 * Chiffres du tableau de bord. Les dons en ligne (paiements vérifiés) et
 * hors ligne (saisis par l'équipe) sont TOUJOURS affichés séparément, puis
 * totalisés. Dons, demandes et lettre d'information ne sont renvoyés par la
 * base qu'aux administrateurs : un éditeur ne voit que les contenus.
 */
export function DashboardStatsView({ stats }: { stats: DashboardStatsData | null }) {
  if (!stats) {
    return <Alert tone="warning">Les chiffres ne sont pas disponibles pour le moment. Réessayez dans un instant.</Alert>;
  }
  const { articles, donations, requests_unread: requests } = stats;
  const isAdminView = donations !== undefined || requests !== undefined;
  const unreadTotal = requests ? requests.contact + requests.volunteer + requests.membership + requests.sponsorship : 0;

  return (
    <div className="flex flex-col gap-10">
      {isAdminView && (
        <StatGroup id="stats-a-traiter" title="À traiter" columns="sm:grid-cols-2">
          {requests && (
            <Stat
              label="Demandes non lues"
              value={NUMBER.format(unreadTotal)}
              highlight={unreadTotal > 0}
              href="/admin/demandes?statut=unread"
              linkLabel="Lire les demandes non lues"
            />
          )}
          <Stat
            label="Articles à relire"
            value={NUMBER.format(articles.in_review)}
            detail="Soumis par l'équipe, en attente de publication."
            highlight={articles.in_review > 0}
            href="/admin/articles"
            linkLabel="Voir les articles"
          />
        </StatGroup>
      )}

      {donations && (
        <StatGroup
          id="stats-dons"
          title="Dons reçus"
          description="En ligne : paiements vérifiés auprès du prestataire. Hors ligne : dons Mobile Money ou virement saisis par l'équipe, hors dons annulés."
        >
          <Stat
            label="En ligne (paiements vérifiés)"
            value={formatFcfa(donations.online.amount)}
            detail={plural(donations.online.count, "don", "dons")}
            href="/admin/dons?canal=online"
            linkLabel="Voir les dons en ligne"
          />
          <Stat
            label="Hors ligne (saisis par l'équipe)"
            value={formatFcfa(donations.offline.amount)}
            detail={plural(donations.offline.count, "don", "dons")}
            href="/admin/dons?canal=offline"
            linkLabel="Voir les dons hors ligne"
          />
          <Stat
            label="Total des dons"
            value={formatFcfa(donations.total_amount)}
            detail="En ligne + hors ligne"
            href="/admin/dons/nouveau"
            linkLabel="Enregistrer un don hors ligne"
          />
          {stats.campaigns_active !== undefined && (
            <Stat
              label="Appels aux dons actifs"
              value={NUMBER.format(stats.campaigns_active)}
              href="/admin/appels-aux-dons"
              linkLabel="Gérer les appels aux dons"
            />
          )}
        </StatGroup>
      )}

      {requests && (
        <StatGroup id="stats-demandes" title="Demandes non lues, par type">
          <Stat
            label="Contact"
            value={NUMBER.format(requests.contact)}
            href="/admin/demandes?type=contact&statut=unread"
            linkLabel="Voir les messages de contact"
          />
          <Stat
            label="Bénévolat"
            value={NUMBER.format(requests.volunteer)}
            href="/admin/demandes?type=volunteer&statut=unread"
            linkLabel="Voir les candidatures bénévoles"
          />
          <Stat
            label="Adhésion"
            value={NUMBER.format(requests.membership)}
            href="/admin/demandes?type=membership&statut=unread"
            linkLabel="Voir les demandes d'adhésion"
          />
          <Stat
            label="Partenariat"
            value={NUMBER.format(requests.sponsorship)}
            href="/admin/demandes?type=sponsorship&statut=unread"
            linkLabel="Voir les demandes de partenariat"
          />
        </StatGroup>
      )}

      <StatGroup id="stats-contenus" title={isAdminView ? "Contenus du site" : "Articles et projets"}>
        <Stat
          label="Articles publiés"
          value={NUMBER.format(articles.published)}
          href="/admin/articles"
          linkLabel="Voir les articles"
        />
        {!isAdminView && (
          <Stat
            label="Articles en relecture"
            value={NUMBER.format(articles.in_review)}
            detail="Soumis, en attente de publication par un administrateur."
          />
        )}
        <Stat label="Brouillons d'articles" value={NUMBER.format(articles.draft)} />
        <Stat
          label="Projets publiés"
          value={NUMBER.format(stats.projects_published)}
          href={isAdminView ? "/admin/projets" : undefined}
          linkLabel={isAdminView ? "Gérer les projets" : undefined}
        />
        {stats.newsletter_subscribed !== undefined && (
          <Stat
            label="Abonnés à la lettre d'information"
            value={NUMBER.format(stats.newsletter_subscribed)}
            detail="Inscriptions confirmées"
            href="/admin/newsletter"
            linkLabel="Voir les abonnés"
          />
        )}
      </StatGroup>
    </div>
  );
}
