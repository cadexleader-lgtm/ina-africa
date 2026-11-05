import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { PartnersStrip } from "@/components/site/PartnersStrip";
import { T } from "@/content/fr/site";
import type { Partner } from "@/lib/types/content";

/** Bandeau partenaires : UNIQUEMENT si des partenaires sont activés dans l'administration. */
export function HomePartners({ partners }: { partners: Partner[] }) {
  if (partners.length === 0) return null;
  return (
    <Section spacing="compact" labelledBy="accueil-partenaires" className="border-t border-line">
      <Container>
        <SectionHeading id="accueil-partenaires" align="center" label={T.home.partners.label} title={T.home.partners.title} />
        <PartnersStrip partners={partners} />
      </Container>
    </Section>
  );
}
