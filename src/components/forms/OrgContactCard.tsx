import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";

import { LinkButton } from "@/components/ui/Button";
import { AsideCard } from "@/components/forms/PageParts";
import { socialLinks, telHref, whatsappHref } from "@/components/site/social";
import { FORM_TEXT } from "@/content/fr/forms";
import { T } from "@/content/fr/site";
import type { SiteSettings } from "@/lib/types/content";

const LINK = "font-medium text-link underline decoration-1 underline-offset-4 hover:text-link-strong";

/**
 * Coordonnées de l'ONG RÉELLEMENT renseignées dans l'administration
 * (adresse, email, téléphone, WhatsApp, réseaux). Rien n'est inventé : sans
 * coordonnées, une phrase neutre l'indique.
 */
export function OrgContactCard({ settings }: { settings: SiteSettings }) {
  const C = FORM_TEXT.contact;
  const whatsapp = settings.whatsappNumber ? whatsappHref(settings.whatsappNumber) : null;
  const socials = socialLinks(settings.socialLinks);
  const hasAny = Boolean(settings.address || settings.contactEmail || settings.contactPhone || whatsapp || socials.length);

  return (
    <AsideCard title={C.detailsTitle}>
      {!hasAny && <p className="text-muted">{C.detailsEmpty}</p>}
      {hasAny && (
        <div className="flex flex-col gap-6">
          <ul className="flex flex-col gap-4">
            {settings.address && (
              <li className="flex gap-3">
                <MapPin aria-hidden="true" className="mt-1 size-5 shrink-0 text-brand-2" />
                <span className="whitespace-pre-line text-ink">{settings.address}</span>
              </li>
            )}
            {settings.contactEmail && (
              <li className="flex gap-3">
                <Mail aria-hidden="true" className="mt-1 size-5 shrink-0 text-brand-2" />
                <a href={`mailto:${settings.contactEmail}`} className={`${LINK} break-all`}>
                  {settings.contactEmail}
                </a>
              </li>
            )}
            {settings.contactPhone && (
              <li className="flex gap-3">
                <Phone aria-hidden="true" className="mt-1 size-5 shrink-0 text-brand-2" />
                <a href={telHref(settings.contactPhone)} className={LINK}>
                  {settings.contactPhone}
                </a>
              </li>
            )}
          </ul>

          {whatsapp && (
            <LinkButton href={whatsapp} external variant="secondary" iconLeft={<MessageCircle aria-hidden="true" />}>
              {C.whatsappAction}
            </LinkButton>
          )}

          {socials.length > 0 && (
            <div>
              <h3 className="mb-3 text-small font-semibold text-brand">{T.footer.socialTitle}</h3>
              <ul className="flex flex-wrap gap-x-5 gap-y-2">
                {socials.map((item) => (
                  <li key={item.key}>
                    <a href={item.href} target="_blank" rel="noopener noreferrer" className={LINK}>
                      {item.label}
                      <span className="sr-only"> {T.a11y.newTab}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </AsideCard>
  );
}
