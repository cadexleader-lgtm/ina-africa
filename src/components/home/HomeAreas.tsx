import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Container } from "@/components/ui/Container";
import { ResponsiveImage } from "@/components/ui/ResponsiveImage";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { PROVISIONAL_AREA_IMAGES } from "@/content/provisional-images";
import { cn } from "@/lib/cn";
import type { ResolvedSection } from "@/lib/page-content/resolve";
import type { ActionArea } from "@/lib/types/content";
import { MediaTile } from "@/components/site/MediaTile";
import { areaIcon } from "@/components/site/domain-icons";

/**
 * Section 4 : les domaines d'intervention en grandes cartes avec photo.
 * Grille de 3 colonnes ; la dernière case mène à la page des domaines. Le
 * premier domaine occupe deux colonnes seulement si la grille reste complète
 * (7 domaines : oui ; 8 piliers : non). Dessous, les domaines d'intervention.
 */
export function HomeAreas({ s, areas }: { s: ResolvedSection; areas: ActionArea[] }) {
  if (areas.length === 0) return null;

  return (
    <Section tone="ivory" labelledBy="accueil-domaines">
      <Container>
        <Reveal>
          <SectionHeading
            id="accueil-domaines"
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
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {areas.map((area, index) => {
            const image = area.image ?? PROVISIONAL_AREA_IMAGES[area.slug] ?? null;
            const wide = index === 0 && (areas.length + 2) % 3 === 0;
            return (
              <li key={area.id} className={cn("flex", wide && "sm:col-span-2")}>
                <Reveal delay={(index % 3) * 70} className="flex w-full">
                  <Link
                    href={`/domaines/${area.slug}`}
                    className="group flex w-full flex-col overflow-hidden rounded-card bg-white shadow-card transition-shadow duration-(--duration-base) hover:shadow-overlay"
                  >
                    <div className={cn("relative overflow-hidden bg-brand-50", wide ? "aspect-[16/9] sm:aspect-[21/9]" : "aspect-[16/10]")}>
                      {image ? (
                        <ResponsiveImage
                          image={image}
                          fill
                          focus="50% 40%"
                          sizes={wide ? "(min-width: 1024px) 780px, (min-width: 640px) 90vw, 100vw" : "(min-width: 1024px) 380px, (min-width: 640px) 45vw, 100vw"}
                          imgClassName="transition-transform duration-500 ease-out motion-safe:group-hover:scale-[1.04]"
                          labelPosition="top-left"
                        />
                      ) : (
                        <MediaTile icon={areaIcon(area.slug)} size="responsive" className="absolute inset-0" />
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-5 sm:p-6">
                      <h3 className={cn("text-brand", wide ? "text-h3" : "text-h4")}>{area.title}</h3>
                      {area.summary && <p className="mt-2 text-small text-muted">{area.summary}</p>}
                      <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-small font-semibold text-link group-hover:text-link-strong">
                        Découvrir le domaine
                        <ArrowRight aria-hidden="true" className="size-4 transition-transform duration-(--duration-fast) motion-safe:group-hover:translate-x-1" />
                      </span>
                    </div>
                  </Link>
                </Reveal>
              </li>
            );
          })}
          <li className="flex">
            <Reveal delay={140} className="flex w-full">
              <Link
                href="/domaines"
                className="group flex w-full flex-col justify-between gap-6 rounded-card bg-brand p-6 text-white transition-colors duration-(--duration-base) hover:bg-brand-strong"
              >
                <span className="font-heading text-h3">{s.line("all")}</span>
                <span className="text-small text-muted-inverse">{s.line("allIntro")}</span>
                <ul className="-mt-3 space-y-2 text-body text-white">
                  {s.list("allItems").map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-gold" />
                      {item}
                    </li>
                  ))}
                </ul>
                <span
                  aria-hidden="true"
                  className="flex size-12 items-center justify-center rounded-full bg-gold text-brand transition-transform duration-(--duration-fast) motion-safe:group-hover:translate-x-1"
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
