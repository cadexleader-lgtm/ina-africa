import { ArrowRight } from "lucide-react";

import { LinkButton } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { Eyebrow } from "@/components/ui/SectionHeading";
import { T } from "@/content/fr/site";
import type { SiteSettings } from "@/lib/types/content";

/** Premier paragraphe d'un texte (paragraphes séparés par une ligne vide). */
function firstParagraph(text: string | null): string | null {
  return text?.split(/\n\s*\n/).map((part) => part.trim()).find(Boolean) ?? null;
}

/**
 * Présentation rapide, éditoriale : premier paragraphe de l'historique + vision
 * (textes de l'administration). Masquée si les deux sont vides.
 */
export function HomeAbout({ settings }: { settings: SiteSettings }) {
  const intro = firstParagraph(settings.aboutHistory);
  const vision = settings.vision?.trim() || null;
  if (!intro && !vision) return null;

  return (
    <Section labelledBy="accueil-presentation">
      <Container>
        <Reveal className="grid gap-8 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <Eyebrow className="mb-4">{T.home.about.label}</Eyebrow>
            <h2 id="accueil-presentation" className="text-h2">
              {T.home.about.title}
            </h2>
          </div>
          <div className="lg:col-span-7">
            {intro && <p className="max-w-measure text-lead text-ink">{intro}</p>}
            {vision && (
              <div className="mt-10 max-w-measure border-l-[3px] border-gold pl-6 md:pl-8">
                <h3 className="text-small font-semibold text-muted">{T.home.about.visionTitle}</h3>
                <p className="mt-3 font-heading text-h3 font-semibold text-brand">{vision}</p>
              </div>
            )}
            <LinkButton
              href="/a-propos"
              variant="secondary"
              className="mt-10"
              iconRight={<ArrowRight aria-hidden="true" />}
            >
              {T.home.about.more}
            </LinkButton>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
