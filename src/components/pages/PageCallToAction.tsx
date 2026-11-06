import Link from "next/link";
import { ArrowRight, Heart } from "lucide-react";

import { LinkButton } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { PAGES } from "@/content/fr/pages";
import { DONATE_LINK, JOIN_NAV } from "@/content/fr/site";
import { cn } from "@/lib/cn";

const T = PAGES.callToAction;

const EXPLORE = {
  areas: { href: "/domaines", title: T.areasTitle, text: T.areasText, link: T.areasLink },
  projects: { href: "/projets", title: T.projectsTitle, text: T.projectsText, link: T.projectsLink },
} as const;

type PageCallToActionProps = {
  /** Lien de découverte affiché à côté du don ; `none` = appel au don seul (page projet). */
  explore?: keyof typeof EXPLORE | "none";
  /** id unique du titre du bloc de don (relie la section à son titre). */
  id: string;
  /** Sans marge au-dessus (la section précédente a déjà la sienne). */
  flushTop?: boolean;
  className?: string;
};

const TEXT_LINK =
  "inline-flex items-center gap-1.5 font-semibold text-white underline decoration-gold decoration-2 underline-offset-[6px] transition-colors duration-(--duration-fast) hover:decoration-white";

/**
 * Fin de page sobre : un lien de découverte (domaines ou projets) et UN appel
 * au don (bouton or). Textes d'interface neutres, aucun chiffre.
 */
export function PageCallToAction({ explore = "areas", id, flushTop = false, className }: PageCallToActionProps) {
  const next = explore === "none" ? null : EXPLORE[explore];
  const volunteer = JOIN_NAV.find((item) => item.href.endsWith("/benevole"));

  return (
    <Section spacing={flushTop ? "none" : "compact"} labelledBy={id} className={cn(flushTop && "pb-section-sm", className)}>
      <Container>
        <Reveal className={cn("grid gap-4 md:gap-6", next && "md:grid-cols-5")}>
          {next && (
            <Link
              href={next.href}
              className="group flex flex-col justify-between gap-8 rounded-panel border border-line bg-ivory p-7 transition-[border-color,box-shadow] duration-(--duration-base) hover:border-transparent hover:shadow-card md:col-span-2 md:p-9"
            >
              <span>
                <span className="block font-heading text-h3 text-brand">{next.title}</span>
                <span className="mt-3 block text-muted">{next.text}</span>
              </span>
              <span className="inline-flex items-center gap-2 font-semibold text-link">
                {next.link}
                <ArrowRight
                  aria-hidden="true"
                  className="size-4 transition-transform duration-(--duration-fast) motion-safe:group-hover:translate-x-1"
                />
              </span>
            </Link>
          )}
          <div
            className={cn(
              "on-dark relative overflow-hidden rounded-panel bg-brand p-7 md:p-9",
              next ? "md:col-span-3" : "md:flex md:items-center md:justify-between md:gap-10 md:px-12 md:py-10",
            )}
          >
            <span
              aria-hidden="true"
              className="absolute -right-24 -bottom-24 size-64 rounded-full border-[3px] border-brand-2-light/25"
            />
            <div className="relative">
              <span aria-hidden="true" className="mb-5 block h-1 w-12 rounded-full bg-gold" />
              <h2 id={id} className="text-h3">
                {T.donateTitle}
              </h2>
              <p className="mt-3 max-w-measure text-muted-inverse">{T.donateText}</p>
            </div>
            <div className={cn("relative mt-8 flex flex-wrap items-center gap-x-8 gap-y-4", !next && "md:mt-0 md:shrink-0")}>
              <LinkButton href={DONATE_LINK.href} variant="donate" size="lg" iconLeft={<Heart aria-hidden="true" />}>
                {T.donateLink}
              </LinkButton>
              {next && volunteer && (
                <Link href={volunteer.href} className={TEXT_LINK}>
                  {T.joinLink}
                  <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
              )}
            </div>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
