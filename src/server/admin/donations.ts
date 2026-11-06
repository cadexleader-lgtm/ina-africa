import "server-only";

import type { DonationFilters } from "@/lib/validation/admin/donations";
import { check, type SessionDb } from "@/server/admin/action";

/*
 * Lecture des dons pour l'administration (liste paginée et export CSV) :
 * même requête, mêmes filtres. Lecture seule : personne n'écrit dans
 * `donations` depuis l'application, sauf via record_offline_donation() et
 * cancel_offline_donation().
 */

export const DONATION_COLUMNS = [
  "id",
  "reference",
  "channel",
  "payment_status",
  "amount",
  "currency",
  "payment_method",
  "provider",
  "donor_name",
  "donor_email",
  "donor_phone",
  "is_anonymous",
  "donor_message",
  "received_on",
  "operator_or_bank",
  "external_reference",
  "proof_path",
  "paid_at",
  "cancelled_at",
  "cancellation_reason",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "created_at",
  "campaign:donation_campaigns(id, title, slug)",
  "recorder:profiles!donations_recorded_by_fkey(full_name)",
].join(", ");

export type DonationRow = {
  id: string;
  reference: string;
  channel: "online" | "offline";
  payment_status: "pending" | "paid" | "failed" | "cancelled" | "refunded";
  amount: number;
  currency: string;
  payment_method: string | null;
  provider: "kkiapay" | "cinetpay" | null;
  donor_name: string | null;
  donor_email: string | null;
  donor_phone: string | null;
  is_anonymous: boolean;
  donor_message: string | null;
  received_on: string | null;
  operator_or_bank: string | null;
  external_reference: string | null;
  proof_path: string | null;
  paid_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  created_at: string;
  campaign: { id: string; title: string; slug: string } | { id: string; title: string; slug: string }[] | null;
  recorder: { full_name: string } | { full_name: string }[] | null;
};

export function firstOf<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

/** Lendemain d'une date AAAA-MM-JJ (borne de fin incluse). */
function nextDay(date: string): string {
  const next = new Date(`${date}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  return next.toISOString().slice(0, 10);
}

export async function queryDonations(
  db: SessionDb,
  filters: Omit<DonationFilters, "page">,
  range: { from: number; to: number },
): Promise<{ rows: DonationRow[]; total: number }> {
  let query = db.from("donations").select(DONATION_COLUMNS, { count: "exact" });
  if (filters.channel) query = query.eq("channel", filters.channel);
  if (filters.status) query = query.eq("payment_status", filters.status);
  if (filters.campaignId) query = query.eq("campaign_id", filters.campaignId);
  if (filters.from) query = query.gte("created_at", filters.from);
  if (filters.to) query = query.lt("created_at", nextDay(filters.to));
  const result = await query.order("created_at", { ascending: false }).range(range.from, range.to);
  const rows = check(result) as unknown as DonationRow[] | null;
  return { rows: rows ?? [], total: result.count ?? rows?.length ?? 0 };
}
