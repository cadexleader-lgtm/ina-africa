import Link from "next/link";
import { ArrowRight, Clock, HandCoins, Landmark, Smartphone } from "lucide-react";

import { Alert } from "@/components/ui/Alert";
import { LinkButton } from "@/components/ui/Button";
import { ContactAlternatives, hasContacts, type OrgContacts } from "@/components/forms/ContactAlternatives";
import { CopyValueButton } from "@/components/donate/CopyValueButton";
import { DONATE_TEXT } from "@/content/fr/forms";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";
import { formatFcfa, progressPercent } from "@/lib/money";
import type { CampaignProgress, DonationCampaign, OfflineDonationInstruction } from "@/lib/types/content";

/*
 * Briques des pages de don (composants serveur, sans état). Tout ce qui est
 * affiché vient de l'administration : instructions de don hors ligne,
 * montants suggérés, appels aux dons, jauge. Rien n'est inventé ; un bloc
 * vide est masqué ou remplacé par un message honnête.
 */

const D = DONATE_TEXT;

// ---------------------------------------------------------------------------
// Paiement en ligne : honnête tant qu'aucun prestataire n'est actif
// ---------------------------------------------------------------------------

export function OnlinePaymentSoon({ hasOffline, contacts }: { hasOffline: boolean; contacts: OrgContacts }) {
  return (
    <Alert tone="info" title={D.online.soonTitle} role="none">
      <p>{D.online.soonText}</p>
      <p className="mt-1">{hasOffline ? D.online.soonWithOffline : D.online.soonWithoutOffline}</p>
      {!hasOffline && hasContacts(contacts) && <ContactAlternatives contacts={contacts} className="mt-3" />}
    </Alert>
  );
}

// ---------------------------------------------------------------------------
// Dons hors ligne (Mobile Money, virement)
// ---------------------------------------------------------------------------

const METHOD_ICON = { mobile_money: Smartphone, bank_transfer: Landmark } as const;

