import { ArrowRight, Heart } from "lucide-react";

import { LinkButton } from "@/components/ui/Button";
import { ShareLinks } from "@/components/site/ShareLinks";
import { DONATE_TEXT } from "@/content/fr/forms";
import { formatFcfa } from "@/lib/money";

const T = DONATE_TEXT.thanks;

/**
 * Remerciement après un don CONFIRMÉ (vérifié auprès de KKiaPay), ou après un
 * paiement de test (avec la mention « mode test »). Invite à partager : un
 * don en appelle souvent d'autres. Aucune promesse d'impact chiffré.
 */
export function DonationThanks({
  amount,
  cause,
  shareUrl,
  test = false,
  headingLevel: Heading = "h2",
  titleId,
}: {
  amount: number;
  /** Titre du besoin soutenu (appel aux dons), sinon don général. */
  cause: string | null;
  /** Adresse ABSOLUE à partager (page du besoin ou page de don). */
  shareUrl: string;
  test?: boolean;
  headingLevel?: "h1" | "h2" | "h3";
  /** id du titre (pour aria-labelledby). */
  titleId?: string;
}) {
  const SubHeading = Heading === "h1" ? "h2" : Heading === "h2" ? "h3" : "h4";
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <span aria-hidden="true" className="relative flex size-24 items-center justify-center">
        <span className="absolute inset-0 rounded-full bg-gold-50 motion-safe:animate-ping motion-safe:[animation-duration:2.4s] motion-safe:[animation-iteration-count:2]" />
        <span className="relative flex size-24 items-center justify-center rounded-full bg-gold shadow-card">
          <Heart className="size-11 fill-brand text-brand" strokeWidth={1.5} />
        </span>
      </span>

      <div className="flex flex-col items-center gap-3">
        <Heading id={titleId} className="text-h2">
          {T.title}
        </Heading>
        <p className="inline-flex items-center rounded-full border border-gold bg-gold-50 px-4 py-1 text-lead font-semibold text-brand tabular-nums">
          {formatFcfa(amount)}
        </p>
        <p className="max-w-measure text-lead text-ink">{T.text(formatFcfa(amount), cause)}</p>
        {test && <p className="max-w-measure rounded-card bg-ivory px-4 py-2 text-small text-muted">{T.testNote}</p>}
      </div>

      <section aria-labelledby="merci-partage" className="w-full rounded-card border border-line bg-ivory p-5 text-left sm:p-6">
        <SubHeading id="merci-partage" className="text-h4">
          {T.shareTitle}
        </SubHeading>
        <p className="mt-1 mb-4 text-small text-muted">{T.shareText}</p>
        <ShareLinks url={shareUrl} message={T.shareMessage(cause)} />
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
        <LinkButton href="/nos-besoins" variant="primary" iconRight={<ArrowRight aria-hidden="true" />}>
          {T.needs}
        </LinkButton>
        <LinkButton href="/projets#actions-documentees" variant="secondary">
          {T.next}
        </LinkButton>
      </div>
    </div>
  );
}
