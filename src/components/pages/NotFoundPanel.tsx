import { ArrowLeft, SearchX } from "lucide-react";

import { LinkButton } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

/** Contenu des pages 404 de section (domaine ou projet introuvable) : titre h1, explication, retour à la liste. */
export function NotFoundPanel({ title, text, href, linkLabel }: { title: string; text: string; href: string; linkLabel: string }) {
  return (
    <section aria-labelledby="introuvable-titre" className="bg-ivory py-section">
      <Container>
        <div className="mx-auto flex max-w-reading flex-col items-center rounded-panel border border-line bg-white px-6 py-14 text-center sm:px-12">
          <span aria-hidden="true" className="mb-6 flex size-16 items-center justify-center rounded-full bg-brand-50">
            <SearchX className="size-7 text-brand-2" strokeWidth={1.75} />
          </span>
          <h1 id="introuvable-titre" className="text-h2">
            {title}
          </h1>
          <p className="mt-3 max-w-measure text-lead text-muted">{text}</p>
          <LinkButton href={href} variant="secondary" className="mt-8" iconLeft={<ArrowLeft aria-hidden="true" />}>
            {linkLabel}
          </LinkButton>
        </div>
      </Container>
    </section>
  );
}
