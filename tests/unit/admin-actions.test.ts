import { beforeEach, describe, expect, it, vi } from "vitest";

import { DOC, ID, USER_ID, eqValue, loginAs, state, useDb, type FakeCall } from "./admin-test-utils";

vi.mock("next/cache", () => ({ updateTag: vi.fn(), revalidateTag: vi.fn(), cacheTag: vi.fn(), cacheLife: vi.fn() }));
vi.mock("@/server/auth/guard", async () => (await import("./admin-test-utils")).guardModule);
vi.mock("@/server/supabase/server", async () => (await import("./admin-test-utils")).sessionModule);
const privileged = vi.hoisted(() => ({
  auth: { admin: { inviteUserByEmail: vi.fn(), deleteUser: vi.fn() } },
}));
vi.mock("@/server/supabase/admin", () => ({ createPrivilegedClient: () => privileged }));

const { updateTag } = await import("next/cache");
const { createSessionClient } = await import("@/server/supabase/server");
const articles = await import("@/server/actions/admin/articles");
const content = await import("@/server/actions/admin/content");
const { updateSiteSettings } = await import("@/server/actions/admin/settings");
const campaigns = await import("@/server/actions/admin/campaigns");
const donations = await import("@/server/actions/admin/donations");
const inbox = await import("@/server/actions/admin/inbox");
const accounts = await import("@/server/actions/admin/accounts");
const { TAGS } = await import("@/server/data/tags");

const tags = () => vi.mocked(updateTag).mock.calls.map((call) => call[0]);
const writes = (calls: FakeCall[]) => calls.filter((call) => call.op !== "select");

beforeEach(() => {
  vi.clearAllMocks();
  state.session = null;
  state.db = null;
});

describe("barrières communes", () => {
  it("refuse sans session, sans toucher à la base", async () => {
    const { calls } = useDb();
    const result = await articles.createArticle({ title: "Titre", content: DOC });
    expect(result).toEqual({ ok: false, error: expect.objectContaining({ code: "UNAUTHENTICATED" }) });
    expect(createSessionClient).not.toHaveBeenCalled();
    expect(calls).toHaveLength(0);
  });

  it("refuse si le rôle ne suffit pas (éditeur → publication, admin → comptes)", async () => {
    const { calls } = useDb();
    loginAs("editor");
    expect((await articles.publishArticle({ id: ID.a })).ok).toBe(false);
    expect((await content.createProject({ title: "Projet", status: "planned" })).ok).toBe(false);
    expect((await donations.exportDonationsCsv({})).ok).toBe(false);
    loginAs("admin");
    const invite = await accounts.inviteMember({ email: "a@b.org", fullName: "A", role: "editor" });
    expect(invite).toEqual({ ok: false, error: expect.objectContaining({ code: "FORBIDDEN" }) });
    expect(calls).toHaveLength(0);
    expect(privileged.auth.admin.inviteUserByEmail).not.toHaveBeenCalled();
  });

  it("renvoie les erreurs de validation par champ, sans toucher à la base", async () => {
    const { calls } = useDb();
    loginAs("admin");
    const result = await content.createPartner({ name: "", kind: "x" });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("VALIDATION");
    expect(Object.keys(result.error.fieldErrors ?? {})).toEqual(expect.arrayContaining(["name", "kind"]));
    expect(calls).toHaveLength(0);
  });

  it("traduit une erreur de la base en message clair (jamais le détail technique)", async () => {
    useDb(() => ({ error: { code: "23505", message: 'duplicate key value violates unique constraint "projects_slug_key"' } }));
    loginAs("admin");
    const result = await content.createProject({ title: "Puits de Godomey", status: "planned" });
    expect(result).toEqual({
      ok: false,
      error: { code: "CONFLICT", message: "Cette adresse est déjà utilisée par un autre projet.", fieldErrors: undefined },
    });
  });
});

