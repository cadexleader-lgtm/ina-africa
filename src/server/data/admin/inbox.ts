import "server-only";

import { requestFiltersSchema, subscriberFiltersSchema } from "@/lib/validation/admin/inbox";
import { check } from "@/server/admin/action";
import { ADMIN_PAGE_SIZE, adminReader, first, isUuid } from "@/server/data/admin/reader";
import type {
  AdminRequest,
  AdminRequestListItem,
  AdminSubscriber,
  Paginated,
  RequestStatus,
  RequestType,
} from "@/server/data/admin/types";
import { pageRange, paginated } from "@/server/data/reader";

/* Boîte de réception et newsletter (admin seulement, données personnelles). */

type RequestRow = {
  id: string;
  request_type: RequestType;
  status: RequestStatus;
  full_name: string;
  email: string | null;
  phone: string | null;
  subject: string | null;
  organization: string | null;
  message: string | null;
  details: Record<string, unknown> | null;
  handled_at: string | null;
  consent_at: string;
  created_at: string;
  handler: { full_name: string } | { full_name: string }[] | null;
};

function toListItem(row: RequestRow): AdminRequestListItem {
  return {
    id: row.id,
    type: row.request_type,
    status: row.status,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    subject: row.subject,
    createdAt: row.created_at,
  };
}

/** Demandes, des plus récentes aux plus anciennes ; filtres : type et statut. */
export async function listRequests(filters: unknown = {}): Promise<Paginated<AdminRequestListItem>> {
  const { db } = await adminReader("admin");
  const f = requestFiltersSchema.parse(filters ?? {});
  const range = pageRange(f.page, ADMIN_PAGE_SIZE);
  let query = db
    .from("contact_requests")
    .select("id, request_type, status, full_name, email, phone, subject, created_at", { count: "exact" });
  if (f.type) query = query.eq("request_type", f.type);
  if (f.status) query = query.eq("status", f.status);
  const result = await query.order("created_at", { ascending: false }).range(range.from, range.to);
  const items = ((check(result) ?? []) as unknown as RequestRow[]).map(toListItem);
  return paginated(items, result.count ?? items.length, range.page, ADMIN_PAGE_SIZE);
}

export async function getRequest(id: string): Promise<AdminRequest | null> {
  const { db } = await adminReader("admin");
  if (!isUuid(id)) return null;
  const row = check(
    await db
      .from("contact_requests")
      .select(
        "id, request_type, status, full_name, email, phone, subject, organization, message, details, handled_at, consent_at, created_at, handler:profiles!contact_requests_handled_by_fkey(full_name)",
      )
      .eq("id", id)
      .maybeSingle(),
  ) as unknown as RequestRow | null;
  if (!row) return null;
  return {
    ...toListItem(row),
    organization: row.organization,
    message: row.message,
    details: row.details ?? {},
    handledAt: row.handled_at,
    handledByName: first(row.handler)?.full_name ?? null,
    consentAt: row.consent_at,
  };
}

type SubscriberRow = {
  id: string;
  email: string;
  status: AdminSubscriber["status"];
  source: string | null;
  confirmed_at: string | null;
  unsubscribed_at: string | null;
  created_at: string;
};

/** Inscrits à la newsletter (jamais les empreintes de jetons). */
export async function listNewsletterSubscribers(filters: unknown = {}): Promise<Paginated<AdminSubscriber>> {
  const { db } = await adminReader("admin");
  const f = subscriberFiltersSchema.parse(filters ?? {});
  const range = pageRange(f.page, ADMIN_PAGE_SIZE);
  let query = db
    .from("newsletter_subscribers")
    .select("id, email, status, source, confirmed_at, unsubscribed_at, created_at", { count: "exact" });
  if (f.status) query = query.eq("status", f.status);
  const result = await query.order("created_at", { ascending: false }).range(range.from, range.to);
  const items = ((check(result) ?? []) as unknown as SubscriberRow[]).map((row) => ({
    id: row.id,
    email: row.email,
    status: row.status,
    source: row.source,
    confirmedAt: row.confirmed_at,
    unsubscribedAt: row.unsubscribed_at,
    createdAt: row.created_at,
  }));
  return paginated(items, result.count ?? items.length, range.page, ADMIN_PAGE_SIZE);
}
