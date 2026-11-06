"use client";

import { ArrowLeft, RotateCcw } from "lucide-react";

import { Button, LinkButton } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { ErrorState } from "@/components/ui/ErrorState";
import { Section } from "@/components/ui/Section";
import { NEWS_T } from "@/content/fr/news";

/**
 * Erreur inattendue dans une page du site : message humain, AUCUN détail
 * technique (ni message, ni identifiant). L'en-tête et le pied de page restent
 * affichés (ils sont dans le layout, hors de cette limite d'erreur).
 */
export default function SiteError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <Section tone="ivory">
      <Container size="reading">
        <ErrorState
          headingLevel="h1"
          title={NEWS_T.error.title}
          description={NEWS_T.error.text}
          action={
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button onClick={() => retry()} iconLeft={<RotateCcw aria-hidden="true" />}>
                {NEWS_T.error.retry}
              </Button>
              <LinkButton href="/" variant="secondary" iconLeft={<ArrowLeft aria-hidden="true" />}>
                {NEWS_T.error.home}
              </LinkButton>
            </div>
          }
        />
      </Container>
    </Section>
  );
}
