import { Mail, Phone } from "lucide-react";

import { T } from "@/content/fr/site";
import { getSiteSettings } from "@/server/data/site";
import { socialLinks, telHref } from "@/components/site/social";

type TopBarViewProps = {
  email: string | null;
  phone: string | null;
  /** Réseaux renseignés (clé → adresse https). */
  social: Record<string, string>;
};

/** Présentation du bandeau du haut (sans lecture de données). Ne rend rien si tout est vide. */
export function TopBarView({ email, phone, social }: TopBarViewProps) {
  const socials = socialLinks(social);
  if (!email && !phone && socials.length === 0) return null;

  return (
    <div className="on-dark hidden bg-brand text-small md:block">
      <div className="mx-auto box-content flex h-10 max-w-site items-center justify-between gap-6 px-gutter">
        <ul aria-label={T.topBar.label} className="flex items-center gap-6">
          {email && (
            <li>
              <a href={`mailto:${email}`} className="inline-flex items-center gap-2 hover:underline">
                <Mail aria-hidden="true" className="size-4 text-brand-2-light" />
                <span className="sr-only">{T.topBar.email} : </span>
                {email}
              </a>
            </li>
          )}
          {phone && (
            <li>
              <a href={telHref(phone)} className="inline-flex items-center gap-2 hover:underline">
                <Phone aria-hidden="true" className="size-4 text-brand-2-light" />
                <span className="sr-only">{T.topBar.phone} : </span>
                {phone}
              </a>
            </li>
          )}
        </ul>
        {socials.length > 0 && (
          <ul className="flex items-center gap-5">
            {socials.map((item) => (
              <li key={item.key}>
                <a href={item.href} target="_blank" rel="noopener noreferrer" className="hover:underline">
                  {item.label}
                  <span className="sr-only"> {T.a11y.newTab}</span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/**
 * Bandeau du haut (écrans ≥ 768 px) : email, téléphone et réseaux renseignés
 * dans l'administration. Rien n'est affiché si rien n'est renseigné.
 */
export async function TopBar() {
  const settings = await getSiteSettings();
  return <TopBarView email={settings.contactEmail} phone={settings.contactPhone} social={settings.socialLinks} />;
}
