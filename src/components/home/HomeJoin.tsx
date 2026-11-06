import Link from "next/link";
import { ArrowRight, HandHeart, Handshake, ShieldCheck, UserPlus, type LucideIcon } from "lucide-react";

import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ENGAGEMENT_OPTIONS, JOIN_REASONS } from "@/content/fr/ina-africa";

const ICONS: Record<(typeof ENGAGEMENT_OPTIONS)[number]["key"], LucideIcon> = {
  membre: UserPlus,
  benevole: HandHeart,
  partenaire: Handshake,
};

/** Section 8 : pourquoi rejoindre INA-AFRICA, et les trois façons de s'engager. */
export function HomeJoin() {
  return (
    <Section tone="ivory" labelledBy="accueil-rejoindre">
      <Container>
        <Reveal>
          <SectionHeading
            id="accueil-rejoindre"
            label="Nous rejoindre"
            title="Pourquoi rejoindre INA-AFRICA ?"
            intro="Chacun peut contribuer, à sa mesure, à un nouvel avenir pour les communautés. Choisissez la forme d'engagement qui vous ressemble."
          />
        </Reveal>

        <ul className="grid gap-5 md:grid-cols-3">
          {ENGAGEMENT_OPTIONS.map((option, index) => {
            const Icon = ICONS[option.key];
            return (
              <li key={option.key} className="flex">
                <Reveal delay={index * 80} className="flex w-full">
                  <Link
                    href={option.href}
                    className="group flex w-full flex-col rounded-card border-t-4 border-gold bg-white p-6 shadow-card transition-shadow duration-(--duration-base) hover:shadow-overlay sm:p-7"
                  >
                    <span aria-hidden="true" className="flex size-12 items-center justify-center rounded-full bg-brand text-white">
                      <Icon className="size-6" strokeWidth={1.75} />
                    </span>
                    <h3 className="mt-5 text-h3">{option.title}</h3>
                    <p className="mt-2 text-body text-muted">{option.text}</p>
                    <span className="mt-auto inline-flex items-center gap-1.5 pt-6 font-semibold text-link group-hover:text-link-strong">
                      {option.action}
                      <ArrowRight aria-hidden="true" className="size-4 transition-transform duration-(--duration-fast) motion-safe:group-hover:translate-x-1" />
                    </span>
                  </Link>
                </Reveal>
              </li>
            );
          })}
        </ul>

        <Reveal className="mt-8">
          <ul className="grid gap-4 rounded-card bg-brand-50 p-5 sm:p-6 md:grid-cols-3">
            {JOIN_REASONS.map((reason) => (
              <li key={reason.title} className="flex gap-3">
                <ShieldCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-brand-2" />
                <span>
                  <span className="block font-semibold text-brand">{reason.title}</span>
                  <span className="text-small text-ink">{reason.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </Reveal>
      </Container>
    </Section>
  );
}
