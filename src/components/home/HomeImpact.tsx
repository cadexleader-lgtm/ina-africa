import { ArrowRight } from "lucide-react";

import { LinkButton } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { ResponsiveImage } from "@/components/ui/ResponsiveImage";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { Eyebrow } from "@/components/ui/SectionHeading";
import { PROVISIONAL_IMAGES } from "@/content/provisional-images";
import { T } from "@/content/fr/site";
import type { SiteSettings } from "@/lib/types/content";

/**
 * Notre impact humain : texte de l'administration + photo, AUCUN chiffre.
 * Masquée si le titre et le texte sont vides.
 */
export function HomeImpact({ settings }: { settings: SiteSettings }) {
  if (!settings.impactTitle && !settings.impactText) return null;
  const image = settings.impactImage ?? PROVISIONAL_IMAGES.atelierCouture;

  return (
    <Section tone="brand" labelledBy={settings.impactTitle ? "accueil-impact" : undefined} aria-label={settings.impactTitle ? undefined : T.home.impact.label}>
      <Container>
        <Reveal className="grid items-center gap-10 md:grid-cols-12 md:gap-12 lg:gap-16">
          <div className="md:col-span-5">
            <div className="relative aspect-[4/3] overflow-hidden rounded-card rounded-tr-[4rem] md:aspect-[4/5] lg:rounded-tr-[5rem]">
              <ResponsiveImage image={image} fill focus="50% 35%" sizes="(min-width: 1024px) 480px, (min-width: 768px) 40vw, 100vw" />
            </div>
          </div>
          <div className="md:col-span-7">
            <Eyebrow inverse className="mb-4">
              {T.home.impact.label}
            </Eyebrow>
            {settings.impactTitle && (
              <h2 id="accueil-impact" className="text-h2">
                {settings.impactTitle}
              </h2>
            )}
            {settings.impactText && <p className="mt-6 max-w-measure text-lead text-muted-inverse">{settings.impactText}</p>}
            <LinkButton href="/projets" variant="inverse" className="mt-10" iconRight={<ArrowRight aria-hidden="true" />}>
              {T.home.impact.action}
            </LinkButton>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
