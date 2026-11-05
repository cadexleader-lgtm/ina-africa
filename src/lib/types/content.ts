/**
 * Types des contenus PUBLICS lus par le site (voir supabase/migrations).
 * Ils ne contiennent que les colonnes lues par les pages publiques : aucune
 * donnée personnelle ni interne (auteur, remarque de relecture…).
 * À remplacer par les types générés par Supabase dès que le projet existe.
 */
import type { RichTextDoc } from "@/lib/validation/rich-text";

export type ImageRef = {
  /** Chemin dans le stockage `public-media`, ou chemin local `/images/...` (photo provisoire). */
  path: string;
  alt: string;
};

export type SiteSettings = {
  aboutHistory: string | null;
  vision: string | null;
  /** Une ligne = une mission. */
  mission: string | null;
  /** Une ligne = un objectif. */
  objectives: string | null;
  /** Valeurs : vides tant que l'ONG ne les a pas validées. */
  valuesText: string | null;
  /** Une ligne = un moyen d'action. */
  approach: string | null;
  heroKicker: string | null;
  heroTitle: string | null;
  heroText: string | null;
  heroImage: ImageRef | null;
  impactTitle: string | null;
  impactText: string | null;
  impactImage: ImageRef | null;
  contactEmail: string | null;
  contactPhone: string | null;
  whatsappNumber: string | null;
  address: string | null;
  /** Ex. { facebook: "https://…", youtube: "https://…" } — seulement les réseaux renseignés. */
  socialLinks: Record<string, string>;
  donationMinAmount: number | null;
  donationSuggestedAmounts: number[];
  offlineDonationInstructions: OfflineDonationInstruction[];
  legalNotice: RichTextDoc | null;
  privacyPolicy: RichTextDoc | null;
};

export type OfflineDonationInstruction = {
  method: "mobile_money" | "bank_transfer";
  label: string;
  holder?: string;
  number?: string;
  note?: string;
};

export type ActionArea = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  description: string | null;
  image: ImageRef | null;
  displayOrder: number;
};

export type ProjectStatus = "planned" | "ongoing" | "completed" | "archived";

export type ProjectSummary = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  location: string | null;
  startDate: string | null;
  endDate: string | null;
  status: ProjectStatus;
  isFeatured: boolean;
  publishedAt: string | null;
  cover: ImageRef | null;
  /** Domaine du projet, s'il est rattaché à un domaine ACTIF. */
  area: { slug: string; title: string } | null;
};

export type Project = ProjectSummary & {
  content: RichTextDoc;
  seoTitle: string | null;
  seoDescription: string | null;
  photos: GalleryItem[];
};

export type ArticleCategory = { id: string; slug: string; name: string; description: string | null };

export type ArticleSummary = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  publishedAt: string;
  cover: ImageRef | null;
  category: { slug: string; name: string } | null;
};

export type Article = ArticleSummary & {
  content: RichTextDoc;
  /** Texte brut (temps de lecture, description par défaut). */
  contentText: string;
  seoTitle: string | null;
  seoDescription: string | null;
  updatedAt: string;
};

export type GalleryItem =
  | { id: string; type: "photo"; image: ImageRef; caption: string | null; takenOn: string | null }
  | {
      id: string;
      type: "video";
      provider: "youtube" | "facebook";
      url: string;
      poster: ImageRef | null;
      caption: string | null;
      takenOn: string | null;
    };

export type TeamMember = {
  id: string;
  fullName: string;
  position: string;
  bio: string | null;
  photo: ImageRef | null;
};

export type Partner = {
  id: string;
  name: string;
  kind: "partner" | "sponsor";
  description: string | null;
  logo: ImageRef | null;
  websiteUrl: string | null;
};

export type DonationCampaign = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  content: RichTextDoc;
  cover: ImageRef | null;
  goalAmount: number | null;
  startsOn: string | null;
  endsOn: string | null;
  showProgress: boolean;
  shareMessage: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
};

export type CampaignProgress = {
  onlineAmount: number;
  offlineAmount: number;
  totalAmount: number;
  goalAmount: number | null;
  donationsCount: number;
};

export type Paginated<T> = { items: T[]; total: number; page: number; pageCount: number; pageSize: number };