describe("articles", () => {
  it("crée un brouillon (adresse calculée, contenu nettoyé), sans toucher au cache public", async () => {
    const { calls } = useDb(() => ({ data: { id: ID.a, slug: "rentree-solidaire", status: "draft" } }));
    loginAs("editor");
    const result = await articles.createArticle({
      title: "Rentrée solidaire",
      content: { ...DOC, script: "x" },
      status: "published",
    });
    expect(result.ok).toBe(true);
    expect(calls[0]).toMatchObject({ table: "articles", op: "insert" });
    expect(calls[0].values).toMatchObject({ slug: "rentree-solidaire", status: "draft", content: DOC });
    expect(calls[0].values).not.toHaveProperty("author_id");
    expect(updateTag).not.toHaveBeenCalled();
  });

  it("un éditeur ne modifie pas un article publié", async () => {
    const { calls } = useDb(() => ({ data: { id: ID.a, slug: "a", status: "published" } }));
    loginAs("editor");
    const result = await articles.updateArticle({ id: ID.a, title: "Nouveau titre", content: DOC });
    expect(result).toEqual({ ok: false, error: expect.objectContaining({ code: "FORBIDDEN" }) });
    expect(writes(calls)).toHaveLength(0);
  });

  it("l'admin modifie un article publié : ancienne et nouvelle adresse invalidées", async () => {
    useDb((call) =>
      call.op === "select"
        ? { data: { id: ID.a, slug: "ancienne", status: "published" } }
        : { data: { id: ID.a, slug: "nouvelle", status: "published" } },
    );
    loginAs("admin");
    const result = await articles.updateArticle({ id: ID.a, title: "Titre", slug: "nouvelle", content: DOC });
    expect(result.ok).toBe(true);
    expect(tags()).toEqual([TAGS.articles, TAGS.article("ancienne"), TAGS.article("nouvelle")]);
  });

  it("soumission à relecture : seulement depuis un brouillon", async () => {
    const { calls } = useDb((call) =>
      call.op === "select" ? { data: { id: ID.a, slug: "a", status: "draft" } } : { data: { id: ID.a, slug: "a", status: "in_review" } },
    );
    loginAs("editor");
    expect((await articles.submitArticleForReview({ id: ID.a })).ok).toBe(true);
    const update = calls.find((call) => call.op === "update")!;
    expect(update.values).toEqual({ status: "in_review" });
    // Protection contre deux modifications simultanées.
    expect(eqValue(update, "status")).toBe("draft");

    useDb(() => ({ data: { id: ID.a, slug: "a", status: "published" } }));
    const again = await articles.submitArticleForReview({ id: ID.a });
    expect(again).toEqual({ ok: false, error: expect.objectContaining({ code: "CONFLICT" }) });
  });

  it("publication : refuse un article vide, puis publie et invalide le cache", async () => {
    useDb(() => ({ data: { content: { type: "doc", content: [] } } }));
    loginAs("admin");
    expect(await articles.publishArticle({ id: ID.a })).toEqual({ ok: false, error: expect.objectContaining({ code: "VALIDATION" }) });

    const { calls } = useDb((call) => {
      if (call.op === "select" && call.columns === "content") return { data: { content: DOC } };
      if (call.op === "select") return { data: { id: ID.a, slug: "a", status: "in_review" } };
      return { data: { id: ID.a, slug: "a", status: "published" } };
    });
    expect((await articles.publishArticle({ id: ID.a })).ok).toBe(true);
    expect(calls.find((call) => call.op === "update")?.values).toEqual({ status: "published" });
    expect(tags()).toEqual([TAGS.articles, TAGS.article("a")]);
  });

  it("renvoi à l'auteur avec remarque de relecture ; dépublication avec remarque facultative", async () => {
    const { calls } = useDb((call) =>
      call.op === "select" ? { data: { id: ID.a, slug: "a", status: "in_review" } } : { data: { id: ID.a, slug: "a", status: "draft" } },
    );
    loginAs("admin");
    expect((await articles.rejectArticle({ id: ID.a, reviewNote: "Ajoutez la date de l'événement." })).ok).toBe(true);
    expect(calls.find((call) => call.op === "update")?.values).toEqual({ status: "draft", review_note: "Ajoutez la date de l'événement." });

    const second = useDb((call) =>
      call.op === "select" ? { data: { id: ID.a, slug: "a", status: "published" } } : { data: { id: ID.a, slug: "a", status: "draft" } },
    );
    expect((await articles.unpublishArticle({ id: ID.a })).ok).toBe(true);
    expect(second.calls.find((call) => call.op === "update")?.values).toEqual({ status: "draft", review_note: null });
    expect(tags()).toContain(TAGS.article("a"));
  });

  it("suppression : un éditeur ne supprime que ses propres brouillons", async () => {
    let fake = useDb(() => ({ data: { id: ID.a, slug: "a", status: "draft", author_id: ID.b } }));
    loginAs("editor");
    expect(await articles.deleteArticle({ id: ID.a })).toEqual({ ok: false, error: expect.objectContaining({ code: "FORBIDDEN" }) });
    expect(writes(fake.calls)).toHaveLength(0);

    fake = useDb((call) =>
      call.op === "delete" ? { data: [{ id: ID.a }] } : { data: { id: ID.a, slug: "a", status: "draft", author_id: USER_ID } },
    );
    expect((await articles.deleteArticle({ id: ID.a })).ok).toBe(true);
    expect(fake.calls.at(-1)).toMatchObject({ table: "articles", op: "delete" });
    expect(updateTag).not.toHaveBeenCalled();
  });

  it("suppression d'un élément déjà supprimé : introuvable", async () => {
    useDb((call) => (call.op === "delete" ? { data: [] } : { data: { id: ID.a, slug: "a", status: "draft", author_id: null } }));
    loginAs("admin");
    expect(await articles.deleteArticle({ id: ID.a })).toEqual({ ok: false, error: expect.objectContaining({ code: "NOT_FOUND" }) });
  });

  it("catégories : gérées par l'admin, articles et catégories invalidés", async () => {
    useDb(() => ({ data: { id: ID.a, slug: "vie-associative" } }));
    loginAs("admin");
    expect((await articles.createCategory({ name: "Vie associative" })).ok).toBe(true);
    expect(tags()).toEqual([TAGS.categories, TAGS.articles]);
  });
});

