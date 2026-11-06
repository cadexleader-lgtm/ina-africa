import { ExternalLink } from "lucide-react";

import { PageIntro } from "@/components/news/PageIntro";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { ILLUSTRATIONS } from "@/content/illustrations";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata = pageMetadata({
  title: "Crédits photos",
  description: "Auteurs et licences des photos d'illustration et de la carte utilisées sur le site d'INA-AFRICA.",
  path: "/credits-photos",
});

/** Crédits des photos d'illustration (obligatoires pour les licences CC BY / CC BY-SA). */
export default function PhotoCreditsPage() {
  return (
    <>
      <PageIntro
        breadcrumbs={[{ label: "Accueil", href: "/" }, { label: "Crédits photos" }]}
        label="Crédits"
        title="Crédits photos"
        intro="Les photos d'illustration de ce site sont publiées sous licence libre sur Wikimedia Commons. Elles illustrent les domaines d'action de l'ONG et ne montrent pas des actions d'INA-AFRICA."
      />
      <Section spacing="compact">
        <Container size="reading">
          <ul className="divide-y divide-line border-y border-line">
            {ILLUSTRATIONS.map((item) => (
              <li key={item.path} className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center">
                {/* eslint-disable-next-line @next/next/no-img-element -- vignette locale déjà optimisée */}
                <img
                  src={item.path.replace(/\.webp$/, "-sm.webp")}
                  alt={item.alt}
                  width={160}
                  height={Math.round((160 * item.height) / item.width)}
                  loading="lazy"
                  className="w-40 shrink-0 rounded-field object-cover"
                />
                <div className="min-w-0 text-body">
                  <p className="font-semibold text-brand">« {item.credit.title} »</p>
                  <p className="text-muted">
                    {item.credit.author} —{" "}
                    {item.credit.licenseUrl ? (
                      <a href={item.credit.licenseUrl} className="text-link underline underline-offset-4 hover:text-link-strong">
                        {item.credit.license}
                      </a>
                    ) : (
                      item.credit.license
                    )}
                    , via Wikimedia Commons. Recadrée et compressée pour le web.
                  </p>
                  <a
                    href={item.credit.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-small text-link underline-offset-4 hover:underline"
                  >
                    Voir la photo d&apos;origine <ExternalLink aria-hidden="true" className="size-3.5" />
                    <span className="sr-only">(nouvel onglet)</span>
                  </a>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-8 text-small text-muted">
            Contour de la carte de l&apos;Afrique : données Natural Earth (domaine public). Logo : propriété
            d&apos;INA-AFRICA.
          </p>
        </Container>
      </Section>
    </>
  );
}
