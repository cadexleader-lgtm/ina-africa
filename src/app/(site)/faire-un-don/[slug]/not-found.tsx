import { NotFoundPanel } from "@/components/pages/NotFoundPanel";

/** Appel aux dons inconnu ou inactif (réponse HTTP 404). */
export default function CampaignNotFound() {
  return (
    <NotFoundPanel
      title="Cet appel aux dons est introuvable"
      text="Il est peut-être terminé. Vous pouvez toujours soutenir INA-AFRICA."
      href="/faire-un-don"
      linkLabel="Faire un don"
    />
  );
}