describe("projets, domaines, galerie", () => {
  it("projet créé non publié ; publication refusée sans contenu", async () => {
    const { calls } = useDb(() => ({ data: { id: ID.a, slug: "puits", is_published: false } }));
    loginAs("admin");
    expect((await content.createProject({ title: "Puits", status: "ongoing", isPublished: true })).ok).toBe(true);
    expect(calls[0].values).toMatchObject({ is_published: false, slug: "puits" });

    useDb(() => ({ data: { content: { type: "doc", content: [] }, summary: null } }));
    expect(await content.setProjectPublished({ id: ID.a, published: true })).toEqual({
      ok: false,
      error: expect.objectContaining({ code: "VALIDATION" }),
    });
  });

  it("activation d'un domaine : domaines ET projets invalidés (le domaine est affiché sur les cartes)", async () => {
    const { calls } = useDb(() => ({ data: { id: ID.a, slug: "education", is_active: true } }));
    loginAs("admin");
    expect((await content.setActionAreaActive({ id: ID.a, active: "true" })).ok).toBe(true);
    expect(calls[0]).toMatchObject({ table: "action_areas", op: "update", values: { is_active: true } });
    expect(tags()).toEqual([TAGS.areas, TAGS.projects]);
  });

  it("ordre des domaines : 1, 2, 3… dans l'ordre reçu", async () => {
    const { calls } = useDb(() => ({ data: [{ id: "x" }] }));
    loginAs("admin");
    expect((await content.reorderActionAreas({ ids: [ID.c, ID.a, ID.b] })).ok).toBe(true);
    expect(calls.map((call) => [eqValue(call, "id"), call.values])).toEqual([
      [ID.c, { display_order: 1 }],
      [ID.a, { display_order: 2 }],
      [ID.b, { display_order: 3 }],
    ]);
  });

  it("galerie : le fournisseur de la vidéo est déduit de l'adresse", async () => {
    const { calls } = useDb(() => ({ data: { id: ID.a, is_published: false } }));
    loginAs("admin");
    const result = await content.createGalleryItem({ itemType: "video", videoUrl: "https://youtu.be/dQw4w9WgXcQ" });
    expect(result.ok).toBe(true);
    expect(calls[0].values).toMatchObject({ item_type: "video", video_provider: "youtube", image_path: null, is_published: false });
    expect(tags()).toEqual([TAGS.gallery]);
  });
});

