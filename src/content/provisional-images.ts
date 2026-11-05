/**
 * PHOTOS PROVISOIRES — origine et licence inconnues (voir
 * public/images/provisoires/README.md). À REMPLACER avant la mise en ligne.
 *
 * Règles :
 *  - utilisées SEULEMENT en illustration, quand l'administration n'a pas
 *    encore fourni de photo (accueil, domaines, sections générales) ;
 *  - toujours accompagnées de la mention « Photo d'illustration » ;
 *  - jamais présentées comme une activité, un projet ou un bénéficiaire
 *    d'INA-AFRICA ; jamais dans un projet, un article ou la galerie.
 */

export type ProvisionalImage = {
  path: string;
  alt: string;
  width: number;
  height: number;
  /** Une version `-sm.webp` (640 px) existe. */
  hasSmall: boolean;
  provisional: true;
};

export const PROVISIONAL_LABEL = "Photo d'illustration";

export const PROVISIONAL_IMAGES = {
  formationTechnique: {
    path: "/images/provisoires/formation-technique.webp",
    alt: "Des jeunes apprennent à utiliser une machine dans un atelier technique.",
    width: 1200,
    height: 800,
    hasSmall: true,
    provisional: true,
  },
  atelierCouture: {
    path: "/images/provisoires/atelier-couture.webp",
    alt: "Une femme souriante travaille à sa machine à coudre en plein air.",
    width: 1199,
    height: 1200,
    hasSmall: true,
    provisional: true,
  },
  salleDeClasse: {
    path: "/images/provisoires/salle-de-classe.webp",
    alt: "Des élèves lèvent la main en classe.",
    width: 565,
    height: 377,
    hasSmall: false,
    provisional: true,
  },
} as const satisfies Record<string, ProvisionalImage>;

/**
 * Illustration provisoire d'un domaine (par adresse du domaine), utilisée
 * seulement si l'administration n'a pas encore choisi de photo.
 */
export const PROVISIONAL_AREA_IMAGES: Partial<Record<string, ProvisionalImage>> = {
  education: PROVISIONAL_IMAGES.salleDeClasse,
  "autonomisation-des-femmes": PROVISIONAL_IMAGES.atelierCouture,
  "jeunesse-et-adolescents": PROVISIONAL_IMAGES.formationTechnique,
};
