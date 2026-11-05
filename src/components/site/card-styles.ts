/**
 * Styles partagés des cartes (domaine, projet, actualité).
 * Toute la carte est cliquable grâce au lien du TITRE étendu (::after) : un
 * seul lien par carte (lecteurs d'écran), et l'anneau de focus entoure la carte.
 */
export const CARD =
  "group relative flex overflow-hidden rounded-card border border-line bg-white " +
  "transition-[box-shadow,border-color] duration-(--duration-base) ease-out hover:border-transparent hover:shadow-card " +
  "has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-(--focus-ring-color)";

/** Lien du titre, étendu à toute la carte. */
export const CARD_LINK =
  "after:absolute after:inset-0 after:content-[''] focus-visible:outline-none " +
  "decoration-gold decoration-2 underline-offset-[6px] group-hover:underline";

/** Zoom très léger de la photo au survol (coupé en mouvement réduit). */
export const CARD_IMAGE = "transition-transform duration-(--duration-base) ease-out motion-safe:group-hover:scale-[1.03]";

/** « Lire la suite → » visuel (le lien accessible est le titre). */
export const CARD_MORE = "mt-auto inline-flex items-center gap-1.5 pt-5 text-small font-semibold text-link";
