import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProjectDetail } from "@/components/pages/projects/ProjectDetail";
import { excerpt } from "@/components/pages/page-helpers";
import { ORG } from "@/content/fr/site";
import { mediaUrl } from "@/lib/media";
import { getProject, listProjectSlugs, listProjectsByArea } from "@/server/data/projects";

/**
 * Adresse prérendue quand aucun projet n'est publié : avec Cache Components,
 * generateStaticParams doit renvoyer au moins une valeur. Elle mène à une 404.
 */
const PLACEHOLDER_SLUG = "__aucun-projet__";

/**
 * Page entièrement statique (toutes les lectures sont en cache), y compris
 * pour une adresse publiée après le build : la première requête attend la page
 * complète au lieu de recevoir l'App Shell en flux. C'est ce qui permet à une
 * adresse inconnue de renvoyer un VRAI statut HTTP 404 (`instant = false` seul
 * ne suffit pas ici : l'App Shell du layout partirait avec un statut 200).
 */
export const ensureStatic = "navigation";
export const instant = false;

export async function generateStaticParams() {
  const slugs = await listProjectSlugs();
  return slugs.length > 0 ? slugs.map(({ slug }) => ({ slug })) : [{ slug: PLACEHOLDER_SLUG }];
}

export async function generateMetadata({ params }: PageProps<"/projets/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) return {};
  const title = project.seoTitle?.trim() || project.title;
  const description =
    excerpt(project.seoDescription) ?? excerpt(project.summary) ?? excerpt(`${project.title} : projet de l'ONG ${ORG.name}.`);
  const url = `/projets/${project.slug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      locale: "fr_FR",
      siteName: ORG.name,
      title: `${title} — ${ORG.name}`,
      description: description ?? undefined,
      url,
      publishedTime: project.publishedAt ?? undefined,
      // Uniquement la vraie photo de couverture du projet.
      images: project.cover ? [{ url: mediaUrl(project.cover.path), alt: project.cover.alt }] : undefined,
    },
  };
}

/**
 * Détail d'un projet publié : couverture, domaine, lieu, dates, état, contenu
 * riche, galerie (photos et vidéos) avec visionneuse, autres projets du
 * domaine, appel au don sobre. Adresse inconnue ou projet non publié → 404
 * (les lectures publiques ne renvoient que le publié).
 */
export default async function ProjectPage({ params }: PageProps<"/projets/[slug]">) {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) notFound();

  const related = project.area ? await listProjectsByArea(project.area.slug, 4) : [];
  const others = related.filter((item) => item.slug !== project.slug).slice(0, 3);
  return <ProjectDetail project={project} others={others} />;
}
