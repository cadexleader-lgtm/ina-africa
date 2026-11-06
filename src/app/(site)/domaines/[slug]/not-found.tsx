import { NotFoundPanel } from "@/components/pages/NotFoundPanel";
import { PAGES } from "@/content/fr/pages";

/** Domaine inconnu ou non publié (réponse HTTP 404). */
export default function AreaNotFound() {
  return (
    <NotFoundPanel
      title={PAGES.area.notFoundTitle}
      text={PAGES.area.notFoundText}
      href="/domaines"
      linkLabel={PAGES.area.back}
    />
  );
}
