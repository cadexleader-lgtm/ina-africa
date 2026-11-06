/**
 * Types des lectures de l'ADMINISTRATION (src/server/data/admin/*).
 * Les champs modifiables portent les MÊMES noms que les schémas de saisie
 * (src/lib/validation/admin/*) : un formulaire d'édition se pré-remplit
 * directement avec l'objet lu.
 */
import type { RichTextDoc } from "@/lib/validation/rich-text";

export type { Paginated } from "@/lib/types/content";

export type ArticleStatus = "draft" | "in_review" | "published" | "archived";

export type AdminArticleListItem = {
  id: string;
  title: string;
  slug: string;
  status: ArticleStatus;
  category: { id: string; name: string } | null;
  author: { id: string; fullName: string } | null;
  submittedAt: string | null;
  publishedAt: string | null;
  updatedAt: string;
};

export type AdminArticle = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: RichTextDoc;
  coverImagePath: string | null;
  coverImageAlt: string | null;
  categoryId: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  status: ArticleStatus;
  authorId: string | null;
  authorName: string | null;
  reviewNote: string | null;
  submittedAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  displayOrder: number;
};

export type ProjectStatus = "planned" | "ongoing" | "completed" | "archived";

export type AdminProjectListItem = {
  id: string;
  title: string;
  slug: string;
  status: ProjectStatus;
  isPublished: boolean;
  isFeatured: boolean;
  publishedAt: string | null;
  updatedAt: string;
};

export type AdminProject = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  content: RichTextDoc;
  location: string | null;
  startDate: string | null;
  endDate: string | null;
  status: ProjectStatus;
  actionAreaId: string | null;
  isFeatured: boolean;
  coverImagePath: string | null;
  coverImageAlt: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  isPublished: boolean;
  publishedAt: string | null;
  updatedAt: string;
};

export type AdminActionArea = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  description: string | null;
  imagePath: string | null;
  imageAlt: string | null;
  displayOrder: number;
  isActive: boolean;
};

export type AdminPartner = {
  id: string;
  name: string;
  kind: "partner" | "sponsor";
  description: string | null;
  logoPath: string | null;
  websiteUrl: string | null;
  displayOrder: number;
  isActive: boolean;
};

export type AdminTeamMember = {
  id: string;
  fullName: string;
  position: string;
  bio: string | null;
  photoPath: string | null;
  displayOrder: number;
  isActive: boolean;
};

export type AdminGalleryItem = {
  id: string;
  itemType: "photo" | "video";
  imagePath: string | null;
  imageAlt: string | null;
  videoProvider: "youtube" | "facebook" | null;
  videoUrl: string | null;
  caption: string | null;
  takenOn: string | null;
  projectId: string | null;
  displayOrder: number;
  isPublished: boolean;
};

export type AdminOfflineInstruction = {
  method: "mobile_money" | "bank_transfer";
  label: string;
  holder?: string;
  number?: string;
  note?: string;
};

export type AdminSiteSettings = {
  aboutHistory: string | null;
  vision: string | null;
  mission: string | null;
  objectives: string | null;
  valuesText: string | null;
  approach: string | null;
  heroKicker: string | null;
  heroTitle: string | null;
  heroText: string | null;
  heroImagePath: string | null;
  heroImageAlt: string | null;
  impactTitle: string | null;
  impactText: string | null;
  impactImagePath: string | null;
  impactImageAlt: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  whatsappNumber: string | null;
  address: string | null;
  socialLinks: Record<string, string>;
  donationMinAmount: number | null;
  donationSuggestedAmounts: number[];
  offlineDonationInstructions: AdminOfflineInstruction[];
  legalNotice: RichTextDoc | null;
  privacyPolicy: RichTextDoc | null;
  updatedAt: string | null;
  updatedByName: string | null;
};

export type AdminCampaign = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  content: RichTextDoc;
  coverImagePath: string | null;
  coverImageAlt: string | null;
  goalAmount: number | null;
  startsOn: string | null;
  endsOn: string | null;
  showProgress: boolean;
  shareMessage: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AdminCampaignListItem = Pick<
  AdminCampaign,
  "id" | "title" | "slug" | "goalAmount" | "startsOn" | "endsOn" | "isActive" | "showProgress" | "updatedAt"
>;

export type AdminDonation = {
  id: string;
  reference: string;
  channel: "online" | "offline";
  status: "pending" | "paid" | "failed" | "cancelled" | "refunded";
  amount: number;
  currency: string;
  paymentMethod: string | null;
  provider: "kkiapay" | "cinetpay" | null;
  donorName: string | null;
  donorEmail: string | null;
  donorPhone: string | null;
  isAnonymous: boolean;
  donorMessage: string | null;
  receivedOn: string | null;
  operatorOrBank: string | null;
  externalReference: string | null;
  proofPath: string | null;
  paidAt: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  campaign: { id: string; title: string; slug: string } | null;
  recordedByName: string | null;
  utm: { source: string | null; medium: string | null; campaign: string | null };
  createdAt: string;
};

export type AdminPaymentTransaction = {
  id: string;
  provider: "kkiapay" | "cinetpay";
  status: "pending" | "succeeded" | "failed" | "cancelled" | "refunded";
  amount: number;
  verifiedAt: string | null;
  failureReason: string | null;
  createdAt: string;
};

export type AdminDonationDetail = AdminDonation & {
  /** Tentatives de paiement (dons en ligne). */
  transactions: AdminPaymentTransaction[];
  /** Fiche du justificatif dans la médiathèque (pour l'afficher via getPrivateDocumentUrl). */
  proofMediaId: string | null;
};

/** Chiffres du tableau de bord (fonction admin_dashboard_stats) ; les dons ne sont visibles que des admins. */
export type DashboardStats = {
  articles: { published: number; inReview: number; draft: number };
  projectsPublished: number;
  donations?: {
    online: { count: number; amount: number };
    offline: { count: number; amount: number };
    totalAmount: number;
    currency: string;
  };
  campaignsActive?: number;
  requestsUnread?: { contact: number; volunteer: number; membership: number; sponsorship: number };
  newsletterSubscribed?: number;
};

export type RequestType = "contact" | "volunteer" | "membership" | "sponsorship";
export type RequestStatus = "unread" | "read" | "processed" | "archived";

export type AdminRequestListItem = {
  id: string;
  type: RequestType;
  status: RequestStatus;
  fullName: string;
  email: string | null;
  phone: string | null;
  subject: string | null;
  createdAt: string;
};

export type AdminRequest = AdminRequestListItem & {
  organization: string | null;
  message: string | null;
  details: Record<string, unknown>;
  handledAt: string | null;
  handledByName: string | null;
  consentAt: string;
};

export type AdminSubscriber = {
  id: string;
  email: string;
  status: "pending" | "subscribed" | "unsubscribed";
  source: string | null;
  confirmedAt: string | null;
  unsubscribedAt: string | null;
  createdAt: string;
};

export type AdminMedia = {
  id: string;
  bucket: "public-media" | "private-documents";
  path: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  altText: string | null;
  uploadedByName: string | null;
  createdAt: string;
};

export type AdminAccount = {
  userId: string;
  fullName: string;
  email: string;
  role: "editor" | "admin" | "super_admin" | null;
  createdAt: string;
  roleGrantedAt: string | null;
};
