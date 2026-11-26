import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { PartnersStrip } from "@/components/site/PartnersStrip";
import type { ResolvedSection } from "@/lib/page-content/resolve";
import type { Partner } from "@/lib/types/content";

/** Bandeau partenaires : UNIQUEMENT si des partenaires sont activés dans l'administration. */
export function HomePartners({ s, partners }: { s: ResolvedSection; partners: Partner[] }) {
  if (partners.length === 0) return null;
  return (
    <Section spacing="compact" labelledBy="accueil-partenaires" className="border-t border-line">
      <Container>
        <SectionHeading id="accueil-partenaires" align="center" label={s.line("label")} title={s.line("title")} />
        <PartnersStrip partners={partners} />
      </Container>
    </Section>
  );
}
