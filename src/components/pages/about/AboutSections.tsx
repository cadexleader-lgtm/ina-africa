import { Check, Gavel, Landmark, ShieldCheck, Wallet, type LucideIcon } from "lucide-react";

import { Container } from "@/components/ui/Container";
import { ResponsiveImage } from "@/components/ui/ResponsiveImage";
import { Reveal } from "@/components/ui/Reveal";
import { Section, type SectionTone } from "@/components/ui/Section";
import { Eyebrow } from "@/components/ui/SectionHeading";
import { splitTerm } from "@/components/pages/page-helpers";
import { formatAchievementDate } from "@/components/site/AchievementCard";
import { ACHIEVEMENTS, AUDIENCES, EXPERIENCE, GOVERNANCE } from "@/content/fr/ina-africa";
import { FOUNDING_YEAR, PAGES } from "@/content/fr/pages";
import type { ProvisionalImage } from "@/content/provisional-images";
import { cn } from "@/lib/cn";

const T = PAGES.about;

/** Repères chronologiques : la création, puis les actions datées (de la plus ancienne à la plus récente). */
const TIMELINE = [
  { when: String(FOUNDING_YEAR), what: "Création de l'ONG INA-AFRICA" },
  ...ACHIEVEMENTS.filter((item) => item.date)
    .sort((a, b) => (a.date! < b.date! ? -1 : 1))
    .map((item) => ({ when: formatAchievementDate(item.date!), what: item.title })),
];

/** Libellé + titre h2 d'une section de la page À propos. */
function Heading({ id, label, title, inverse = false }: { id: string; label: string; title: string; inverse?: boolean }) {
  return (
    <>
      <Eyebrow inverse={inverse} className="mb-4">
        {label}
      </Eyebrow>
      <h2 id={`${id}-titre`} className="text-h2">
        {title}
      </h2>
    </>
  );
}

