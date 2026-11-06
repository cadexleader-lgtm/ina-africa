import { Mail, MessageCircle, Phone } from "lucide-react";

import { telHref, whatsappHref } from "@/components/site/social";
import { FORM_TEXT } from "@/content/fr/forms";
import { T } from "@/content/fr/site";
import { cn } from "@/lib/cn";

/** Coordonnées publiques de l'ONG (paramètres du site), transmises aux formulaires. */
export type OrgContacts = {
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
};

export function hasContacts(contacts: OrgContacts): boolean {
  return Boolean(contacts.email || contacts.phone || (contacts.whatsapp && whatsappHref(contacts.whatsapp)));
}

// Bleu foncé : ces liens peuvent être affichés dans un encadré jaune (contraste ≥ 4,5:1).
const LINK = "font-medium text-link-strong underline decoration-1 underline-offset-4 hover:text-brand";

/**
 * Coordonnées RÉELLEMENT renseignées, en liste de liens (utilisable côté
 * serveur et navigateur : aucun état). Rien n'est affiché pour un champ vide.
 */
export function ContactAlternatives({ contacts, className }: { contacts: OrgContacts; className?: string }) {
  const whatsapp = contacts.whatsapp ? whatsappHref(contacts.whatsapp) : null;
  if (!contacts.email && !contacts.phone && !whatsapp) return null;
  const C = FORM_TEXT.contactAlternatives;
  return (
    <ul className={cn("flex flex-col gap-2", className)}>
      {contacts.email && (
        <li className="flex items-center gap-2">
          <Mail aria-hidden="true" className="size-4 shrink-0 text-brand" />
          <span className="sr-only">{C.email} :</span>
          <a href={`mailto:${contacts.email}`} className={LINK}>
            {contacts.email}
          </a>
        </li>
      )}
      {contacts.phone && (
        <li className="flex items-center gap-2">
          <Phone aria-hidden="true" className="size-4 shrink-0 text-brand" />
          <span className="sr-only">{C.phone} :</span>
          <a href={telHref(contacts.phone)} className={LINK}>
            {contacts.phone}
          </a>
        </li>
      )}
      {whatsapp && (
        <li className="flex items-center gap-2">
          <MessageCircle aria-hidden="true" className="size-4 shrink-0 text-brand" />
          <a href={whatsapp} target="_blank" rel="noopener noreferrer" className={LINK}>
            {C.whatsapp} : {contacts.whatsapp}
            <span className="sr-only"> {T.a11y.newTab}</span>
          </a>
        </li>
      )}
    </ul>
  );
}
