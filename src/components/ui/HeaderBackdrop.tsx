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
      <div className="absolute inset-0 opacity-[0.14] md:inset-y-0 md:right-0 md:left-auto md:w-[58%] md:opacity-100">
        <ResponsiveImage image={image} fill focus="50% 35%" sizes="(min-width: 768px) 60vw, 100vw" provisionalLabel="none" />
        <div aria-hidden="true" className="absolute inset-0 hidden bg-gradient-to-r from-ivory via-ivory/60 to-ivory/0 md:block" />
        <div aria-hidden="true" className="absolute inset-0 hidden bg-gradient-to-t from-ivory/50 to-transparent md:block" />
      </div>
      {"provisional" in image && image.provisional && (
        <span className="absolute right-3 bottom-3 hidden rounded-full bg-white/90 px-3 py-1 text-small font-medium text-muted shadow-card md:inline-flex">
          Photo d&apos;illustration
        </span>
      )}
    </div>
  );
}
