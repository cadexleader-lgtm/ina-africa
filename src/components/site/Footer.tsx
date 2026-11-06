import Link from "next/link";
import type { ReactNode } from "react";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";

import { CopyrightYear } from "@/components/site/CopyrightYear";
import { Logo } from "@/components/site/Logo";
import { socialLinks, telHref, whatsappHref } from "@/components/site/social";
import { FOOTER_NAV, JOIN_NAV, LEGAL_NAV, ORG, T } from "@/content/fr/site";
import { getSiteSettings, listActionAreas } from "@/server/data/site";

type FooterProps = {
  /**
   * EMPLACEMENT NEWSLETTER (agent C) : passer ici le bloc d'inscription
   * (titre + formulaire) depuis src/app/(site)/layout.tsx, ex.
   * <Footer newsletter={<NewsletterSignup />} />. Il s'affiche en bandeau en
   * haut du pied de page (fond bleu foncé : utiliser les variantes « inverse »).
   * Vide = rien n'est affiché.
   */
  newsletter?: ReactNode;
};

const LINK = "text-white/90 underline-offset-4 transition-colors duration-(--duration-fast) hover:text-white hover:underline";

function Column({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h2 className="mb-5 text-h4">{title}</h2>
      {children}
    </div>
  );
}

type FooterContactsProps = {
  address: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  social: Record<string, string>;
};

/** Coordonnées et réseaux RÉELLEMENT renseignés (rien n'est affiché pour un champ vide). */
export function FooterContacts({ address, email, phone, whatsapp, social }: FooterContactsProps) {
  const socials = socialLinks(social);
  const whatsappLink = whatsapp ? whatsappHref(whatsapp) : null;
  const hasContact = Boolean(address || email || phone || whatsappLink);
  if (!hasContact && socials.length === 0) return null;

  return (
    <>
      {hasContact && (
        <>
          <h2 className="sr-only">{T.footer.contactTitle}</h2>
          <ul className="mt-8 flex flex-col gap-3">
            {address && (
              <li className="flex gap-3 text-white/90">
                <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-brand-2-light" />
                <span className="whitespace-pre-line">{address}</span>
              </li>
            )}
            {email && (
              <li className="flex gap-3">
                <Mail aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-brand-2-light" />
                <a href={`mailto:${email}`} className={LINK}>
                  {email}
                </a>
              </li>
            )}
            {phone && (
              <li className="flex gap-3">
                <Phone aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-brand-2-light" />
                <a href={telHref(phone)} className={LINK}>
                  {phone}
                </a>
              </li>
            )}
            {whatsappLink && (
              <li className="flex gap-3">
                <MessageCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-brand-2-light" />
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className={LINK}>
                  {T.footer.whatsapp} : {whatsapp}
                  <span className="sr-only"> {T.a11y.newTab}</span>
                </a>
              </li>
            )}
          </ul>
        </>
      )}
      {socials.length > 0 && (
        <>
          <h2 className="mt-8 mb-4 text-small font-semibold text-white">{T.footer.socialTitle}</h2>
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
        </>
      )}
    </>
  );
}

/** Pied de page : présentation, navigation, domaines actifs, coordonnées et réseaux renseignés, liens légaux. */
export async function Footer({ newsletter }: FooterProps) {
  const [settings, areas] = await Promise.all([getSiteSettings(), listActionAreas()]);

  return (
    <footer className="on-dark bg-brand bg-motif-brand text-small">
      <div className="mx-auto box-content max-w-site px-gutter pt-16 pb-10 md:pt-20">
        {newsletter && <div className="mb-14 border-b border-white/15 pb-12">{newsletter}</div>}

        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-12 lg:gap-10">
          <div className="sm:col-span-2 lg:col-span-4">
            <Logo inverse size="lg" />
            {settings.heroText && <p className="mt-6 max-w-sm text-body text-muted-inverse">{settings.heroText}</p>}

            {!settings.address && !settings.contactEmail && !settings.contactPhone && !settings.whatsappNumber && (
              <p className="mt-6">
                <Link href="/contact" className={LINK}>
                  Écrire à INA-AFRICA
                </Link>
                <span className="text-muted-inverse"> par le formulaire de contact.</span>
              </p>
            )}
            <FooterContacts
              address={settings.address}
              email={settings.contactEmail}
              phone={settings.contactPhone}
              whatsapp={settings.whatsappNumber}
              social={settings.socialLinks}
            />
          </div>

          <nav aria-label={T.a11y.footerNav} className="grid grid-cols-2 gap-8 sm:col-span-2 lg:col-span-4 lg:gap-10">
            <Column title={T.footer.navTitle}>
              <ul className="flex flex-col gap-3">
                {FOOTER_NAV.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className={LINK}>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </Column>
            <Column title={T.footer.joinTitle}>
              <ul className="flex flex-col gap-3">
                {JOIN_NAV.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className={LINK}>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </Column>
          </nav>

          {areas.length > 0 && (
            <div className="sm:col-span-2 lg:col-span-4">
              <Column title={T.footer.areasTitle}>
                <ul className="flex flex-col gap-3">
                  {areas.map((area) => (
                    <li key={area.id}>
                      <Link href={`/domaines/${area.slug}`} className={LINK}>
                        {area.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </Column>
            </div>
          )}
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-white/15 pt-8 md:flex-row md:items-center md:justify-between">
          <p className="text-muted-inverse">
            © <CopyrightYear /> {ORG.name}. {T.footer.rights}
          </p>
          <nav aria-label={T.a11y.legalNav}>
            <ul className="flex flex-wrap gap-x-6 gap-y-2">
              {LEGAL_NAV.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={LINK}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}
