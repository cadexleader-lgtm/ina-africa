import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { LinkButton } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/SectionHeading";
import { NEWS_T } from "@/content/fr/news";

import { NewsSearchForm } from "./NewsSearchForm";

/**
 * Contenu de la page 404 : message clair, retour à l'accueil, pages utiles et
 * recherche dans les actualités (formulaire GET, sans JavaScript).
 */
export function NotFoundContent() {
  return (
    <section aria-labelledby="introuvable-titre" className="relative isolate overflow-hidden bg-ivory">
      <span
        aria-hidden="true"
        className="absolute -top-48 -right-48 -z-10 hidden size-[32rem] rounded-full border-[3px] border-brand-2/25 md:block"
      />
      <Container className="py-section">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-center lg:gap-16">
          <div className="lg:col-span-6">
            <Eyebrow className="mb-6">{NEWS_T.notFound.label}</Eyebrow>
            <h1 id="introuvable-titre" className="text-h1">
              {NEWS_T.notFound.title}
            </h1>
            <span aria-hidden="true" className="mt-6 block h-1 w-20 rounded-full bg-gold" />
            <p className="mt-6 max-w-measure text-lead text-muted">{NEWS_T.notFound.text}</p>
            <LinkButton href="/" size="lg" iconLeft={<ArrowLeft aria-hidden="true" />} className="mt-10">
              {NEWS_T.notFound.home}
            </LinkButton>
          </div>

          <div className="rounded-panel border border-line bg-white p-6 shadow-card sm:p-8 lg:col-span-6">
            <h2 className="text-h4">{NEWS_T.notFound.linksTitle}</h2>
            <ul className="mt-4 grid gap-x-6 sm:grid-cols-2">
              {NEWS_T.notFound.links.map((link) => (
                <li key={link.href} className="border-b border-line">
                  <Link
                    href={link.href}
                    className="group flex min-h-12 items-center justify-between gap-3 py-2 font-semibold text-link transition-colors duration-(--duration-fast) hover:text-link-strong"
                  >
                    {link.label}
                    <ArrowRight
                      aria-hidden="true"
                      className="size-4 shrink-0 transition-transform duration-(--duration-fast) group-hover:translate-x-0.5"
                    />
                  </Link>
                </li>
              ))}
            </ul>
            <h2 className="mt-8 mb-4 text-h4">{NEWS_T.notFound.searchTitle}</h2>
            <NewsSearchForm id="recherche-introuvable" hideLabel />
          </div>
        </div>
      </Container>
    </section>
  );
}
