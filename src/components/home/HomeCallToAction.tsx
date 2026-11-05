import Link from "next/link";
import { ArrowRight, Heart } from "lucide-react";

import { LinkButton } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { T } from "@/content/fr/site";

const TEXT_LINK =
  "inline-flex items-center gap-1.5 font-semibold text-white underline decoration-gold decoration-2 underline-offset-[6px] transition-colors duration-(--duration-fast) hover:decoration-white";

/** Appel à l'action sobre : UN bouton « Faire un don » + deux liens texte. */
export function HomeCallToAction() {
  return (
    <Section labelledBy="accueil-agir">
      <Container>
        <Reveal>
          <div className="on-dark overflow-hidden rounded-panel bg-brand px-6 py-12 sm:px-10 md:px-14 md:py-16">
            <div className="grid items-center gap-10 lg:grid-cols-[1fr_auto] lg:gap-16">
              <div>
                <span aria-hidden="true" className="mb-6 block h-1 w-12 rounded-full bg-gold" />
                <h2 id="accueil-agir" className="text-h2">
                  {T.home.cta.title}
                </h2>
                <p className="mt-4 max-w-measure text-lead text-muted-inverse">{T.home.cta.text}</p>
              </div>
              <div className="flex flex-col items-start gap-6">
                <LinkButton href="/faire-un-don" variant="donate" size="lg" iconLeft={<Heart aria-hidden="true" />}>
                  {T.home.cta.donate}
                </LinkButton>
                <ul className="flex flex-wrap gap-x-8 gap-y-3">
                  <li>
                    <Link href="/nous-rejoindre/benevole" className={TEXT_LINK}>
                      {T.home.cta.volunteer}
                      <ArrowRight aria-hidden="true" className="size-4" />
                    </Link>
                  </li>
                  <li>
                    <Link href="/nous-rejoindre/partenaire" className={TEXT_LINK}>
                      {T.home.cta.partner}
                      <ArrowRight aria-hidden="true" className="size-4" />
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
