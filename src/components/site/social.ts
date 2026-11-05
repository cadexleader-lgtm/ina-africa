import { SOCIAL_LABELS } from "@/content/fr/site";

export type SocialLink = { key: string; label: string; href: string };

/** Réseaux RÉELLEMENT renseignés (adresses https déjà filtrées par getSiteSettings), dans un ordre stable. */
export function socialLinks(links: Record<string, string>): SocialLink[] {
  const order = Object.keys(SOCIAL_LABELS);
  return Object.entries(links)
    .filter(([, href]) => /^https:\/\//.test(href))
    .map(([key, href]) => ({
      key,
      href,
      label: SOCIAL_LABELS[key.toLowerCase()] ?? key.charAt(0).toUpperCase() + key.slice(1),
    }))
    .sort((a, b) => {
      const ia = order.indexOf(a.key.toLowerCase());
      const ib = order.indexOf(b.key.toLowerCase());
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });
}

/** Lien tel: (espaces et ponctuation retirés, + conservé). */
export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

/** Lien WhatsApp officiel (wa.me) à partir d'un numéro international. */
export function whatsappHref(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 8 ? `https://wa.me/${digits}` : null;
}
