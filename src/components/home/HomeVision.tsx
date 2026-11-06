import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { Eyebrow } from "@/components/ui/SectionHeading";
import { MISSION_TITLES, MISSIONS, VISION, VISION_EXPLAINED } from "@/content/fr/ina-africa";
import type { SiteSettings } from "@/lib/types/content";
import { splitLines } from "@/server/data/site";

/**
 * Section 3 : la vision (statuts, art. 8), ce qu'elle cherche à changer, et
 * les trois missions (art. 9). Textes de l'administration s'ils existent.
 */
export function HomeVision({ settings }: { settings: SiteSettings }) {
  const vision = settings.vision?.trim() || VISION;
  const fromSettings = splitLines(settings.mission);
  const missions = fromSettings.length > 0 ? fromSettings : MISSIONS;

  return (
    <Section tone="brand" labelledBy="accueil-vision">
      <Container>
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
          <Reveal className="lg:col-span-5">
            <Eyebrow inverse className="mb-4">
              Notre vision
            </Eyebrow>
            <h2 id="accueil-vision" className="text-h2">
              Ce que nous voulons changer
            </h2>
            <blockquote className="mt-6 border-l-4 border-gold pl-5 font-heading text-h3 font-semibold text-white">
              {vision}
            </blockquote>
            <p className="mt-6 text-body text-muted-inverse">{VISION_EXPLAINED}</p>
          </Reveal>

          <div className="lg:col-span-7">
            <Reveal>
              <h3 className="text-h3">Nos missions</h3>
            </Reveal>
            <ol className="mt-6 space-y-4">
              {missions.map((mission, index) => (
                <li key={mission.slice(0, 40)}>
                  <Reveal delay={index * 80}>
                    <div className="flex gap-5 rounded-card bg-white/[0.06] p-5 ring-1 ring-white/10 sm:p-6">
                      <span
                        aria-hidden="true"
                        className="flex size-11 shrink-0 items-center justify-center rounded-full bg-gold font-heading text-h4 text-brand"
                      >
                        {index + 1}
                      </span>
                      <div>
                        {MISSION_TITLES[index] && mission === MISSIONS[index] && (
                          <p className="font-heading text-h4 text-white">{MISSION_TITLES[index]}</p>
                        )}
                        <p className="mt-1 text-body text-muted-inverse">{mission}</p>
                      </div>
                    </div>
                  </Reveal>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </Container>
    </Section>
  );
}
