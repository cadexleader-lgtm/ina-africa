import { Briefcase, HandCoins, HeartPulse, Landmark, Leaf, Scale, type LucideIcon } from "lucide-react";

import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { OBJECTIVE_THEMES } from "@/content/fr/ina-africa";

const ICONS: Record<(typeof OBJECTIVE_THEMES)[number]["key"], LucideIcon> = {
  femmes: HandCoins,
  jeunes: Briefcase,
  genre: Scale,
  culture: Landmark,
  climat: Leaf,
  sante: HeartPulse,
};

/** Section 5 : objectifs statutaires (art. 10) en six thèmes. */
export function HomeObjectives() {
  return (
    <Section labelledBy="accueil-objectifs">
      <Container>
        <Reveal>
          <SectionHeading
            id="accueil-objectifs"
            label="Nos objectifs"
            title="Ce que nous nous engageons à faire"
            intro={
              // Texte transmis par l'ONG le 19/11/2026 (sans élision devant INA-AFRICA).
              <>
                <p className="font-semibold text-brand">Une vision statutaire claire, un engagement concret sur le terrain.</p>
                <p className="mt-3 text-body">
                  Les objectifs inscrits dans les statuts de INA-AFRICA constituent le socle de notre gouvernance et guident chacune de
                  nos décisions. Bien plus que de simples textes fondateurs, ils représentent une boussole éthique qui oriente nos
                  interventions en faveur des enfants, des orphelins, des jeunes, des femmes vulnérables, des veuves, des filles-mères et
                  des personnes en situation de handicap. C&apos;est cette fidélité à notre mission originelle qui garantit la cohérence, la
                  transparence et l&apos;impact durable de nos actions au service des communautés.
                </p>
              </>
            }
          />
        </Reveal>
        <ul className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
          {OBJECTIVE_THEMES.map((objective, index) => {
            const Icon = ICONS[objective.key];
            return (
              <li key={objective.key}>
                <Reveal delay={(index % 3) * 70}>
                  <div className="flex gap-4 border-t-2 border-line pt-5">
                    <span aria-hidden="true" className="flex size-12 shrink-0 items-center justify-center rounded-card bg-brand-50 text-brand-2">
                      <Icon className="size-6" strokeWidth={1.75} />
                    </span>
                    <div>
                      <h3 className="text-h4">{objective.title}</h3>
                      <p className="mt-2 text-small text-muted">{objective.text}</p>
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
