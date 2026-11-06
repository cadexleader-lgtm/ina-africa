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

import { ILLUSTRATIONS } from "@/content/illustrations";

export type ProvisionalImage = {
  path: string;
  alt: string;
  width: number;
  height: number;
  /** Une version `-sm.webp` (640 px) existe. */
  hasSmall: boolean;
  provisional: true;
};

/** Photo libre (src/content/illustrations.ts) présentée comme illustration. */
export function illustrationAsProvisional(path: string): ProvisionalImage {
  const found = ILLUSTRATIONS.find((illustration) => illustration.path === path);
  if (!found) throw new Error(`Illustration inconnue : ${path}`);
  return { path: found.path, alt: found.alt, width: found.width, height: found.height, hasSmall: true, provisional: true };
}

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
  eleveEnClasse: {
    path: "/images/provisoires/eleve-en-classe.webp",
    alt: "Une élève en uniforme bleu écrit dans son cahier en classe.",
    width: 817,
    height: 464,
    hasSmall: true,
    provisional: true,
  },
  groupeDeFemmes: {
    path: "/images/provisoires/groupe-de-femmes.webp",
    alt: "Un groupe de femmes réunies en plein air applaudit.",
    width: 1290,
    height: 860,
    hasSmall: true,
    provisional: true,
  },
  enfantsFauteuil: {
    path: "/images/provisoires/enfants-fauteuil.webp",
    alt: "Des enfants accompagnent une camarade en fauteuil roulant devant une école.",
    width: 1147,
    height: 860,
    hasSmall: true,
    provisional: true,
  },
} as const satisfies Record<string, ProvisionalImage>;

/**
 * Illustration provisoire d'un domaine (par adresse du domaine), utilisée
 * seulement si l'administration n'a pas encore choisi de photo.
 */
// Chaque domaine a une illustration tant que l'administration n'a pas choisi
// de photo : photos provisoires, ou photos libres du Bénin (Wikimedia
// Commons, crédits sur /credits-photos). Toujours « Photo d'illustration ».
export const PROVISIONAL_AREA_IMAGES: Partial<Record<string, ProvisionalImage>> = {
  education: PROVISIONAL_IMAGES.eleveEnClasse,
  "sante-sexuelle-et-reproductive": illustrationAsProvisional("/images/illustrations/femmes-cotonou.webp"),
  "autonomisation-des-femmes": PROVISIONAL_IMAGES.atelierCouture,
  "jeunesse-et-adolescents": PROVISIONAL_IMAGES.salleDeClasse,
  "inclusion-et-egalite-de-genre": illustrationAsProvisional("/images/illustrations/egalite-femme-moto.webp"),
  "developpement-local-durable": illustrationAsProvisional("/images/illustrations/alphabetisation.webp"),
  "innovation-sociale": PROVISIONAL_IMAGES.formationTechnique,
};

/**
 * Photos des sections de l'accueil (une photo n'apparaît qu'une fois sur la
 * page). Remplacées par les vraies photos de l'ONG dès qu'elles arrivent.
 */
export const HOME_PHOTOS = {
  hero: PROVISIONAL_IMAGES.groupeDeFemmes,
  /** Photos des diapositives suivantes du hero (clés de HERO_SLIDES). */
  heroSlides: {
    femmes: PROVISIONAL_IMAGES.atelierCouture,
    jeunes: PROVISIONAL_IMAGES.formationTechnique,
    sante: illustrationAsProvisional("/images/illustrations/femmes-cotonou.webp"),
    inclusion: PROVISIONAL_IMAGES.enfantsFauteuil,
  },
  presentation: PROVISIONAL_IMAGES.enfantsFauteuil,
  callToAction: illustrationAsProvisional("/images/illustrations/chemin-ecole.webp"),
} as const;

/** Photo d'illustration en fond de l'en-tête de chaque page intérieure. */
export const PAGE_BACKDROPS = {
  about: illustrationAsProvisional("/images/illustrations/nouvelles-classes.webp"),
  areas: PROVISIONAL_IMAGES.groupeDeFemmes,
  projects: PROVISIONAL_IMAGES.formationTechnique,
  news: illustrationAsProvisional("/images/illustrations/chemin-ecole.webp"),
  contact: PROVISIONAL_IMAGES.eleveEnClasse,
  gallery: illustrationAsProvisional("/images/illustrations/femmes-cotonou.webp"),
  join: illustrationAsProvisional("/images/illustrations/egalite-femme-moto.webp"),
  member: PROVISIONAL_IMAGES.groupeDeFemmes,
  volunteer: PROVISIONAL_IMAGES.atelierCouture,
  partner: illustrationAsProvisional("/images/illustrations/alphabetisation.webp"),
  donate: PROVISIONAL_IMAGES.enfantsFauteuil,
  newsletter: illustrationAsProvisional("/images/illustrations/eleves-lecture.webp"),
} as const;
