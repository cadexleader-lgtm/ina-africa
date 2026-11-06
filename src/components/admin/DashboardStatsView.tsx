import type { ReactNode } from "react";

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

function StatGroup({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="rounded-card border border-line bg-white p-6 shadow-card">
      <h2 id={id} className="text-h4">
        {title}
      </h2>
      <dl className="mt-4 grid gap-4 sm:grid-cols-2">{children}</dl>
    </section>
  );
}

function Stat({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-small text-muted">{label}</dt>
      <dd className="font-heading text-h3 text-brand">{value}</dd>
      {detail && <dd className="text-small text-muted">{detail}</dd>}
    </div>
  );
}

function plural(count: number, one: string, many: string): string {
  return `${NUMBER.format(count)} ${count > 1 ? many : one}`;
}

/** Chiffres du tableau de bord, affichés simplement (dons en ligne et hors ligne toujours séparés). */
export function DashboardStatsView({ stats }: { stats: DashboardStatsData | null }) {
  if (!stats) {
    return <Alert tone="warning">Les chiffres ne sont pas disponibles pour le moment. Réessayez dans un instant.</Alert>;
  }
  const { articles, donations, requests_unread: requests } = stats;
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <StatGroup id="stats-contenus" title="Contenus">
        <Stat label="Articles publiés" value={NUMBER.format(articles.published)} />
        <Stat label="Articles à relire" value={NUMBER.format(articles.in_review)} />
        <Stat label="Brouillons" value={NUMBER.format(articles.draft)} />
        <Stat label="Projets publiés" value={NUMBER.format(stats.projects_published)} />
      </StatGroup>

      {donations && (
        <StatGroup id="stats-dons" title="Dons reçus">
          <Stat
            label="En ligne (paiements vérifiés)"
            value={formatFcfa(donations.online.amount)}
            detail={plural(donations.online.count, "don", "dons")}
          />
          <Stat
            label="Hors ligne (saisis par l'équipe)"
            value={formatFcfa(donations.offline.amount)}
            detail={plural(donations.offline.count, "don", "dons")}
          />
          <Stat label="Total" value={formatFcfa(donations.total_amount)} />
          {stats.campaigns_active !== undefined && (
            <Stat label="Appels aux dons actifs" value={NUMBER.format(stats.campaigns_active)} />
          )}
        </StatGroup>
      )}

      {requests && (
        <StatGroup id="stats-demandes" title="Demandes non lues">
          <Stat label="Contact" value={NUMBER.format(requests.contact)} />
          <Stat label="Bénévolat" value={NUMBER.format(requests.volunteer)} />
          <Stat label="Adhésion" value={NUMBER.format(requests.membership)} />
          <Stat label="Partenariat" value={NUMBER.format(requests.sponsorship)} />
        </StatGroup>
      )}

      {stats.newsletter_subscribed !== undefined && (
        <StatGroup id="stats-newsletter" title="Lettre d'information">
          <Stat label="Abonnés confirmés" value={NUMBER.format(stats.newsletter_subscribed)} />
        </StatGroup>
      )}
    </div>
  );
}
