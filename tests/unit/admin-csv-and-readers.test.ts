import { beforeEach, describe, expect, it, vi } from "vitest";

import { ID, eqValue, loginAs, state, useDb } from "./admin-test-utils";

vi.mock("next/cache", () => ({ updateTag: vi.fn(), revalidateTag: vi.fn(), cacheTag: vi.fn(), cacheLife: vi.fn() }));
vi.mock("@/server/auth/guard", async () => (await import("./admin-test-utils")).guardModule);
vi.mock("@/server/supabase/server", async () => (await import("./admin-test-utils")).sessionModule);

const { csvCell, toCsv } = await import("@/server/admin/csv");
const { getAdminArticle, listAdminArticles } = await import("@/server/data/admin/articles");
const { listDonations, getDashboardStats } = await import("@/server/data/admin/donations");
const { listMedia } = await import("@/server/data/admin/media");
const { listAdminAccounts } = await import("@/server/data/admin/accounts");

beforeEach(() => {
  vi.clearAllMocks();
  state.session = null;
  state.db = null;
});

describe("CSV pour Excel", () => {
  it("neutralise les formules (= + - @, tabulation, retour chariot, espaces devant)", () => {
    expect(csvCell("=1+1")).toBe("'=1+1");
    expect(csvCell("+229 90 00 00 00")).toBe("'+229 90 00 00 00");
    expect(csvCell("-2")).toBe("'-2");
    expect(csvCell("@SUM(A1)")).toBe("'@SUM(A1)");
    expect(csvCell("\tcmd")).toBe("'\tcmd");
    expect(csvCell("  =cmd")).toBe("'  =cmd");
    expect(csvCell("Awa")).toBe("Awa");
  });

  it("échappe guillemets, séparateurs et retours à la ligne", () => {
    expect(csvCell('Dit "merci"')).toBe('"Dit ""merci"""');
    expect(csvCell("a;b")).toBe('"a;b"');
    expect(csvCell("ligne 1\nligne 2")).toBe('"ligne 1\nligne 2"');
    expect(csvCell('=HYPERLINK("x")')).toBe('"\'=HYPERLINK(""x"")"');
  });

  it("nombres, booléens et vides", () => {
    expect(csvCell(25000)).toBe("25000");
    expect(csvCell(true)).toBe("oui");
    expect(csvCell(false)).toBe("non");
    expect(csvCell(null)).toBe("");
    expect(csvCell(undefined)).toBe("");
  });

  it("UTF-8 avec BOM, séparateur « ; », fins de ligne CRLF", () => {
    expect(toCsv(["Nom", "Montant"], [["Élodie", 5000]])).toBe("﻿Nom;Montant\r\nÉlodie;5000\r\n");
  });
});

describe("lectures de l'administration", () => {
  it("revérifient le rôle (un éditeur ne lit pas les dons ni les justificatifs, un admin ne lit pas les comptes)", async () => {
    useDb();
    loginAs("editor");
    await expect(listDonations()).rejects.toThrow("REDIRECT");
    await expect(listMedia({ bucket: "private-documents" })).rejects.toThrow("REDIRECT");
    loginAs("admin");
    await expect(listAdminAccounts()).rejects.toThrow("REDIRECT");
    loginAs(null);
    await expect(listAdminArticles()).rejects.toThrow("REDIRECT");
  });

  it("liste paginée des articles avec filtres", async () => {
    const { calls } = useDb(() => ({
      data: [
        {
          id: ID.a,
          title: "Rentrée",
          slug: "rentree",
          status: "in_review",
          submitted_at: null,
          published_at: null,
          updated_at: "2026-11-06",
          category: [{ id: ID.b, name: "Éducation" }],
          author: { id: ID.c, full_name: "Awa" },
        },
      ],
      count: 41,
    }));
    loginAs("editor");
    const page = await listAdminArticles({ page: "3", status: "in_review", q: "rentrée" });
    expect(page).toMatchObject({ total: 41, page: 3, pageSize: 20, pageCount: 3 });
    expect(page.items[0]).toMatchObject({ category: { id: ID.b, name: "Éducation" }, author: { id: ID.c, fullName: "Awa" } });
    expect(eqValue(calls[0], "status")).toBe("in_review");
    expect(calls[0].filters).toContainEqual(["range", 40, 59]);
    expect(calls[0].filters).toContainEqual(["ilike", "title", "%rentrée%"]);
  });

  it("élément à modifier : identifiant mal formé = introuvable, sans requête", async () => {
    const { calls } = useDb();
    loginAs("editor");
    expect(await getAdminArticle("pas-un-id")).toBeNull();
    expect(calls).toHaveLength(0);
  });

  it("liste des dons : filtres canal / statut / appel / période", async () => {
    const { calls } = useDb(() => ({ data: [], count: 0 }));
    loginAs("admin");
    await listDonations({ channel: "offline", status: "cancelled", campaignId: ID.a, from: "2026-11-01", to: "2026-11-30" });
    expect(eqValue(calls[0], "channel")).toBe("offline");
    expect(eqValue(calls[0], "payment_status")).toBe("cancelled");
    expect(eqValue(calls[0], "campaign_id")).toBe(ID.a);
    expect(calls[0].filters).toContainEqual(["gte", "created_at", "2026-11-01"]);
    expect(calls[0].filters).toContainEqual(["lt", "created_at", "2026-12-01"]);
  });

  it("tableau de bord : chiffres de la fonction admin_dashboard_stats (dons absents pour un éditeur)", async () => {
    useDb(() => ({ data: { articles: { published: 3, in_review: 1, draft: 2 }, projects_published: 4 } }));
    loginAs("editor");
    expect(await getDashboardStats()).toEqual({
      articles: { published: 3, inReview: 1, draft: 2 },
      projectsPublished: 4,
      donations: undefined,
      campaignsActive: undefined,
      requestsUnread: undefined,
      newsletterSubscribed: undefined,
    });
  });

  it("comptes : rôle de chaque profil (null = aucun accès)", async () => {
    useDb((call) =>
      call.table === "profiles"
        ? {
            data: [
              { id: ID.a, full_name: "Awa", email: "awa@x.org", created_at: "2026-11-01" },
              { id: ID.b, full_name: "Koffi", email: "koffi@x.org", created_at: "2026-11-02" },
            ],
          }
        : { data: [{ user_id: ID.a, role: "admin", created_at: "2026-11-01", updated_at: "2026-11-03" }] },
    );
    loginAs("super_admin");
    const list = await listAdminAccounts();
    expect(list.map((account) => [account.fullName, account.role])).toEqual([
      ["Awa", "admin"],
      ["Koffi", null],
    ]);
  });
});
