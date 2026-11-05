import { Link2, Share2 } from "lucide-react";

import { LinkButton } from "@/components/ui/Button";
import { CopyLinkButton } from "@/components/site/CopyLinkButton";

/**
 * Boutons de partage d'une page (appel aux dons, article…).
 * Simples liens vers les pages de partage officielles : aucun script tiers
 * chargé, aucun traceur. Le lien partagé est l'adresse de la page ; l'aperçu
 * (photo, titre) vient des métadonnées Open Graph de la page.
 */
export function ShareLinks({
  url,
  message,
  label = "Partager",
}: {
  /** Adresse ABSOLUE de la page (https://…). */
  url: string;
  /** Texte d'accompagnement (ex. message de partage de l'appel aux dons). */
  message?: string | null;
  label?: string;
}) {
  const text = message ? `${message} ${url}` : url;
  const links = [
    { name: "WhatsApp", href: `https://wa.me/?text=${encodeURIComponent(text)}` },
    { name: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` },
    { name: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}` },
  ];

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="inline-flex items-center gap-2 text-small font-semibold text-brand">
        <Share2 aria-hidden="true" className="size-4" />
        {label}
      </span>
      {links.map((link) => (
        <LinkButton key={link.name} href={link.href} external variant="secondary" size="sm">
          {link.name}
        </LinkButton>
      ))}
      <CopyLinkButton url={url} icon={<Link2 aria-hidden="true" className="size-4" />} />
    </div>
  );
}
