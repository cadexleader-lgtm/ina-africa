import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { ArrowRight, FolderOpen, Heart } from "lucide-react";

import { Alert } from "@/components/ui/Alert";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Button, LinkButton } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Checkbox, FormField, Input, Select, Textarea } from "@/components/ui/FormField";
import { LoadingState } from "@/components/ui/LoadingState";
import { Pagination } from "@/components/ui/Pagination";
import { Section } from "@/components/ui/Section";
import { Eyebrow, SectionHeading } from "@/components/ui/SectionHeading";
import { ArticleCard } from "@/components/site/ArticleCard";
import { DomainCard } from "@/components/site/DomainCard";
import { FooterContacts } from "@/components/site/Footer";
import { Logo } from "@/components/site/Logo";
import { ProjectCard } from "@/components/site/ProjectCard";
import { RichText } from "@/components/site/RichText";
import { TopBarView } from "@/components/site/TopBar";
import { VideoEmbed } from "@/components/site/VideoEmbed";
import type { ActionArea, ArticleSummary, ProjectSummary } from "@/lib/types/content";
import type { RichTextDoc } from "@/lib/validation/rich-text";

import { ModalDemo } from "./ModalDemo";

/*
 * PAGE DE TRAVAIL du design system : désactivée en production, jamais indexée.
 * Toutes les données ci-dessous sont des EXEMPLES NEUTRES construits en code
 * (« Exemple de… ») : aucun contenu de l'ONG n'y est inventé.
 */

export const metadata: Metadata = {
  title: "Design system",
  robots: { index: false, follow: false },
};

