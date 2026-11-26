import { ResponsiveImage, type ImageSource } from "@/components/ui/ResponsiveImage";

/**
 * Photo d'illustration en fond d'un en-tête de page : nette à droite, qui se
 * fond dans l'ivoire vers le texte (le texte reste sur un fond uni, contraste
 * inchangé). Sur téléphone : en bandeau net au-dessus du titre.
 * Décorative : le contenu de la page ne dépend pas de l'image.
 */
export function HeaderBackdrop({ image }: { image: ImageSource }) {
  const provisional = "provisional" in image && image.provisional;
  return (
    <>
      {/* Téléphone : la photo, nette, en bandeau au-dessus du titre (jamais pâlie derrière le texte). */}
      <div className="relative aspect-[16/10] w-full overflow-hidden md:hidden">
        <div className="absolute inset-0 motion-safe:animate-[backdrop-zoom_18s_ease-out_both]">
          <ResponsiveImage image={image} fill focus="50% 40%" sizes="100vw" provisionalLabel="none" />
        </div>
        {provisional && (
          <span className="absolute right-3 bottom-3 inline-flex rounded-full bg-white/90 px-3 py-1 text-small font-medium text-muted shadow-card">
            Photo d&apos;illustration
          </span>
        )}
      </div>
      {/* Ordinateur : la photo à droite, en fond, nette (léger fondu sur le bord gauche seulement). */}
      <div className="absolute inset-0 -z-10 hidden md:block">
        <div className="absolute inset-y-0 right-0 w-[58%] overflow-hidden">
          <div className="absolute inset-0 motion-safe:animate-[backdrop-zoom_18s_ease-out_both]">
            <ResponsiveImage image={image} fill focus="50% 35%" sizes="60vw" provisionalLabel="none" />
          </div>
          <div aria-hidden="true" className="absolute inset-y-0 left-0 w-2/5 bg-gradient-to-r from-ivory via-ivory/70 to-ivory/0" />
        </div>
        {provisional && (
          <span className="absolute right-3 bottom-3 inline-flex rounded-full bg-white/90 px-3 py-1 text-small font-medium text-muted shadow-card">
            Photo d&apos;illustration
          </span>
        )}
      </div>
    </>
  );
}