export function OfflineInstructions({
  instructions,
  contacts,
  headingLevel: Heading = "h2",
  compact = false,
}: {
  instructions: OfflineDonationInstruction[];
  contacts: OrgContacts;
  headingLevel?: "h2" | "h3";
  compact?: boolean;
}) {
  const O = D.offline;

  if (instructions.length === 0) {
    return (
      <div className="rounded-card border border-line bg-ivory p-6">
        <Heading className="text-h4">{O.emptyTitle}</Heading>
        <p className="mt-2 text-muted">{O.emptyText}</p>
        {hasContacts(contacts) && (
          <>
            <p className="mt-4 text-ink">{O.emptyContact}</p>
            <ContactAlternatives contacts={contacts} className="mt-2" />
          </>
        )}
        <LinkButton href="/contact" variant="secondary" size="sm" className="mt-5">
          {O.emptyAction}
        </LinkButton>
      </div>
    );
  }

  return (
    <div>
      <Heading className={compact ? "text-h4" : "text-h3"}>{O.title}</Heading>
      {!compact && <p className="mt-2 text-muted">{O.intro}</p>}
      <ul className={cn("mt-5 grid gap-4", !compact && "sm:grid-cols-2")}>
        {instructions.map((item, index) => {
          const Icon = METHOD_ICON[item.method];
          return (
            <li key={`${item.method}-${index}`} className="flex flex-col gap-3 rounded-card border border-line bg-white p-5">
              <div className="flex items-center gap-3">
                <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-50">
                  <Icon className="size-5 text-brand-2" strokeWidth={1.75} />
                </span>
                <div className="min-w-0">
                  <p className="text-small font-medium text-muted">{O.methods[item.method]}</p>
                  <p className="font-semibold text-brand">{item.label}</p>
                </div>
              </div>
              <dl className="flex flex-col gap-1 text-body">
                {item.holder && (
                  <div className="flex flex-wrap gap-x-2">
                    <dt className="text-muted">{O.holder} :</dt>
                    <dd className="font-medium text-ink">{item.holder}</dd>
                  </div>
                )}
                {item.number && (
                  <div className="flex flex-wrap gap-x-2">
                    <dt className="text-muted">{O.number} :</dt>
                    <dd className="font-semibold break-all text-ink tabular-nums">{item.number}</dd>
                  </div>
                )}
              </dl>
              {item.note && <p className="text-small text-muted">{item.note}</p>}
              {item.number && (
                <div>
                  <CopyValueButton value={item.number} label={item.label} />
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <div className="mt-5 flex gap-3 rounded-card bg-ivory p-5">
        <HandCoins aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-brand-2" />
        <div>
          <p className="font-semibold text-brand">{O.afterTitle}</p>
          <p className="mt-1 text-muted">{O.afterText}</p>
          <Link href="/contact" className="mt-2 inline-flex items-center gap-1.5 font-semibold text-link underline-offset-4 hover:underline">
            {O.afterAction}
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Montants suggérés par l'administration (repères, non cliquables sans paiement en ligne)
// ---------------------------------------------------------------------------

export function SuggestedAmounts({ amounts, headingLevel: Heading = "h2" }: { amounts: number[]; headingLevel?: "h2" | "h3" }) {
  const valid = amounts.filter((amount) => Number.isSafeInteger(amount) && amount > 0);
  if (valid.length === 0) return null;
  return (
    <div>
      <Heading className="text-h4">{D.amounts.title}</Heading>
      <p className="mt-2 text-small text-muted">{D.amounts.text}</p>
      <ul className="mt-4 flex flex-wrap gap-2">
        {valid.map((amount) => (
          <li
            key={amount}
            className="rounded-full border border-gold bg-gold-50 px-4 py-1.5 font-semibold text-brand tabular-nums"
          >
            {formatFcfa(amount)}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Appels aux dons
// ---------------------------------------------------------------------------

/** Période d'un appel aux dons (« Du 1 novembre 2026 au 31 décembre 2026 »), ou null. */
export function campaignPeriod(campaign: Pick<DonationCampaign, "startsOn" | "endsOn">): string | null {
  const start = formatDate(campaign.startsOn);
  const end = formatDate(campaign.endsOn);
  if (start && end) return D.campaign.between(start, end);
  if (end) return `${D.campaign.until} ${end}`;
  if (start) return `${D.campaign.from} ${start}`;
  return null;
}

/**
 * Jauge d'un appel aux dons : seulement si la base la renvoie (l'admin a
 * choisi de l'afficher). En ligne et hors ligne toujours distingués.
 */
export function CampaignProgressBar({ progress }: { progress: CampaignProgress }) {
  const P = D.progress;
  const percent = progressPercent(progress.totalAmount, progress.goalAmount);
  return (
    <section aria-labelledby="collecte-titre" className="rounded-card border border-line bg-white p-6">
      <h2 id="collecte-titre" className="text-h4">
        {P.title}
      </h2>
      <p className="mt-4 flex flex-wrap items-baseline gap-x-2">
        <span className="font-heading text-h2 text-brand tabular-nums">{formatFcfa(progress.totalAmount)}</span>
        <span className="text-muted">
          {P.collected}
          {progress.goalAmount ? ` ${P.goal(formatFcfa(progress.goalAmount))}` : ""}
        </span>
      </p>
      {percent !== null && (
        <>
          <div
            role="progressbar"
            aria-label={P.barLabel}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
            aria-valuetext={P.percent(percent)}
            className="mt-4 h-3 overflow-hidden rounded-full bg-brand-50"
          >
            <div className="h-full rounded-full bg-gold" style={{ width: `${percent}%` }} />
          </div>
          <p className="mt-2 text-small font-semibold text-brand">{P.percent(percent)}</p>
        </>
      )}
      <p className="mt-3 text-small text-ink">{P.count(progress.donationsCount)}</p>
      <p className="mt-1 text-small text-muted">{P.split(formatFcfa(progress.onlineAmount), formatFcfa(progress.offlineAmount))}</p>
      <p className="mt-3 flex gap-2 text-small text-muted">
        <Clock aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        {P.note}
      </p>
    </section>
  );
}
