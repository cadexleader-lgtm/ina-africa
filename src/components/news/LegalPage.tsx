import Link from "next/link";
import { ArrowRight, FileText } from "lucide-react";

import { LinkButton } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { Section } from "@/components/ui/Section";
import { RichText } from "@/components/site/RichText";
import { NEWS_T } from "@/content/fr/news";
import { isEmptyDoc, type RichTextDoc } from "@/lib/validation/rich-text";

import { PageIntro } from "./PageIntro";

type LegalPageProps = {
  title: string;
  /** Texte rédigé par l'ONG dans l'administration (paramètres du site). */
  doc: RichTextDoc | null;
  /** L'autre page légale (lien « Voir aussi »). */
  other: { href: string; label: string };
};

/**
 * Page légale : le texte de l'administration, sinon un état vide HONNÊTE.
 * Aucun texte légal générique n'est jamais affiché à la place.
 */
export function LegalPage({ title, doc, other }: LegalPageProps) {
  const hasText = !isEmptyDoc(doc);

  return (
    <>
      <PageIntro
        breadcrumbs={[{ label: NEWS_T.article.home, href: "/" }, { label: title }]}
        label={NEWS_T.legal.label}
        title={title}
        size="reading"
      />
      <Section spacing="compact">
        <Container size="reading">
          {hasText ? (
            <RichText doc={doc} />
          ) : (
            <EmptyState
              icon={FileText}
              headingLevel="h2"
              title={NEWS_T.legal.emptyTitle}
              description={NEWS_T.legal.emptyText}
              action={
                <LinkButton href="/contact" variant="secondary" iconRight={<ArrowRight aria-hidden="true" />}>
                  {NEWS_T.legal.emptyAction}
                </LinkButton>
              }
            />
          )}
          <p className="mt-12 border-t border-line pt-6 text-small text-muted">
            {NEWS_T.legal.otherPage}{" "}
            <Link href={other.href} className="font-semibold text-link underline-offset-4 hover:text-link-strong hover:underline">
              {other.label}
            </Link>
          </p>
        </Container>
      </Section>
    </>
  );
}
