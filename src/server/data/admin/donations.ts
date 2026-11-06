import "server-only";

import { donationFiltersSchema } from "@/lib/validation/admin/donations";
import { check } from "@/server/admin/action";
import { DONATION_COLUMNS, firstOf, queryDonations, type DonationRow } from "@/server/admin/donations";
import { ADMIN_PAGE_SIZE, adminReader, isUuid } from "@/server/data/admin/reader";
import type {
  AdminDonation,
  AdminDonationDetail,
  AdminPaymentTransaction,
  DashboardStats,
  Paginated,
} from "@/server/data/admin/types";
import { pageRange, paginated } from "@/server/data/reader";

/*
 * Dons (admin, lecture seule). En ligne et hors ligne sont toujours
 * distingués (`channel`). Les montants « encaissés » du tableau de bord
 * viennent de admin_dashboard_stats() (transactions réussies ET vérifiées).
 */

function toDonation(row: DonationRow): AdminDonation {
  const recorder = firstOf(row.recorder);
  return {
    id: row.id,
    reference: row.reference,
    channel: row.channel,
    status: row.payment_status,
    amount: Number(row.amount),
    currency: row.currency,
    paymentMethod: row.payment_method,
    provider: row.provider,
    donorName: row.donor_name,
    donorEmail: row.donor_email,
    donorPhone: row.donor_phone,
    isAnonymous: row.is_anonymous,
    donorMessage: row.donor_message,
    receivedOn: row.received_on,
    operatorOrBank: row.operator_or_bank,
    externalReference: row.external_reference,
    proofPath: row.proof_path,
    paidAt: row.paid_at,
    cancelledAt: row.cancelled_at,
    cancellationReason: row.cancellation_reason,
    campaign: firstOf(row.campaign),
    recordedByName: recorder?.full_name ?? null,
    utm: { source: row.utm_source, medium: row.utm_medium, campaign: row.utm_campaign },
    createdAt: row.created_at,
  };
}

/** Liste paginée, filtres : canal, statut, appel aux dons, période d'enregistrement. */
export async function listDonations(filters: unknown = {}): Promise<Paginated<AdminDonation>> {
  const { db } = await adminReader("admin");
  const { page, ...rest } = donationFiltersSchema.parse(filters ?? {});
  const range = pageRange(page, ADMIN_PAGE_SIZE);
  const { rows, total } = await queryDonations(db, rest, range);
  return paginated(rows.map(toDonation), total, range.page, ADMIN_PAGE_SIZE);
}

type TransactionRow = {
  id: string;
  provider: "kkiapay" | "cinetpay";
  status: AdminPaymentTransaction["status"];
  amount: number;
  verified_at: string | null;
  failure_reason: string | null;
  created_at: string;
};

export async function getDonation(id: string): Promise<AdminDonationDetail | null> {
  const { db } = await adminReader("admin");
  if (!isUuid(id)) return null;
  const row = check(await db.from("donations").select(DONATION_COLUMNS).eq("id", id).maybeSingle()) as unknown as
    | DonationRow
    | null;
  if (!row) return null;

  const [transactions, proof] = await Promise.all([
    row.channel === "online"
      ? db
          .from("payment_transactions")
          .select("id, provider, status, amount, verified_at, failure_reason, created_at")
          .eq("donation_id", id)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    row.proof_path
      ? db.from("media").select("id").eq("bucket", "private-documents").eq("storage_path", row.proof_path).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  return {
    ...toDonation(row),
    transactions: ((check(transactions) ?? []) as TransactionRow[]).map((tx) => ({
      id: tx.id,
      provider: tx.provider,
      status: tx.status,
      amount: Number(tx.amount),
      verifiedAt: tx.verified_at,
      failureReason: tx.failure_reason,
      createdAt: tx.created_at,
    })),
    proofMediaId: (check(proof) as { id: string } | null)?.id ?? null,
  };
}

type StatsJson = {
  articles?: { published?: number; in_review?: number; draft?: number };
  projects_published?: number;
  donations?: {
    online: { count: number; amount: number };
    offline: { count: number; amount: number };
    total_amount: number;
    currency: string;
  };
  campaigns_active?: number;
  requests_unread?: { contact: number; volunteer: number; membership: number; sponsorship: number };
  newsletter_subscribed?: number;
};

/** Chiffres du tableau de bord : contenus pour toute l'équipe, dons / demandes / newsletter pour les admins. */
export async function getDashboardStats(): Promise<DashboardStats> {
  const { db } = await adminReader("editor");
  const stats = (check(await db.rpc("admin_dashboard_stats")) ?? {}) as StatsJson;
  const n = (value: unknown) => Number(value ?? 0);
  return {
    articles: {
      published: n(stats.articles?.published),
      inReview: n(stats.articles?.in_review),
      draft: n(stats.articles?.draft),
    },
    projectsPublished: n(stats.projects_published),
    donations: stats.donations
      ? {
          online: { count: n(stats.donations.online.count), amount: n(stats.donations.online.amount) },
          offline: { count: n(stats.donations.offline.count), amount: n(stats.donations.offline.amount) },
          totalAmount: n(stats.donations.total_amount),
          currency: stats.donations.currency,
        }
      : undefined,
    campaignsActive: stats.campaigns_active === undefined ? undefined : n(stats.campaigns_active),
    requestsUnread: stats.requests_unread
      ? {
          contact: n(stats.requests_unread.contact),
          volunteer: n(stats.requests_unread.volunteer),
          membership: n(stats.requests_unread.membership),
          sponsorship: n(stats.requests_unread.sponsorship),
        }
      : undefined,
    newsletterSubscribed: stats.newsletter_subscribed === undefined ? undefined : n(stats.newsletter_subscribed),
  };
}
