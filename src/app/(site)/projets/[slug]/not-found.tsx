import { NotFoundPanel } from "@/components/pages/NotFoundPanel";
import { PAGES } from "@/content/fr/pages";

/** Projet inconnu ou non publié (réponse HTTP 404). */
export default function ProjectNotFound() {
  return (
    <NotFoundPanel
      title={PAGES.project.notFoundTitle}
      text={PAGES.project.notFoundText}
      href="/projets"
      linkLabel={PAGES.project.back}
    />
  );
}