/** Numéro décoratif « 01 » (la liste ordonnée porte déjà l'ordre pour les lecteurs d'écran). */
function Ordinal({ value, inverse = false }: { value: number; inverse?: boolean }) {
  return (
    <span aria-hidden="true" className={cn("font-heading text-h3 font-extrabold tabular-nums", inverse ? "text-white" : "text-brand")}>
      {String(value).padStart(2, "0")}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Historique
// ---------------------------------------------------------------------------

export function AboutHistory({
  paragraphs,
  image,
  tone,
}: {
  paragraphs: string[];
  /** Illustration provisoire (mention « Photo d'illustration » automatique), ou null. */
  image: ProvisionalImage | null;
  tone: SectionTone;
}) {
  const [lead, ...rest] = paragraphs;
  const id = T.history.id;
  return (
    <Section id={id} tone={tone} labelledBy={`${id}-titre`}>
      <Container>
        <Reveal className={cn("grid gap-12 lg:gap-16", image && "md:grid-cols-12 md:items-center")}>
          {image && (
            <div className="md:col-span-5">
              <div className="relative aspect-[4/3] overflow-hidden rounded-card rounded-tl-[4rem] md:aspect-[4/5] lg:rounded-tl-[5rem]">
                <ResponsiveImage
                  image={image}
                  fill
                  focus="50% 35%"
                  sizes="(min-width: 1280px) 480px, (min-width: 768px) 40vw, 100vw"
                  labelPosition="bottom-right"
                />
              </div>
            </div>
          )}
          <div className={cn(image ? "md:col-span-7" : "grid gap-10 lg:grid-cols-12 lg:gap-16")}>
            <div className={cn(!image && "lg:col-span-4")}>
              <Heading id={id} label={T.history.label} title={T.history.title} />
              <p className="mt-8 flex items-baseline gap-4">
                <span className="font-heading text-h1 text-brand">{FOUNDING_YEAR}</span>
                <span className="text-small font-semibold text-muted">{T.history.yearLabel}</span>
              </p>
            </div>
            <div className={cn("max-w-measure", image ? "mt-8" : "lg:col-span-8")}>
              <p className="text-lead text-ink">{lead}</p>
              {rest.map((paragraph, index) => (
                <p key={index} className="mt-5 text-ink">
                  {paragraph}
                </p>
              ))}
              <h3 className="mt-8 text-h4">Quelques repères</h3>
              <ol className="mt-4 border-l-2 border-gold/60 pl-6">
                {TIMELINE.map((item) => (
                  <li key={item.when + item.what} className="relative pb-4 last:pb-0">
                    <span aria-hidden="true" className="absolute top-1.5 -left-[1.95rem] size-3 rounded-full border-2 border-white bg-gold" />
                    <span className="block text-small font-semibold text-brand">{item.when}</span>
                    <span className="text-body text-ink">{item.what}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Vision
// ---------------------------------------------------------------------------

export function AboutVision({ text, explanation }: { text: string; explanation?: string }) {
  const id = T.vision.id;
  return (
    <Section id={id} tone="brand" labelledBy={`${id}-titre`} className="relative isolate overflow-hidden">
      <span
        aria-hidden="true"
        className="absolute -bottom-48 -left-40 -z-10 size-[30rem] rounded-full border-[3px] border-brand-2-light/20"
      />
      <Container>
        <Reveal className="grid gap-8 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <Heading id={id} label={T.vision.label} title={T.vision.title} inverse />
          </div>
          <div className="lg:col-span-8">
            <p className="max-w-[36ch] border-l-[3px] border-gold pl-6 font-heading text-h3 font-semibold text-white md:pl-8">
              {text}
            </p>
            {explanation && <p className="mt-6 max-w-measure text-lead text-muted-inverse">{explanation}</p>}
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Missions (colonnes numérotées)
// ---------------------------------------------------------------------------

export function AboutMissions({ items, tone }: { items: string[]; tone: SectionTone }) {
  const id = T.missions.id;
  return (
    <Section id={id} tone={tone} labelledBy={`${id}-titre`}>
      <Container>
        <Reveal className="mb-12 max-w-reading">
          <Heading id={id} label={T.missions.label} title={T.missions.title} />
        </Reveal>
        <ol className={cn("grid gap-x-10 gap-y-10", items.length >= 3 ? "md:grid-cols-3" : items.length === 2 && "md:grid-cols-2")}>
          {items.map((item, index) => (
            <li key={index}>
              <Reveal delay={index * 80} className="h-full border-t-2 border-brand pt-6">
                <Ordinal value={index + 1} />
                <p className="mt-4 text-ink">{item}</p>
              </Reveal>
            </li>
          ))}
        </ol>
      </Container>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Objectifs (titre fixe à gauche, liste à droite)
// ---------------------------------------------------------------------------

export function AboutObjectives({ items, tone }: { items: string[]; tone: SectionTone }) {
  const id = T.objectives.id;
  return (
    <Section id={id} tone={tone} labelledBy={`${id}-titre`}>
      <Container>
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
          <Reveal className="lg:col-span-4">
            <div className="lg:sticky lg:top-[calc(var(--spacing-header)+2rem)]">
              <Heading id={id} label={T.objectives.label} title={T.objectives.title} />
            </div>
          </Reveal>
          <ul className="divide-y divide-line border-y border-line lg:col-span-8">
            {items.map((item, index) => (
              <li key={index} className="flex gap-5 py-6 sm:gap-6 sm:py-7">
                <span
                  aria-hidden="true"
                  className={cn(
                    "mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full",
                    tone === "ivory" ? "bg-white" : "bg-brand-50",
                  )}
                >
                  <Check className="size-5 text-brand-2" strokeWidth={2.25} />
                </span>
                <p className="max-w-measure text-ink">{item}</p>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Valeurs (affichées SEULEMENT si renseignées par l'ONG)
// ---------------------------------------------------------------------------

export function AboutValues({ lines, tone }: { lines: string[]; tone: SectionTone }) {
  const id = T.values.id;
  const values = lines.map(splitTerm);
  const single = values.length === 1 && !values[0].description;
  return (
    <Section id={id} tone={tone} labelledBy={`${id}-titre`}>
      <Container>
        <Reveal className="mb-12 max-w-reading">
          <Heading id={id} label={T.values.label} title={T.values.title} />
        </Reveal>
        {single ? (
          <p className="max-w-measure text-lead text-ink">{values[0].term}</p>
        ) : (
          <ul className="grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {values.map((value, index) => (
              <li key={index} className="border-l-[3px] border-gold pl-5">
                <p className="font-heading text-h4 text-brand">{value.term}</p>
                {value.description && <p className="mt-2 text-muted">{value.description}</p>}
              </li>
            ))}
          </ul>
        )}
      </Container>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Approche d'intervention = moyens d'action (étapes numérotées)
// ---------------------------------------------------------------------------

export function AboutApproach({ items, tone }: { items: string[]; tone: SectionTone }) {
  const id = T.approach.id;
  const columns =
    items.length >= 5 ? "sm:grid-cols-2 lg:grid-cols-5" : items.length === 4 ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-3";
  return (
    <Section id={id} tone={tone} labelledBy={`${id}-titre`}>
      <Container>
        <Reveal className="mb-12 max-w-reading">
          <Heading id={id} label={T.approach.label} title={T.approach.title} />
          <p className="mt-4 text-lead text-muted">{T.approach.intro}</p>
        </Reveal>
        <ol className={cn("grid gap-4", items.length > 1 && columns)}>
          {items.map((item, index) => (
            <li key={index} className="flex">
              <Reveal
                delay={index * 70}
                className={cn(
                  "flex w-full items-center gap-4 rounded-card border border-line p-4 sm:flex-col sm:items-start sm:gap-0 sm:p-6",
                  tone === "ivory" ? "bg-white" : "bg-ivory",
                )}
              >
                <span
                  aria-hidden="true"
                  className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand font-heading text-body font-bold text-white"
                >
                  {index + 1}
                </span>
                <span aria-hidden="true" className="mt-5 hidden h-0.5 w-8 rounded-full bg-gold sm:block" />
                <p className="font-heading text-h4 font-semibold text-brand sm:mt-4">{item}</p>
              </Reveal>
            </li>
          ))}
        </ol>
      </Container>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Contexte et raison d'être (historique, expériences, publics)
// ---------------------------------------------------------------------------

export function AboutContext({ paragraphs, tone }: { paragraphs: string[]; tone: SectionTone }) {
  const id = "raison-d-etre";
  return (
    <Section id={id} tone={tone} labelledBy={`${id}-titre`}>
      <Container>
        <Reveal className="grid gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-6">
            <Heading id={id} label="Contexte et raison d'être" title="Pourquoi INA-AFRICA existe" />
            <div className="mt-6 space-y-4 text-ink">
              {paragraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 40)}>{paragraph}</p>
              ))}
              <p>{EXPERIENCE.impact}</p>
            </div>
            <h3 className="mt-8 text-h4">Les publics accompagnés</h3>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {AUDIENCES.map((audience) => (
                <li key={audience.title} className={cn("rounded-card p-4", tone === "ivory" ? "bg-white" : "bg-ivory")}>
                  <span className="block font-semibold text-brand">{audience.title}</span>
                  <span className="text-small text-muted">{audience.text}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:col-span-6">
            <div className="rounded-panel bg-brand p-6 text-white sm:p-8">
              <h3 className="text-h3 text-white">Depuis sa création, INA-AFRICA œuvre pour…</h3>
              <ul className="mt-6 space-y-3">
                {EXPERIENCE.fields.map((field) => (
                  <li key={field} className="flex items-start gap-3 text-body">
                    <span aria-hidden="true" className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-gold text-brand">
                      <Check className="size-4" strokeWidth={2.5} />
                    </span>
                    {field}
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-small text-muted-inverse">
                Avec une approche participative et centrée sur l&apos;impact à long terme.
              </p>
            </div>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Gouvernance
// ---------------------------------------------------------------------------

const GOVERNANCE_ICONS: Record<(typeof GOVERNANCE)[number]["key"], LucideIcon> = {
  assemblee: Landmark,
  administration: Gavel,
  surveillance: ShieldCheck,
  finances: Wallet,
};

export function AboutGovernance({ tone }: { tone: SectionTone }) {
  const id = "gouvernance";
  return (
    <Section id={id} tone={tone} labelledBy={`${id}-titre`}>
      <Container>
        <Reveal className="max-w-reading">
          <Heading id={id} label="Gouvernance" title="Une organisation structurée" />
          <p className="mt-4 text-lead text-muted">
            INA-AFRICA s&apos;appuie sur des instances aux rôles distincts, qui garantissent une direction claire et un
            contrôle indépendant.
          </p>
        </Reveal>
        <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {GOVERNANCE.map((item, index) => {
            const Icon = GOVERNANCE_ICONS[item.key];
            return (
              <li key={item.key} className="flex">
                <Reveal delay={index * 70} className="flex w-full">
                  <div className={cn("flex w-full flex-col rounded-card p-6", tone === "ivory" ? "bg-white shadow-card" : "border border-line bg-white")}>
                    <span aria-hidden="true" className="flex size-12 items-center justify-center rounded-full bg-brand-50 text-brand-2">
                      <Icon className="size-6" strokeWidth={1.75} />
                    </span>
                    <h3 className="mt-4 text-h4">{item.title}</h3>
                    <p className="mt-2 text-small text-muted">{item.text}</p>
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