// --- Contrastes calculés (WCAG 2.x) ----------------------------------------
function luminance(hex: string): number {
  const [r, g, b] = (hex.replace("#", "").match(/../g) ?? []).map((part) => {
    const c = parseInt(part, 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): string {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return ((high + 0.05) / (low + 0.05)).toFixed(1).replace(".", ",");
}

const COLORS: { token: string; hex: string; usage: string; swatch: string; text: boolean }[] = [
  { token: "brand", hex: "#17465A", usage: "Titres, boutons principaux, en-tête, pied de page", swatch: "bg-brand", text: true },
  { token: "brand-strong", hex: "#0F3442", usage: "Survol des boutons principaux", swatch: "bg-brand-strong", text: true },
  { token: "brand-2", hex: "#079FD2", usage: "Accents seulement (icônes, traits) — jamais de texte courant", swatch: "bg-brand-2", text: false },
  { token: "link", hex: "#0679A1", usage: "Liens et textes d'action", swatch: "bg-link", text: true },
  { token: "gold", hex: "#D9A500", usage: "Traits d'accent, bouton « Faire un don » (texte brand)", swatch: "bg-gold", text: false },
  { token: "ink", hex: "#22343C", usage: "Texte courant", swatch: "bg-ink", text: true },
  { token: "muted", hex: "#5F6B72", usage: "Texte secondaire", swatch: "bg-muted", text: true },
  { token: "ivory", hex: "#F7F7F4", usage: "Fond de section", swatch: "bg-ivory", text: false },
  { token: "brand-50", hex: "#EAF1F4", usage: "Fond des tuiles sans photo", swatch: "bg-brand-50", text: false },
  { token: "line", hex: "#E9ECEF", usage: "Séparateurs, bordures de cartes", swatch: "bg-line", text: false },
  { token: "line-strong", hex: "#8A96A0", usage: "Bordures des champs (≥ 3:1)", swatch: "bg-line-strong", text: false },
];

// --- Exemples neutres --------------------------------------------------------
const EXAMPLE_IMAGE = { path: "/images/styleguide/exemple.svg", alt: "Exemple d'image (visuel de remplacement)" };

const areaWithPhoto: ActionArea = {
  id: "ex-1",
  slug: "autonomisation-des-femmes",
  title: "Exemple de domaine avec photo provisoire",
  summary: "Exemple de courte description d'un domaine, sur deux lignes au plus.",
  description: null,
  image: null,
  displayOrder: 1,
};

const areaWithoutPhoto: ActionArea = {
  ...areaWithPhoto,
  id: "ex-2",
  slug: "innovation-sociale",
  title: "Exemple de domaine sans photo",
};

const project: ProjectSummary = {
  id: "ex-p1",
  slug: "exemple",
  title: "Exemple de titre de projet",
  summary: "Exemple de résumé de projet : une ou deux phrases qui présentent l'action, sans plus.",
  location: "Exemple de lieu",
  startDate: null,
  endDate: null,
  status: "ongoing",
  isFeatured: true,
  publishedAt: "2026-01-15",
  cover: EXAMPLE_IMAGE,
  area: { slug: "exemple", title: "Exemple de domaine" },
};

const article: ArticleSummary = {
  id: "ex-a1",
  slug: "exemple",
  title: "Exemple de titre d'actualité",
  excerpt: "Exemple d'extrait court qui donne envie de lire la suite de l'article.",
  publishedAt: "2026-01-15T10:00:00Z",
  cover: EXAMPLE_IMAGE,
  category: { slug: "exemple", name: "Exemple de catégorie" },
};

const richText: RichTextDoc = {
  type: "doc",
  content: [
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Exemple de sous-titre de niveau 2" }] },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "Exemple de paragraphe avec du texte " },
        { type: "text", text: "en gras", marks: [{ type: "bold" }] },
        { type: "text", text: ", " },
        { type: "text", text: "en italique", marks: [{ type: "italic" }] },
        { type: "text", text: ", " },
        { type: "text", text: "souligné", marks: [{ type: "underline" }] },
        { type: "text", text: ", un " },
        { type: "text", text: "lien interne", marks: [{ type: "link", attrs: { href: "/a-propos" } }] },
        { type: "text", text: " et un " },
        { type: "text", text: "lien externe", marks: [{ type: "link", attrs: { href: "https://example.org" } }] },
        { type: "text", text: "." },
      ],
    },
    { type: "heading", attrs: { level: 3 }, content: [{ type: "text", text: "Exemple de sous-titre de niveau 3" }] },
    {
      type: "bulletList",
      content: [
        { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Exemple de point de liste" }] }] },
        { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Exemple de second point" }] }] },
      ],
    },
    {
      type: "orderedList",
      content: [
        { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Exemple d'étape numérotée" }] }] },
        { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Exemple d'étape suivante" }] }] },
      ],
    },
    {
      type: "blockquote",
      content: [{ type: "paragraph", content: [{ type: "text", text: "Exemple de citation mise en valeur." }] }],
    },
    { type: "horizontalRule" },
    { type: "heading", attrs: { level: 4 }, content: [{ type: "text", text: "Exemple de sous-titre de niveau 4" }] },
    { type: "paragraph", content: [{ type: "text", text: "Exemple de dernier paragraphe." }] },
  ],
};

// --- Mise en page de la page ------------------------------------------------
function Block({ id, title, children, tone = "white" }: { id: string; title: string; children: ReactNode; tone?: "white" | "ivory" }) {
  return (
    <Section tone={tone} spacing="compact" labelledBy={id} className="border-t border-line">
      <Container>
        <h2 id={id} className="mb-8 text-h3">
          {title}
        </h2>
        {children}
      </Container>
    </Section>
  );
}

function Sub({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-10 first:mt-0">
      <h3 className="mb-4 text-small font-semibold text-muted">{title}</h3>
      {children}
    </div>
  );
}

export default function StyleguidePage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <>
      <Section spacing="compact">
        <Container>
          <Eyebrow className="mb-4">Page de travail — non indexée, désactivée en production</Eyebrow>
          <h1 className="text-h1">Design system</h1>
          <p className="mt-4 max-w-measure text-lead text-muted">
            Jetons et composants du site, dans leurs différents états. Les contenus affichés ici sont des exemples neutres.
          </p>
        </Container>
      </Section>

      <Block id="sg-couleurs" title="Couleurs (contrastes calculés)">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {COLORS.map((color) => (
            <li key={color.token} className="flex gap-4 rounded-card border border-line bg-white p-4">
              <span aria-hidden="true" className={`size-14 shrink-0 rounded-field border border-line ${color.swatch}`} />
              <div className="min-w-0 text-small">
                <p className="font-semibold text-brand">
                  {color.token} <span className="font-normal text-muted">{color.hex}</span>
                </p>
                <p className="text-muted">{color.usage}</p>
                <p className="mt-1 text-ink">
                  Blanc {contrast(color.hex, "#FFFFFF")}:1 · Ivoire {contrast(color.hex, "#F7F7F4")}:1
                  {!color.text && <span className="text-muted"> — pas pour du texte</span>}
                </p>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-small text-ink">
          Bouton de don : texte brand sur or = {contrast("#17465A", "#D9A500")}:1 · Texte secondaire sur fond brand (muted-inverse) ={" "}
          {contrast("#C7D6DD", "#17465A")}:1 · Or en texte sur blanc = {contrast("#D9A500", "#FFFFFF")}:1 (interdit).
        </p>
      </Block>

      <Block id="sg-typo" title="Typographie (Manrope pour les titres, Inter pour le texte)" tone="ivory">
        <div className="flex flex-col gap-6">
          <Eyebrow>Libellé de section (14 px, trait doré)</Eyebrow>
          <p className="text-h1 font-heading text-brand">Titre H1 — 36 → 56 px</p>
          <p className="text-h2 font-heading text-brand">Titre H2 — 28 → 40 px</p>
          <p className="text-h3 font-heading text-brand">Titre H3 — 20 → 24 px</p>
          <p className="text-h4 font-heading text-brand">Titre H4 — 18 px</p>
          <p className="max-w-measure text-lead">Chapeau (18 → 20 px) : exemple de phrase d&apos;introduction placée sous un titre.</p>
          <p className="max-w-measure">
            Texte courant (17 px, interligne 1,65, 65 caractères par ligne au plus) : exemple de paragraphe de lecture, avec un{" "}
            <a href="#sg-typo" className="text-link underline underline-offset-4 hover:text-link-strong">
              lien dans le texte
            </a>
            .
          </p>
          <p className="text-small text-muted">Petit texte (14 px, jamais moins) : mentions, dates, aides.</p>
          <div className="flex flex-wrap items-end gap-10">
            <Logo link={false} tagline="always" />
            <div className="rounded-card bg-brand p-4">
              <Logo link={false} inverse tagline="always" />
            </div>
          </div>
        </div>
      </Block>

      <Block id="sg-boutons" title="Boutons">
        <Sub title="Variantes (taille md)">
          <div className="flex flex-wrap items-center gap-3">
            <Button>Principal</Button>
            <Button variant="secondary">Secondaire</Button>
            <Button variant="donate" iconLeft={<Heart aria-hidden="true" />}>
              Faire un don
            </Button>
            <Button variant="ghost">Discret</Button>
            <Button variant="link" iconRight={<ArrowRight aria-hidden="true" />}>
              Lien d&apos;action
            </Button>
          </div>
        </Sub>
        <Sub title="Tailles">
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm">Petit</Button>
            <Button size="md">Moyen</Button>
            <Button size="lg" iconRight={<ArrowRight aria-hidden="true" />}>
              Grand
            </Button>
          </div>
        </Sub>
        <Sub title="États">
          <div className="flex flex-wrap items-center gap-3">
            <Button loading loadingLabel="Envoi en cours…">
              Envoyer
            </Button>
            <Button variant="secondary" loading>
              Enregistrer
            </Button>
            <Button disabled>Désactivé</Button>
            <LinkButton href="/styleguide" variant="secondary">
              Lien en forme de bouton
            </LinkButton>
          </div>
        </Sub>
        <Sub title="Sur fond sombre">
          <div className="on-dark flex flex-wrap items-center gap-3 rounded-card bg-brand p-6">
            <Button variant="donate" iconLeft={<Heart aria-hidden="true" />}>
              Faire un don
            </Button>
            <Button variant="inverse">Contour blanc</Button>
          </div>
        </Sub>
      </Block>

      <Block id="sg-formulaires" title="Champs de formulaire" tone="ivory">
        <div className="grid max-w-3xl gap-6 rounded-card border border-line bg-white p-6 md:grid-cols-2 md:p-8">
          <FormField id="sg-nom" label="Nom complet" required>
            {(field) => <Input name="nom" autoComplete="name" placeholder="Exemple : Prénom Nom" {...field} />}
          </FormField>
          <FormField id="sg-email" label="Adresse email" hint="Exemple d'aide sous le libellé." required>
            {(field) => <Input type="email" name="email" autoComplete="email" {...field} />}
          </FormField>
          <FormField id="sg-tel" label="Téléphone" error="Exemple de message d'erreur : numéro incomplet.">
            {(field) => <Input type="tel" name="tel" defaultValue="+229 01" {...field} />}
          </FormField>
          <FormField id="sg-sujet" label="Sujet">
            {(field) => (
              <Select name="sujet" defaultValue="" {...field}>
                <option value="" disabled>
                  Choisir un sujet
                </option>
                <option value="a">Exemple d&apos;option A</option>
                <option value="b">Exemple d&apos;option B</option>
              </Select>
            )}
          </FormField>
          <FormField id="sg-message" label="Message" className="md:col-span-2">
            {(field) => <Textarea name="message" {...field} />}
          </FormField>
          <Checkbox
            id="sg-consentement"
            name="consentement"
            label="Exemple de case de consentement."
            error="Exemple d'erreur : cette case est obligatoire."
            required
            className="md:col-span-2"
          />
          <div className="md:col-span-2">
            <Input disabled placeholder="Champ désactivé" aria-label="Champ désactivé (exemple)" />
          </div>
        </div>
      </Block>

      <Block id="sg-messages" title="Messages">
        <div className="grid max-w-3xl gap-4">
          <Alert tone="info" title="Information" role="none">
            Exemple de message d&apos;information.
          </Alert>
          <Alert tone="success" title="Succès" role="none">
            Exemple de message de confirmation.
          </Alert>
          <Alert tone="warning" title="Attention" role="none">
            Exemple de message d&apos;avertissement.
          </Alert>
          <Alert tone="error" title="Erreur" role="none">
            Exemple de message d&apos;erreur, sans détail technique.
          </Alert>
        </div>
      </Block>

      <Block id="sg-etats" title="États : vide, chargement, erreur" tone="ivory">
        <div className="grid gap-6 lg:grid-cols-2">
          <EmptyState
            icon={FolderOpen}
            surface="white"
            title="Exemple d'état vide"
            description="Exemple de phrase qui explique honnêtement l'absence de contenu."
            action={
              <LinkButton href="/styleguide" variant="secondary">
                Action éventuelle
              </LinkButton>
            }
          />
          <ErrorState action={<Button variant="secondary">Réessayer</Button>} headingLevel="h3" />
        </div>
        <Sub title="Chargement : cartes">
          <LoadingState variant="cards" count={3} />
        </Sub>
        <div className="grid gap-6 lg:grid-cols-2">
          <Sub title="Chargement : liste">
            <LoadingState variant="list" count={3} />
          </Sub>
          <Sub title="Chargement : texte">
            <LoadingState variant="text" count={5} />
          </Sub>
        </div>
      </Block>

      <Block id="sg-navigation" title="Fil d'Ariane et pagination">
        <Breadcrumbs
          items={[{ label: "Accueil", href: "/" }, { label: "Actualités", href: "/actualites" }, { label: "Exemple d'article" }]}
        />
        <Pagination
          className="mt-8"
          page={3}
          pageCount={8}
          basePath="/styleguide"
          searchParams={{ categorie: "exemple", q: "exemple" }}
        />
      </Block>

      <Block id="sg-cartes" title="Cartes" tone="ivory">
        <Sub title="Domaines (photo provisoire avec mention / tuile-icône sans photo)">
          <ul className="grid gap-3 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
            <li className="flex">
              <DomainCard area={areaWithPhoto} className="w-full" />
            </li>
            <li className="flex">
              <DomainCard area={areaWithoutPhoto} className="w-full" />
            </li>
          </ul>
        </Sub>
        <Sub title="Projets (grande et compacte, avec et sans image)">
          <div className="grid gap-6 lg:grid-cols-12">
            <div className="flex lg:col-span-7">
              <ProjectCard project={project} className="w-full" />
            </div>
            <div className="flex flex-col gap-6 lg:col-span-5">
              <ProjectCard project={project} variant="compact" />
              <ProjectCard project={{ ...project, id: "ex-p2", cover: null, location: null, status: "completed" }} variant="compact" />
            </div>
          </div>
        </Sub>
        <Sub title="Actualités (avec et sans image, horizontale)">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <ArticleCard article={article} />
            <ArticleCard article={{ ...article, id: "ex-a2", cover: null, category: null }} />
            <ArticleCard article={article} variant="horizontal" className="md:col-span-2 lg:col-span-3" />
          </div>
        </Sub>
      </Block>

      <Block id="sg-richtext" title="Contenu riche (RichText) et vidéo">
        <div className="grid gap-12 lg:grid-cols-2">
          <RichText doc={richText} />
          <div>
            <VideoEmbed
              provider="youtube"
              url="https://www.youtube.com/watch?v=aaaaaaaaaaa"
              title="Exemple de vidéo (adresse fictive)"
            />
            <p className="mt-3 text-small text-muted">
              Façade : rien n&apos;est chargé depuis YouTube avant le clic. Adresse d&apos;exemple, la lecture ne fonctionnera pas.
            </p>
          </div>
        </div>
      </Block>

      <Block id="sg-coordonnees" title="Bandeau du haut et coordonnées du pied de page (valeurs d'exemple fictives)">
        <p className="mb-4 text-small text-muted">
          Affichés seulement si l&apos;administration renseigne ces champs. Le bandeau du haut est masqué sous 768 px.
        </p>
        <div className="overflow-hidden rounded-card border border-line">
          <TopBarView
            email="contact@example.org"
            phone="+229 00 00 00 00"
            social={{ facebook: "https://www.facebook.com/example", youtube: "https://www.youtube.com/@example" }}
          />
        </div>
        <div className="on-dark mt-6 max-w-md rounded-card bg-brand p-6 text-small">
          <FooterContacts
            address={"Exemple d'adresse\nExemple de ville"}
            email="contact@example.org"
            phone="+229 00 00 00 00"
            whatsapp="+229 00 00 00 00"
            social={{ facebook: "https://www.facebook.com/example", linkedin: "https://www.linkedin.com/company/example" }}
          />
        </div>
      </Block>

      <Block id="sg-sections" title="En-têtes de section et dialogue" tone="ivory">
        <SectionHeading
          label="Exemple de libellé"
          title="Exemple de titre de section"
          intro="Exemple d'introduction courte, d'une ou deux phrases."
          action={
            <LinkButton href="/styleguide" variant="link" iconRight={<ArrowRight aria-hidden="true" />}>
              Voir tout
            </LinkButton>
          }
        />
        <div className="on-dark rounded-panel bg-brand p-8 md:p-12">
          <SectionHeading inverse align="center" label="Sur fond sombre" title="Exemple de titre centré" flush />
        </div>
        <div className="mt-10">
          <ModalDemo />
        </div>
      </Block>
    </>
  );
}
