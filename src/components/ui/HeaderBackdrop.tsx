import { ResponsiveImage, type ImageSource } from "@/components/ui/ResponsiveImage";

/**
 * Photo d'illustration en fond d'un en-tête de page : nette à droite, qui se
 * fond dans l'ivoire vers le texte (le texte reste sur un fond uni, contraste
 * inchangé). Sur téléphone : très légère, derrière tout l'en-tête.
 * Décorative : le contenu de la page ne dépend pas de l'image.
 */
export function HeaderBackdrop({ image }: { image: ImageSource }) {
  return (
    <div className="absolute inset-0 -z-10">
      <div className="absolute inset-0 overflow-hidden opacity-25 md:inset-y-0 md:right-0 md:left-auto md:w-[58%] md:opacity-100">
        {/* Léger zoom lent (désactivé si l'utilisateur réduit les animations). */}
        <div className="absolute inset-0 motion-safe:animate-[backdrop-zoom_18s_ease-out_both]">
          <ResponsiveImage image={image} fill focus="50% 35%" sizes="(min-width: 768px) 60vw, 100vw" provisionalLabel="none" />
        </div>
        {/* Fondu court seulement sur le bord gauche, pour raccorder au texte : la photo reste nette. */}
        <div aria-hidden="true" className="absolute inset-y-0 left-0 hidden w-2/5 bg-gradient-to-r from-ivory via-ivory/70 to-ivory/0 md:block" />
      </div>
      {"provisional" in image && image.provisional && (
        <span className="absolute right-3 bottom-3 hidden rounded-full bg-white/90 px-3 py-1 text-small font-medium text-muted shadow-card md:inline-flex">
          Photo d&apos;illustration
        </span>
      )}
    </div>
  );
}
