import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { DomainCard } from "@/components/site/DomainCard";
import { T } from "@/content/fr/site";
import type { ActionArea } from "@/lib/types/content";

/** Grille des domaines actifs + accès à la page des domaines. Masquée s'il n'y a aucun domaine actif. */
export function HomeAreas({ areas }: { areas: ActionArea[] }) {
  if (areas.length === 0) return null;

  return (
    <Section tone="ivory" labelledBy="accueil-domaines">
      <Container>
        <Reveal>
          <SectionHeading id="accueil-domaines" label={T.home.areas.label} title={T.home.areas.title} />
        </Reveal>
        <ul className="grid gap-3 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
          {areas.map((area, index) => (
            <li key={area.id} className="flex">
              <Reveal delay={(index % 4) * 70} className="flex w-full">
                <DomainCard area={area} className="w-full" />
              </Reveal>
            </li>
          ))}
          <li className="flex">
            <Reveal delay={(areas.length % 4) * 70} className="flex w-full">
              <Link
                href="/domaines"
                className="group flex w-full items-center justify-between gap-4 rounded-card bg-brand p-5 font-heading text-h4 text-white transition-colors duration-(--duration-base) hover:bg-brand-strong sm:flex-col sm:items-start sm:justify-end sm:p-6"
              >
                <span>{T.home.areas.all}</span>
                <span
                  aria-hidden="true"
                  className="flex size-11 shrink-0 items-center justify-center rounded-full bg-gold text-brand transition-transform duration-(--duration-fast) motion-safe:group-hover:translate-x-1"
                >
                  <ArrowRight className="size-5" />
                </span>
              </Link>
            </Reveal>
          </li>
        </ul>
      </Container>
    </Section>
  );
}
