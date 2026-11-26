import { ArrowRight, Mail, Newspaper } from "lucide-react";

import { LinkButton } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ArticleCard } from "@/components/site/ArticleCard";
import type { ResolvedSection } from "@/lib/page-content/resolve";
import type { ArticleSummary } from "@/lib/types/content";

/**
 * Section 9 : les 3 dernières actualités publiées. Sans article, un bandeau
 * compact invite à suivre l'ONG (newsletter) et à découvrir ses actions.
 */
export function HomeNews({ s, articles }: { s: ResolvedSection; articles: ArticleSummary[] }) {
  if (articles.length === 0) {
    return (
      <Section spacing="compact" aria-label={s.line("label")}>
        <Container>
          <Reveal>
            <div className="flex flex-col gap-6 rounded-card border border-line bg-white p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex gap-4">
                <span aria-hidden="true" className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-2">
                  <Newspaper className="size-6" strokeWidth={1.75} />
                </span>
                <div>
                  <h2 className="text-h4">{s.line("emptyTitle")}</h2>
                  <p className="mt-1 max-w-measure text-small text-muted">{s.text("emptyText")}</p>
                </div>
              </div>
              <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
                <LinkButton href="/newsletter" iconLeft={<Mail aria-hidden="true" />}>
                  S&apos;inscrire à la lettre
                </LinkButton>
                <LinkButton href="/projets" variant="secondary" iconRight={<ArrowRight aria-hidden="true" />}>
                  Voir nos actions
                </LinkButton>
              </div>
            </div>
          </Reveal>
        </Container>
      </Section>
    );
  }

  return (
    <Section labelledBy="accueil-actualites">
      <Container>
        <Reveal>
          <SectionHeading
            id="accueil-actualites"
            label={s.line("label")}
            title={s.line("title")}
            action={
              <LinkButton href="/actualites" variant="link" iconRight={<ArrowRight aria-hidden="true" />}>
                {s.line("all")}
              </LinkButton>
            }
          />
        </Reveal>
        <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((article, index) => (
            <li key={article.id} className="flex">
              <Reveal delay={index * 80} className="flex w-full">
                <ArticleCard article={article} className="w-full" />
              </Reveal>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
