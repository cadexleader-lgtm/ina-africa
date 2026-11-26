import Link from "next/link";
import { ArrowRight, HandHeart, Handshake, ShieldCheck, UserPlus, type LucideIcon } from "lucide-react";

import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { Section, type SectionTone } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ENGAGEMENT_OPTIONS } from "@/content/fr/ina-africa";
import type { ResolvedSection } from "@/lib/page-content/resolve";

const ICONS: Record<(typeof ENGAGEMENT_OPTIONS)[number]["key"], LucideIcon> = {
  membre: UserPlus,
  benevole: HandHeart,
  partenaire: Handshake,
};

/**
 * Pourquoi rejoindre INA-AFRICA, et les trois façons de s'engager (accueil, À propos).
 * Textes : Pages du site → À propos → « Pourquoi rejoindre INA-AFRICA ? ».
 */
export function HomeJoin({ s, tone = "ivory", id = "rejoindre" }: { s: ResolvedSection; tone?: SectionTone; id?: string }) {
  const texts = s.items("options");
  const reasons = s.items("reasons");
  return (
    <Section id={id} tone={tone} labelledBy={`${id}-titre`}>
      <Container>
        <Reveal>
          <SectionHeading
            id={`${id}-titre`}
            label={s.line("label")}
            title={s.line("title")}
            intro={
              <>
                <p className="font-semibold text-brand">{s.line("lead")}</p>
                {s.paragraphs("text").map((paragraph, index) => (
                  <p key={index} className="mt-3 text-body">
                    {paragraph}
                  </p>
                ))}
              </>
            }
          />
        </Reveal>

        <ul className="grid gap-5 md:grid-cols-3">
          {ENGAGEMENT_OPTIONS.map((option, index) => {
            const Icon = ICONS[option.key];
            const text = texts[index] ?? option;
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
                    <h3 className="mt-5 text-h3">{text.title}</h3>
                    <p className="mt-2 text-body text-muted">{text.text}</p>
                    <span className="mt-auto inline-flex items-center gap-1.5 pt-6 font-semibold text-link group-hover:text-link-strong">
                      {text.action}
                      <ArrowRight
                        aria-hidden="true"
                        className="size-4 transition-transform duration-(--duration-fast) motion-safe:group-hover:translate-x-1"
                      />
                    </span>
                  </Link>
                </Reveal>
              </li>
            );
          })}
        </ul>

        {reasons.length > 0 && (
          <Reveal className="mt-8">
            <ul className="grid gap-4 rounded-card bg-brand-50 p-5 sm:p-6 md:grid-cols-3">
              {reasons.map((reason, index) => (
                <li key={index} className="flex gap-3">
                  <ShieldCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-brand-2" />
                  <span>
                    <span className="block font-semibold text-brand">{reason.title}</span>
                    <span className="text-small text-ink">{reason.text}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Reveal>
        )}
      </Container>
    </Section>
  );
}