describe("paramètres du site", () => {
  it("ne modifie que les champs envoyés, sur la ligne unique", async () => {
    const { calls } = useDb(() => ({ data: { updated_at: "2026-11-06T10:00:00Z" } }));
    loginAs("admin");
    const result = await updateSiteSettings({
      heroTitle: "Agir ensemble",
      socialLinks: { facebook: "https://facebook.com/inaafrica" },
    });
    expect(result).toEqual({ ok: true, data: { updatedAt: "2026-11-06T10:00:00Z" } });
    expect(calls[0]).toMatchObject({
      table: "site_settings",
      op: "update",
      values: { hero_title: "Agir ensemble", social_links: { facebook: "https://facebook.com/inaafrica" } },
    });
    expect(eqValue(calls[0], "id")).toBe("1");
    expect(tags()).toEqual([TAGS.settings]);
  });

  it("un éditeur ne modifie pas les paramètres", async () => {
    useDb();
    loginAs("editor");
    expect((await updateSiteSettings({ heroTitle: "x" })).ok).toBe(false);
  });
});

describe("appels aux dons et dons hors ligne", () => {
  it("appel aux dons : liste, page et jauges invalidées", async () => {
    useDb((call) =>
      call.op === "select" ? { data: { id: ID.a, slug: "ancien", is_active: true } } : { data: { id: ID.a, slug: "rentree", is_active: true } },
    );
    loginAs("admin");
    expect((await campaigns.updateCampaign({ id: ID.a, title: "Rentrée", slug: "rentree" })).ok).toBe(true);
    expect(tags()).toEqual([TAGS.campaigns, TAGS.campaignProgress, TAGS.campaign("ancien"), TAGS.campaign("rentree")]);
  });

  it("appel aux dons ayant reçu des dons : suppression refusée avec explication", async () => {
    useDb((call) =>
      call.op === "delete"
        ? { error: { code: "23503", message: 'violates foreign key constraint "donations_campaign_id_fkey"' } }
        : { data: { id: ID.a, slug: "rentree", is_active: false } },
    );
    loginAs("admin");
    const result = await campaigns.deleteCampaign({ id: ID.a });
    expect(result).toEqual({ ok: false, error: expect.objectContaining({ code: "CONFLICT", message: expect.stringContaining("désactivez-le") }) });
  });

  it("don hors ligne : appel de record_offline_donation avec la clé d'idempotence", async () => {
    const { calls } = useDb(() => ({ data: { id: ID.b, reference: "DON-2026-000042", payment_status: "paid" } }));
    loginAs("admin");
    const result = await donations.recordOfflineDonation({
      amount: "25 000",
      receivedOn: "2026-11-01",
      paymentMethod: "mobile_money",
      externalReference: "MP261101.1234",
      operatorOrBank: "MTN",
      donorEmail: "Awa@Exemple.bj",
      campaignId: ID.a,
      idempotencyKey: ID.c,
    });
    expect(result).toEqual({ ok: true, data: { id: ID.b, reference: "DON-2026-000042", paymentStatus: "paid" } });
    expect(calls[0]).toMatchObject({ table: "rpc:record_offline_donation", op: "rpc" });
    expect(calls[0].values).toEqual({
      p_amount: 25000,
      p_received_on: "2026-11-01",
      p_payment_method: "mobile_money",
      p_external_reference: "MP261101.1234",
      p_operator_or_bank: "MTN",
      p_donor_name: null,
      p_donor_email: "awa@exemple.bj",
      p_donor_phone: null,
      p_is_anonymous: false,
      p_campaign_id: ID.a,
      p_proof_path: null,
      p_donor_message: null,
      p_idempotency_key: ID.c,
    });
    expect(tags()).toEqual([TAGS.campaignProgress]);
  });

  it("don hors ligne en double : message de la base affiché tel quel", async () => {
    const message = "Cette opération (même mode de réception et même référence) est déjà enregistrée.";
    useDb(() => ({ error: { code: "23505", message, hint: "ina-africa" } }));
    loginAs("admin");
    const result = await donations.recordOfflineDonation({
      amount: 1000,
      receivedOn: "2026-11-01",
      paymentMethod: "bank_transfer",
      externalReference: "VIR-001",
      idempotencyKey: ID.c,
    });
    expect(result).toEqual({ ok: false, error: { code: "CONFLICT", message, fieldErrors: undefined } });
    expect(updateTag).not.toHaveBeenCalled();
  });

  it("annulation d'un don hors ligne : motif transmis à cancel_offline_donation", async () => {
    const { calls } = useDb(() => ({ data: { id: ID.b, reference: "DON-2026-000042", payment_status: "cancelled" } }));
    loginAs("admin");
    expect((await donations.cancelOfflineDonation({ id: ID.b, reason: "Saisie en double" })).ok).toBe(true);
    expect(calls[0]).toMatchObject({ table: "rpc:cancel_offline_donation", values: { p_donation_id: ID.b, p_reason: "Saisie en double" } });
    expect(tags()).toEqual([TAGS.campaignProgress]);
  });

  it("export CSV des dons : filtres appliqués, BOM, formules neutralisées", async () => {
    const row = {
      id: ID.a,
      reference: "DON-2026-000001",
      channel: "offline",
      payment_status: "paid",
      amount: 25000,
      currency: "XOF",
      payment_method: "mobile_money",
      provider: null,
      donor_name: '=HYPERLINK("http://pirate.example","clic")',
      donor_email: null,
      donor_phone: "+22990000000",
      is_anonymous: false,
      donor_message: "Merci ; bon courage",
      received_on: "2026-11-01",
      operator_or_bank: "MTN",
      external_reference: "@SUM(A1)",
      proof_path: null,
      paid_at: "2026-11-01T10:00:00Z",
      cancelled_at: null,
      cancellation_reason: null,
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
      created_at: "2026-11-01T10:00:00Z",
      campaign: { id: ID.b, title: "Rentrée", slug: "rentree" },
      recorder: { full_name: "Admin" },
    };
    const { calls } = useDb(() => ({ data: [row], count: 1 }));
    loginAs("admin");
    const result = await donations.exportDonationsCsv({ channel: "offline", status: "paid" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(eqValue(calls[0], "channel")).toBe("offline");
    expect(eqValue(calls[0], "payment_status")).toBe("paid");
    const { content: csv, fileName, rowCount, truncated } = result.data;
    expect(fileName).toMatch(/^dons-\d{4}-\d{2}-\d{2}\.csv$/);
    expect(rowCount).toBe(1);
    expect(truncated).toBe(false);
    expect(csv.startsWith("﻿Référence;")).toBe(true);
    expect(csv).toContain(`"'=HYPERLINK(""http://pirate.example"",""clic"")"`);
    expect(csv).toContain(";'@SUM(A1);");
    expect(csv).toContain(";'+22990000000;");
    expect(csv).toContain('"Merci ; bon courage"');
    expect(csv).toContain(";25000;XOF;Mobile Money;");
  });
});

describe("boîte de réception et newsletter", () => {
  it("change seulement le statut d'une demande (aucun cache public)", async () => {
    const { calls } = useDb(() => ({ data: { id: ID.a, status: "processed", handled_at: "2026-11-06" } }));
    loginAs("admin");
    expect((await inbox.updateRequestStatus({ id: ID.a, status: "processed", message: "modifié" })).ok).toBe(true);
    expect(calls[0]).toMatchObject({ table: "contact_requests", op: "update", values: { status: "processed" } });
    expect(updateTag).not.toHaveBeenCalled();
  });

  it("export de la newsletter : seulement les abonnés confirmés", async () => {
    const { calls } = useDb(() => ({ data: [{ email: "awa@exemple.bj", confirmed_at: "2026-11-02", source: "footer" }] }));
    loginAs("admin");
    const result = await inbox.exportNewsletterCsv();
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(eqValue(calls[0], "status")).toBe("subscribed");
    expect(result.data.content).toBe("﻿Email;Confirmé le;Origine\r\nawa@exemple.bj;2026-11-02;footer\r\n");
  });

  it("suppression d'un inscrit absent : introuvable", async () => {
    useDb(() => ({ data: [] }));
    loginAs("admin");
    expect(await inbox.deleteNewsletterSubscriber({ id: ID.a })).toEqual({
      ok: false,
      error: expect.objectContaining({ code: "NOT_FOUND" }),
    });
  });
});

describe("comptes (super_admin)", () => {
  it("invite par email puis attribue le rôle avec la session", async () => {
    const { calls } = useDb((call) => (call.table === "profiles" ? { data: null } : {}));
    privileged.auth.admin.inviteUserByEmail.mockResolvedValue({ data: { user: { id: ID.b } }, error: null });
    loginAs("super_admin");
    const result = await accounts.inviteMember({ email: "Awa@INA-Africa.org", fullName: "Awa Dossou", role: "editor" });
    expect(result).toEqual({ ok: true, data: { userId: ID.b, email: "awa@ina-africa.org", role: "editor" } });
    expect(privileged.auth.admin.inviteUserByEmail).toHaveBeenCalledWith("awa@ina-africa.org", {
      data: { full_name: "Awa Dossou" },
      redirectTo: expect.stringMatching(/\/auth\/confirm$/),
    });
    expect(calls.find((call) => call.table === "user_roles")).toMatchObject({ op: "insert", values: { user_id: ID.b, role: "editor" } });
  });

  it("annule l'invitation si le rôle ne peut pas être attribué", async () => {
    useDb((call) => (call.table === "profiles" ? { data: null } : { error: { code: "42501", message: "rls" } }));
    privileged.auth.admin.inviteUserByEmail.mockResolvedValue({ data: { user: { id: ID.b } }, error: null });
    privileged.auth.admin.deleteUser.mockResolvedValue({ error: null });
    loginAs("super_admin");
    const result = await accounts.inviteMember({ email: "awa@ina-africa.org", fullName: "Awa", role: "admin" });
    expect(result).toEqual({ ok: false, error: expect.objectContaining({ code: "FORBIDDEN" }) });
    expect(privileged.auth.admin.deleteUser).toHaveBeenCalledWith(ID.b);
  });

  it("refuse une adresse déjà utilisée sans envoyer d'invitation", async () => {
    useDb(() => ({ data: { id: ID.b } }));
    loginAs("super_admin");
    expect((await accounts.inviteMember({ email: "awa@ina-africa.org", fullName: "Awa", role: "admin" })).ok).toBe(false);
    expect(privileged.auth.admin.inviteUserByEmail).not.toHaveBeenCalled();
  });

  it("personne ne modifie son propre accès", async () => {
    const { calls } = useDb();
    loginAs("super_admin");
    expect(await accounts.changeMemberRole({ userId: USER_ID, role: "editor" })).toEqual({
      ok: false,
      error: expect.objectContaining({ code: "FORBIDDEN" }),
    });
    expect(await accounts.deleteMemberAccount({ userId: USER_ID })).toEqual({
      ok: false,
      error: expect.objectContaining({ code: "FORBIDDEN" }),
    });
    expect(calls).toHaveLength(0);
  });

  it("dernier super_admin : le refus de la base est affiché tel quel", async () => {
    const message = "Impossible de retirer le dernier super administrateur.";
    useDb((call) => (call.table === "profiles" ? { data: { id: ID.b, email: "x@y.org" } } : { error: { code: "P0001", message, hint: "ina-africa" } }));
    loginAs("super_admin");
    expect(await accounts.changeMemberRole({ userId: ID.b, role: "admin" })).toEqual({
      ok: false,
      error: { code: "VALIDATION", message, fieldErrors: undefined },
    });
  });

  it("suppression d'un compte : rôle retiré avec la session, puis compte supprimé", async () => {
    const { calls } = useDb((call) => (call.table === "profiles" ? { data: { id: ID.b, email: "x@y.org" } } : { data: [] }));
    privileged.auth.admin.deleteUser.mockResolvedValue({ error: null });
    loginAs("super_admin");
    expect((await accounts.deleteMemberAccount({ userId: ID.b })).ok).toBe(true);
    expect(calls.find((call) => call.table === "user_roles")).toMatchObject({ op: "delete" });
    expect(privileged.auth.admin.deleteUser).toHaveBeenCalledWith(ID.b);
  });
});
