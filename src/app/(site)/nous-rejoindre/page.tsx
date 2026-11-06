import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Heart } from "lucide-react";

import { LinkButton } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { JOIN_PATHS } from "@/components/forms/JoinLayout";
import { PageIntro } from "@/components/forms/PageParts";
import { CARD, CARD_LINK, CARD_MORE } from "@/components/site/card-styles";
import { FORM_TEXT } from "@/content/fr/forms";
import { PAGE_BACKDROPS } from "@/content/provisional-images";

const J = FORM_TEXT.join;

export const metadata: Metadata = {
  title: J.metaTitle,
  description: J.metaDescription,
  alternates: { canonical: "/nous-rejoindre" },
  openGraph: { title: J.metaTitle, description: J.metaDescription, url: "/nous-rejoindre" },
};

const TEXT_LINK =
  "inline-flex items-center gap-1.5 font-semibold text-white underline decoration-gold decoration-2 underline-offset-[6px] transition-colors duration-(--duration-fast) hover:decoration-white";

/** Accueil des trois parcours : bénévole, membre, partenaire (+ don). */
export default function JoinPage() {
  return (
    <>
      <PageIntro
        backdrop={PAGE_BACKDROPS.join} eyebrow={J.eyebrow} title={J.title} intro={J.intro} breadcrumbs={[{ label: J.breadcrumb }]} />

      <Section labelledBy="rejoindre-parcours">
        <Container>
          <h2 id="rejoindre-parcours" className="sr-only">
            {J.pathsTitle}
          </h2>
          <ul className="grid gap-6 md:grid-cols-3">
            {JOIN_PATHS.map((path) => (
              <li key={path.key} className="flex">
                <article className={`${CARD} flex-1 flex-col p-6 sm:p-8`}>
                  <span aria-hidden="true" className="mb-6 flex size-14 items-center justify-center rounded-full bg-brand-50">
                    <path.icon className="size-7 text-brand-2" strokeWidth={1.75} />
                  </span>
                  <h3 className="text-h3">
                    <Link href={path.href} className={CARD_LINK}>
                      {path.title}
                    </Link>
                  </h3>
                  <p className="mt-3 text-muted">{path.text}</p>
                  <p className="mt-4 text-small font-medium text-brand">{J.formLength}</p>
                  <span aria-hidden="true" className={CARD_MORE}>
                    {path.action}
                    <ArrowRight className="size-4 transition-transform duration-(--duration-fast) group-hover:translate-x-0.5" />
                  </span>
                </article>
              </li>
            ))}
          </ul>

          <div className="on-dark mt-section-sm overflow-hidden rounded-panel bg-brand px-6 py-10 sm:px-10 md:px-14 md:py-12">
            <div className="grid items-center gap-8 lg:grid-cols-[1fr_auto] lg:gap-16">
              <div>
                <span aria-hidden="true" className="mb-5 block h-1 w-12 rounded-full bg-gold" />
                <h2 className="text-h3">{J.donateTitle}</h2>
                <p className="mt-3 max-w-measure text-muted-inverse">{J.donateText}</p>
              </div>
              <div className="flex flex-col items-start gap-5">
                <LinkButton href="/faire-un-don" variant="donate" size="lg" iconLeft={<Heart aria-hidden="true" />}>
                  {J.donateAction}
                </LinkButton>
                <Link href="/contact" className={TEXT_LINK}>
                  {J.contactAction}
                  <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
