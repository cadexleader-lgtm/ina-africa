import { Check, ShieldCheck } from "lucide-react";

import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { ResolvedSection } from "@/lib/page-content/resolve";

/**
 * Présentation de l'adhésion avant le formulaire : pourquoi rejoindre,
 * rôle des membres, façons de participer, démarche. Aucune condition,
 * cotisation ou avantage inventés : l'organisation les présente elle-même.
 */
export function MembershipIntro({ s }: { s: ResolvedSection }) {
  return (
    <Section tone="ivory" labelledBy="adhesion-pourquoi">
      <Container>
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
          <Reveal className="lg:col-span-6">
            <SectionHeading
              id="adhesion-pourquoi"
              label={s.line("label")}
              title={s.line("title")}
              intro={s.text("intro")}
            />
            <blockquote className="-mt-2 border-l-4 border-gold pl-5 text-body text-ink">
              <span className="block text-small font-semibold text-muted">{s.line("visionLabel")}</span>
              {s.text("vision")}
            </blockquote>
            <ul className="mt-6 space-y-4">
              {s.items("reasons").map((reason, index) => (
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

          <Reveal delay={100} className="space-y-6 lg:col-span-6">
            <div className="rounded-panel bg-white p-6 shadow-card sm:p-8">
              <h2 className="text-h3">{s.line("participateTitle")}</h2>
              <p className="mt-2 text-small text-muted">{s.text("participateIntro")}</p>
              <ul className="mt-4 space-y-2.5">
                {s.list("participate").map((item) => (
                  <li key={item} className="flex items-start gap-3 text-body text-ink">
                    <span aria-hidden="true" className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-gold text-brand">
                      <Check className="size-4" strokeWidth={2.5} />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-panel bg-brand p-6 text-white sm:p-8">
              <h2 className="text-h3 text-white">{s.line("stepsTitle")}</h2>
              <ol className="mt-4 space-y-3">
                {s.list("steps").map((step, index) => (
                  <li key={step} className="flex gap-3">
                    <span aria-hidden="true" className="flex size-7 shrink-0 items-center justify-center rounded-full bg-gold font-heading text-small font-bold text-brand">
                      {index + 1}
                    </span>
                    <span className="text-body text-muted-inverse">{step}</span>
                  </li>
                ))}
              </ol>
              <p className="mt-5 border-t border-white/15 pt-4 text-small text-muted-inverse">{s.text("stepsNote")}</p>
            </div>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}
