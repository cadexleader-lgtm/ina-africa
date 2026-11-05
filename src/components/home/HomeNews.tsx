import { ArrowRight, Newspaper } from "lucide-react";

import { LinkButton } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ArticleCard } from "@/components/site/ArticleCard";
import { T } from "@/content/fr/site";
import type { ArticleSummary } from "@/lib/types/content";

/** 3 dernières actualités publiées ; état vide sobre sinon. */
export function HomeNews({ articles }: { articles: ArticleSummary[] }) {
  return (
    <Section tone="ivory" labelledBy="accueil-actualites">
      <Container>
        <Reveal>
          <SectionHeading
            id="accueil-actualites"
            label={T.home.news.label}
            title={T.home.news.title}
            action={
              articles.length > 0 && (
                <LinkButton href="/actualites" variant="link" iconRight={<ArrowRight aria-hidden="true" />}>
                  {T.home.news.all}
                </LinkButton>
              )
            }
          />
        </Reveal>
        {articles.length === 0 ? (
          <Reveal>
            <EmptyState icon={Newspaper} surface="white" title={T.home.news.emptyTitle} description={T.home.news.emptyText} />
          </Reveal>
        ) : (
          <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article, index) => (
              <li key={article.id} className="flex">
                <Reveal delay={index * 80} className="flex w-full">
                  <ArticleCard article={article} className="w-full" />
                </Reveal>
              </li>
            ))}
          </ul>
        )}
      </Container>
    </Section>
  );
}
