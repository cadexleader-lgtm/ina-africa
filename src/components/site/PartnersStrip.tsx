import { ResponsiveImage } from "@/components/ui/ResponsiveImage";
import { T } from "@/content/fr/site";
import type { Partner } from "@/lib/types/content";

/**
 * Logos des partenaires et soutiens ACTIVÉS dans l'administration.
 * À n'afficher que si la liste n'est pas vide (le composant ne rend rien sinon).
 */
export function PartnersStrip({ partners }: { partners: Partner[] }) {
  if (partners.length === 0) return null;
  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {partners.map((partner) => {
        const content = partner.logo ? (
          <ResponsiveImage
            image={{ path: partner.logo.path, alt: partner.logo.alt || `Logo de ${partner.name}` }}
            aspect="3/2"
            fit="contain"
            sizes="(min-width: 1024px) 200px, 45vw"
            className="bg-white"
          />
        ) : (
          <span className="flex aspect-[3/2] items-center justify-center px-4 text-center font-heading text-h4 text-brand">
            {partner.name}
          </span>
        );
        return (
          <li key={partner.id} className="rounded-card border border-line bg-white p-4">
            {partner.websiteUrl ? (
              <a href={partner.websiteUrl} target="_blank" rel="noopener noreferrer" className="block rounded-field">
                {content}
                <span className="sr-only"> {T.a11y.newTab}</span>
              </a>
            ) : (
              content
            )}
          </li>
        );
      })}
    </ul>
  );
}
