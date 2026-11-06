import type { Metadata } from "next";
import { CircleCheck, CircleX, Clock, RotateCcw, SearchX } from "lucide-react";

import { LinkButton } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { FormCard, PageIntro } from "@/components/forms/PageParts";
import { DONATE_TEXT } from "@/content/fr/forms";
import { formatFcfa } from "@/lib/money";
import { readPaymentTracking, type PaymentTracking } from "@/server/payments/tracking";

import { AutoRefresh } from "./AutoRefresh";

const D = DONATE_TEXT.tracking;

// Lit l'adresse (?tx=) : rendu complet côté serveur à chaque visite, jamais mis en cache.
export const instant = false;

export const metadata: Metadata = {
  title: D.metaTitle,
  robots: { index: false, follow: false },
  // La référence du paiement est dans l'adresse : jamais transmise aux sites liés.
  // « same-origin » et non « no-referrer » : ce dernier fait envoyer « Origin: null »,
  // que la protection CSRF des actions serveur refuse.
  referrer: "same-origin",
};

function describe(tracking: PaymentTracking) {
  if (tracking.kind === "unavailable") return { Icon: SearchX, tone: "text-muted", title: D.unavailableTitle, text: D.unavailableText };
  if (tracking.kind === "not_found") return { Icon: SearchX, tone: "text-muted", title: D.notFoundTitle, text: D.notFoundText };
  const amount = formatFcfa(tracking.amount);
  switch (tracking.status) {
    case "succeeded":
      return { Icon: CircleCheck, tone: "text-success", title: D.succeededTitle, text: D.succeededText(amount, tracking.campaignTitle) };
    case "failed":
      return { Icon: CircleX, tone: "text-danger", title: D.failedTitle, text: D.failedText };
    case "cancelled":
      return { Icon: CircleX, tone: "text-danger", title: D.cancelledTitle, text: D.cancelledText };
    case "refunded":
      return { Icon: RotateCcw, tone: "text-brand", title: D.refundedTitle, text: D.refundedText };
    default:
      return { Icon: Clock, tone: "text-link", title: D.pendingTitle, text: D.pendingText };
  }
}

/**
 * Suivi d'un don en ligne. Le statut est lu SUR LE SERVEUR à partir de notre
 * référence aléatoire (?tx=), jamais déduit des autres paramètres de l'adresse.
 */
export default async function TrackingPage({ searchParams }: PageProps<"/faire-un-don/suivi">) {
  const { tx } = await searchParams;
  const tracking = await readPaymentTracking(typeof tx === "string" ? tx.trim() : null);
  const { Icon, tone, title, text } = describe(tracking);
  const pending = tracking.kind === "found" && tracking.status === "pending";
  const retry = tracking.kind === "found" && (tracking.status === "failed" || tracking.status === "cancelled");

  return (
    <>
      <PageIntro title={D.title} breadcrumbs={[{ label: DONATE_TEXT.eyebrow, href: "/faire-un-don" }, { label: D.title }]} />
      <Section labelledBy="suivi-statut">
        <Container size="reading">
          <FormCard>
            <div role="status" className="flex flex-col items-start gap-4">
              <Icon aria-hidden="true" className={`size-10 ${tone}`} strokeWidth={1.75} />
              <h2 id="suivi-statut" className="text-h3">
                {title}
              </h2>
              <p className="text-body text-ink">{text}</p>
              {tracking.kind === "found" && (
                <dl className="mt-2 flex flex-col gap-1 text-body">
                  <div className="flex flex-wrap gap-x-2">
                    <dt className="text-muted">{D.amountLabel} :</dt>
                    <dd className="font-semibold text-ink tabular-nums">{formatFcfa(tracking.amount)}</dd>
                  </div>
                  {tracking.campaignTitle && (
                    <div className="flex flex-wrap gap-x-2">
                      <dt className="text-muted">{D.campaignLabel} :</dt>
                      <dd className="font-medium text-ink">{tracking.campaignTitle}</dd>
                    </div>
                  )}
                </dl>
              )}
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {pending && (
                <>
                  <AutoRefresh />
                  <LinkButton href={`/faire-un-don/suivi?tx=${encodeURIComponent(String(tx))}`} variant="secondary">
                    {D.refresh}
                  </LinkButton>
                </>
              )}
              {(retry || tracking.kind !== "found") && (
                <LinkButton href="/faire-un-don" variant="donate">
                  {D.retry}
                </LinkButton>
              )}
              <LinkButton href="/contact" variant="secondary">
                {D.contact}
              </LinkButton>
            </div>
          </FormCard>
        </Container>
      </Section>
    </>
  );
}
