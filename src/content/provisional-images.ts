/**
 * PHOTOS PROVISOIRES — origine et licence inconnues (voir
 * public/images/provisoires/README.md). À REMPLACER avant la mise en ligne.
 *
 * Règles :
 *  - utilisées SEULEMENT en illustration, quand l'administration n'a pas
 *    encore fourni de photo (accueil, domaines, sections générales) ;
 *  - toujours accompagnées de la mention « Photo d'illustration » ;
 *  - jamais présentées comme une activité, un projet ou un bénéficiaire
 *    de INA-AFRICA ; jamais dans un projet, un article ou la galerie.
 */

import { REAL_PHOTOS } from "@/content/action-photos";
import type { ImageRef } from "@/lib/types/content";

import { ILLUSTRATIONS } from "@/content/illustrations";

/** Image d'un emplacement du site : vraie photo de l'ONG ou illustration provisoire. */
export type SiteImage = ImageRef | ProvisionalImage;

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
/**
 * Photo d'un domaine quand l'administration n'en a pas mis : une VRAIE photo
 * d'action de l'ONG si elle existe (src/content/action-photos.ts), sinon une
 * illustration provisoire (mention « Photo d'illustration »).
 */
export const PROVISIONAL_AREA_IMAGES: Partial<Record<string, SiteImage>> = {
  // Vraies photos de l'ONG (actions réelles) ; pas de photo pour l'environnement et le climat.
  formation: REAL_PHOTOS.launchSpeech,
  intermediation: REAL_PHOTOS.kitsExchange,
  "autonomisation-economique-des-femmes": REAL_PHOTOS.launchWomen,
  "insertion-socio-professionnelle": REAL_PHOTOS.launchThumbsUp,
  "lutte-contre-le-travail-des-enfants": REAL_PHOTOS.kitsGroup,
  // Photos libres (Wikimedia Commons), mention « Photo d'illustration » automatique.
  "sauvegarde-de-l-environnement": illustrationAsProvisional("/images/illustrations/reboisement-natitingou.webp"),
  "lutte-contre-le-rechauffement-climatique": illustrationAsProvisional("/images/illustrations/inondation-cotonou.webp"),
}

/** Deux photos libres en plus par domaine (cartes de la page Domaines), tant que l'admin n'en a pas choisi. */
const ill = (name: string) => illustrationAsProvisional(`/images/illustrations/${name}.webp`);
export const PROVISIONAL_AREA_GALLERY: Partial<Record<string, SiteImage[]>> = {
  formation: [ill("apprenti-technicien"), ill("couturiere-benin")],
  intermediation: [ill("femmes-gastronomie"), ill("ecolieres-jeux")],
  "autonomisation-economique-des-femmes": [ill("femmes-gastronomie"), ill("couturiere-benin")],
  "insertion-socio-professionnelle": [ill("sport-handicap"), ill("apprenti-technicien")],
  "lutte-contre-le-travail-des-enfants": [ill("ecolieres-jeux"), ill("fille-velo")],
};

/**
 * Photos des sections de l'accueil (une photo n'apparaît qu'une fois sur la
 * page). Remplacées par les vraies photos de l'ONG dès qu'elles arrivent.
 */
export const HOME_PHOTOS: {
  hero: SiteImage;
  heroSlides: Record<"femmes" | "jeunes" | "sante" | "inclusion", SiteImage>;
  presentation: SiteImage;
  callToAction: SiteImage;
  /** Grand fond du haut de l'accueil : photos d'illustration HD qui défilent (8). */
  heroGallery: SiteImage[];
} = {
  // Haut de l'accueil : photos verticales ou de grande taille (le cadre est presque vertical sur ordinateur).
  hero: REAL_PHOTOS.womenDayGroup,
  /** Photos des diapositives suivantes du hero (clés de HERO_SLIDES). */
  heroSlides: {
    femmes: REAL_PHOTOS.womenDayPortrait,
    jeunes: illustrationAsProvisional("/images/illustrations/apprenti-technicien.webp"),
    sante: REAL_PHOTOS.womenDaySpeaker,
    inclusion: illustrationAsProvisional("/images/illustrations/sport-handicap.webp"),
  },
  presentation: PROVISIONAL_IMAGES.enfantsFauteuil,
  callToAction: REAL_PHOTOS.kitsHandOver,
  heroGallery: [
    "ecolieres-jeux",
    "femmes-cuisine",
    "apprenti-technicien",
    "fille-velo",
    "femmes-gastronomie",
    "reboisement-natitingou",
  ].map((name) => illustrationAsProvisional(`/images/illustrations/${name}.webp`)),
};

/**
 * Photo en fond de l'en-tête de chaque page intérieure : une vraie photo de
 * l'ONG quand il y en a une qui correspond, sinon une illustration provisoire.
 */
export const PAGE_BACKDROPS: Record<
  | "about"
  | "areas"
  | "projects"
  | "news"
  | "contact"
  | "gallery"
  | "join"
  | "member"
  | "volunteer"
  | "partner"
  | "donate"
  | "needs"
  | "newsletter",
  SiteImage
> = {
  about: REAL_PHOTOS.launchTeam,
  areas: REAL_PHOTOS.launchGroup,
  projects: REAL_PHOTOS.kitsSchoolFront,
  news: REAL_PHOTOS.kitsExchange,
  contact: REAL_PHOTOS.clothingTeam,
  gallery: REAL_PHOTOS.kitsOtherSchool,
  join: REAL_PHOTOS.kitsTeam,
  member: REAL_PHOTOS.launchThumbsUp,
  volunteer: REAL_PHOTOS.kitsVolunteers,
  partner: illustrationAsProvisional("/images/illustrations/alphabetisation.webp"),
  donate: REAL_PHOTOS.kitsGirlBackpack,
  needs: REAL_PHOTOS.kitsGirlClass,
  newsletter: illustrationAsProvisional("/images/illustrations/eleves-lecture.webp"),
};
