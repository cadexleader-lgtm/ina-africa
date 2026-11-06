import { NotFoundPanel } from "@/components/pages/NotFoundPanel";

/** Article inconnu ou non publié (réponse HTTP 404). */
export default function ArticleNotFound() {
  return (
    <NotFoundPanel
      title="Cet article est introuvable"
      text="Il a peut-être été retiré ou son adresse a changé."
      href="/actualites"
      linkLabel="Toutes les actualités"
    />
  );
}
