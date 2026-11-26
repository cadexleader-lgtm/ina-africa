import { HandCoins, HeartPulse, Landmark, Leaf, Scale, type LucideIcon } from "lucide-react";

import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { ResolvedSection } from "@/lib/page-content/resolve";

/** Icône de chaque objectif, dans l'ordre (un objectif ajouté reprend la première). */
const ICONS: LucideIcon[] = [HandCoins, Scale, Landmark, Leaf, HeartPulse];

/** Section 5 : les cinq objectifs statutaires (art. 10). */
export function HomeObjectives({ s }: { s: ResolvedSection }) {
  return (
    <Section labelledBy="accueil-objectifs">
      <Container>
        <Reveal>
          <SectionHeading
            id="accueil-objectifs"
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
        <ul className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
          {s.items("items").map((objective, index) => {
            const Icon = ICONS[index] ?? HandCoins;
            return (
              <li key={index}>
                <Reveal delay={(index % 3) * 70}>
                  <div className="flex gap-4 border-t-2 border-line pt-5">
                    <span aria-hidden="true" className="flex size-12 shrink-0 items-center justify-center rounded-card bg-brand-50 text-brand-2">
                      <Icon className="size-6" strokeWidth={1.75} />
                    </span>
                    <div>
                      <h3 className="text-h4">{objective.title}</h3>
                      {objective.text && <p className="mt-2 text-small text-muted">{objective.text}</p>}
                    </div>
                  </div>
                </Reveal>
              </li>
            );
          })}
        </ul>
      </Container>
    </Section>
  );
}
