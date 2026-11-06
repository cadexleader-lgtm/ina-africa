import { beforeEach, describe, expect, it, vi } from "vitest";

import { ID, loginAs, state, useDb, type FakeCall } from "./admin-test-utils";

vi.mock("next/cache", () => ({ updateTag: vi.fn(), revalidateTag: vi.fn(), cacheTag: vi.fn(), cacheLife: vi.fn() }));
vi.mock("@/server/auth/guard", async () => (await import("./admin-test-utils")).guardModule);
vi.mock("@/server/supabase/server", async () => (await import("./admin-test-utils")).sessionModule);

const { detectFileType } = await import("@/server/admin/file-type");
const { randomStoragePath, smallVariantPath } = await import("@/server/admin/media");
const media = await import("@/server/actions/admin/media");

// Premiers octets réels de chaque format.
const JPEG = [0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46];
const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00];
const WEBP = [...Buffer.from("RIFF"), 0x24, 0x00, 0x00, 0x00, ...Buffer.from("WEBPVP8 ")];
const PDF = [...Buffer.from("%PDF-1.7\n")];
const SVG = [...Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>')];

function file(bytes: number[], name: string, type: string, padTo = 0) {
  const content = new Uint8Array(Math.max(bytes.length, padTo));
  content.set(bytes);
  return new File([content], name, { type });
}

function form(fields: Record<string, string | File>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.append(key, value);
  return data;
}

const uploads = (calls: FakeCall[]) => calls.filter((call) => call.op === "upload");

beforeEach(() => {
  vi.clearAllMocks();
  state.session = null;
  state.db = null;
});

describe("type réel d'un fichier (premiers octets)", () => {
  it("reconnaît JPEG, PNG, WebP et PDF", () => {
    expect(detectFileType(new Uint8Array(JPEG))).toBe("image/jpeg");
    expect(detectFileType(new Uint8Array(PNG))).toBe("image/png");
    expect(detectFileType(new Uint8Array(WEBP))).toBe("image/webp");
    expect(detectFileType(new Uint8Array(PDF))).toBe("application/pdf");
  });

  it("refuse un SVG, du HTML ou un fichier trop court, quel que soit son nom", () => {
    expect(detectFileType(new Uint8Array(SVG))).toBeNull();
    expect(detectFileType(new Uint8Array(Buffer.from("<html><body>")))).toBeNull();
    expect(detectFileType(new Uint8Array([0xff, 0xd8]))).toBeNull();
    // « RIFF » d'un fichier audio WAV : pas une image WebP.
    expect(detectFileType(new Uint8Array([...Buffer.from("RIFF"), 0, 0, 0, 0, ...Buffer.from("WAVE")]))).toBeNull();
  });
});

describe("chemins de stockage", () => {
  it("nom aléatoire, conforme à private.is_valid_storage_path()", () => {
    const path = randomStoragePath("galerie", "image/webp", new Date("2026-11-06T12:00:00Z"));
    expect(path).toMatch(/^galerie\/2026\/11\/[0-9a-f]{32}\.webp$/);
    expect(path).toMatch(/^[A-Za-z0-9][A-Za-z0-9/_.-]*$/);
    expect(path.includes("..")).toBe(false);
    expect(randomStoragePath("galerie", "image/webp")).not.toBe(randomStoragePath("galerie", "image/webp"));
  });

  it("petite version : seulement pour le WebP (convention de src/lib/media.ts)", () => {
    expect(smallVariantPath("galerie/2026/11/abc.webp")).toBe("galerie/2026/11/abc-sm.webp");
    expect(smallVariantPath("galerie/2026/11/abc.jpg")).toBeNull();
  });
});

describe("envoi de fichiers", () => {
  it("refuse sans session", async () => {
    useDb();
    const result = await media.uploadMedia(form({ bucket: "public-media", file: file(PNG, "a.png", "image/png") }));
    expect(result).toEqual({ ok: false, error: expect.objectContaining({ code: "UNAUTHENTICATED" }) });
  });

  it("un éditeur envoie une image PNG : type réel, nom aléatoire, fiche dans la médiathèque", async () => {
    const { calls } = useDb((call) => (call.table === "media" ? { data: { id: ID.a, file_name: "Photo réunion.png" } } : {}));
    loginAs("editor");
    const result = await media.uploadMedia(
      form({ bucket: "public-media", folder: "articles", altText: "Réunion des bénévoles", file: file(PNG, "Photo réunion.png", "image/jpeg") }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.path).toMatch(/^articles\/\d{4}\/\d{2}\/[0-9a-f]{32}\.png$/);
    expect(result.data.smallPath).toBeNull();
    const sent = uploads(calls);
    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({ table: "storage:public-media", options: { contentType: "image/png", upsert: false } });
    expect(calls.find((call) => call.table === "media")?.values).toMatchObject({
      bucket: "public-media",
      storage_path: result.data.path,
      file_type: "image/png",
      alt_text: "Réunion des bénévoles",
    });
  });

  it("WebP sans petite version : la grande est copiée sous le nom -sm.webp", async () => {
    const { calls } = useDb((call) => (call.table === "media" ? { data: { id: ID.a, file_name: "a.webp" } } : {}));
    loginAs("editor");
    const result = await media.uploadMedia(form({ bucket: "public-media", file: file(WEBP, "a.webp", "image/webp") }));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const paths = uploads(calls).map((call) => (call.values as { path: string }).path);
    expect(paths).toEqual([result.data.path, result.data.path.replace(/\.webp$/, "-sm.webp")]);
    expect(result.data.smallPath).toBe(paths[1]);
  });

  it("WebP avec petite version : les deux fichiers sont envoyés", async () => {
    const { calls } = useDb((call) => (call.table === "media" ? { data: { id: ID.a, file_name: "a.webp" } } : {}));
    loginAs("editor");
    const result = await media.uploadMedia(
      form({ bucket: "public-media", file: file(WEBP, "a.webp", "image/webp", 2000), small: file(WEBP, "a-sm.webp", "image/webp", 500) }),
    );
    expect(result.ok).toBe(true);
    const bodies = uploads(calls).map((call) => ((call.values as { body: Blob }).body).size);
    expect(bodies).toEqual([2000, 500]);
  });

  it("refuse une petite version qui n'est pas en WebP", async () => {
    const { calls } = useDb();
    loginAs("editor");
    const result = await media.uploadMedia(
      form({ bucket: "public-media", file: file(WEBP, "a.webp", "image/webp"), small: file(JPEG, "a-sm.jpg", "image/jpeg") }),
    );
    expect(result).toEqual({ ok: false, error: expect.objectContaining({ code: "VALIDATION", fieldErrors: { small: expect.any(Array) } }) });
    expect(uploads(calls)).toHaveLength(0);
  });

  it("refuse un faux JPEG (SVG renommé) sans rien envoyer", async () => {
    const { calls } = useDb();
    loginAs("editor");
    const result = await media.uploadMedia(form({ bucket: "public-media", file: file(SVG, "photo.jpg", "image/jpeg") }));
    expect(result).toEqual({
      ok: false,
      error: expect.objectContaining({ code: "VALIDATION", message: expect.stringContaining("JPEG, PNG ou WebP") }),
    });
    expect(calls).toHaveLength(0);
  });

  it("refuse un PDF dans l'espace public et une image de plus de 5 Mo", async () => {
    useDb();
    loginAs("admin");
    expect((await media.uploadMedia(form({ bucket: "public-media", file: file(PDF, "a.pdf", "application/pdf") }))).ok).toBe(false);
    const big = await media.uploadMedia(form({ bucket: "public-media", file: file(JPEG, "a.jpg", "image/jpeg", 5 * 1024 * 1024 + 1) }));
    expect(big).toEqual({ ok: false, error: expect.objectContaining({ message: expect.stringContaining("5 Mo") }) });
  });

  it("refuse un envoi sans fichier", async () => {
    useDb();
    loginAs("editor");
    const result = await media.uploadMedia(form({ bucket: "public-media" }));
    expect(result).toEqual({ ok: false, error: expect.objectContaining({ fieldErrors: { file: ["Choisissez un fichier à envoyer."] } }) });
  });

  it("justificatifs : réservés aux admins, rangés dans justificatifs/, PDF accepté jusqu'à 10 Mo", async () => {
    let fake = useDb();
    loginAs("editor");
    const denied = await media.uploadMedia(form({ bucket: "private-documents", file: file(PDF, "recu.pdf", "application/pdf") }));
    expect(denied).toEqual({ ok: false, error: expect.objectContaining({ code: "FORBIDDEN" }) });
    expect(fake.calls).toHaveLength(0);

    fake = useDb((call) => (call.table === "media" ? { data: { id: ID.a, file_name: "recu.pdf" } } : {}));
    loginAs("admin");
    const result = await media.uploadMedia(
      form({ bucket: "private-documents", folder: "galerie", file: file(PDF, "recu.pdf", "application/pdf", 8 * 1024 * 1024) }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.path).toMatch(/^justificatifs\/\d{4}\/\d{2}\/[0-9a-f]{32}\.pdf$/);
    expect(uploads(fake.calls)).toHaveLength(1);
    expect(uploads(fake.calls)[0].table).toBe("storage:private-documents");
  });

  it("si la fiche ne peut pas être créée, les fichiers envoyés sont retirés", async () => {
    const { calls } = useDb((call) => (call.table === "media" ? { error: { code: "42501", message: "rls" } } : {}));
    loginAs("editor");
    const result = await media.uploadMedia(form({ bucket: "public-media", file: file(WEBP, "a.webp", "image/webp") }));
    expect(result).toEqual({ ok: false, error: expect.objectContaining({ code: "FORBIDDEN" }) });
    const removed = calls.find((call) => call.op === "remove");
    expect((removed?.values as string[]).length).toBe(2);
  });

  it("échec du stockage : message clair, aucune fiche créée", async () => {
    const { calls } = useDb((call) => (call.op === "upload" ? { error: { message: "Bucket not found" } } : {}));
    loginAs("editor");
    const result = await media.uploadMedia(form({ bucket: "public-media", file: file(PNG, "a.png", "image/png") }));
    expect(result).toEqual({ ok: false, error: expect.objectContaining({ code: "INTERNAL", message: expect.not.stringContaining("Bucket") }) });
    expect(calls.some((call) => call.table === "media")).toBe(false);
  });
});

describe("modification et suppression", () => {
  it("un éditeur renseigne le texte alternatif", async () => {
    const { calls } = useDb(() => ({ data: { id: ID.a, alt_text: "Salle de classe rénovée" } }));
    loginAs("editor");
    expect((await media.updateMedia({ id: ID.a, altText: "Salle de classe rénovée" })).ok).toBe(true);
    expect(calls[0]).toMatchObject({ table: "media", op: "update", values: { alt_text: "Salle de classe rénovée" } });
  });

  it("un éditeur ne supprime pas de fichier", async () => {
    useDb();
    loginAs("editor");
    expect(await media.deleteMedia({ id: ID.a })).toEqual({ ok: false, error: expect.objectContaining({ code: "FORBIDDEN" }) });
  });

  it("refuse de supprimer une image encore utilisée", async () => {
    const { calls } = useDb((call) => {
      if (call.table === "media") return { data: { id: ID.a, bucket: "public-media", storage_path: "projets/2026/11/a.webp" } };
      return { count: call.table === "projects" ? 1 : 0 };
    });
    loginAs("admin");
    const result = await media.deleteMedia({ id: ID.a });
    expect(result).toEqual({ ok: false, error: expect.objectContaining({ code: "CONFLICT", message: expect.stringContaining("un projet") }) });
    expect(calls.some((call) => call.op === "delete" || call.op === "remove")).toBe(false);
  });

  it("refuse de supprimer le justificatif d'un don", async () => {
    useDb((call) => {
      if (call.table === "media") return { data: { id: ID.a, bucket: "private-documents", storage_path: "justificatifs/2026/11/a.pdf" } };
      return { count: 1 };
    });
    loginAs("admin");
    expect(await media.deleteMedia({ id: ID.a })).toEqual({
      ok: false,
      error: expect.objectContaining({ message: expect.stringContaining("un don") }),
    });
  });

  it("supprime la fiche puis les deux fichiers d'une image WebP inutilisée", async () => {
    const { calls } = useDb((call) => {
      if (call.table === "media" && call.op === "select") {
        return { data: { id: ID.a, bucket: "public-media", storage_path: "galerie/2026/11/a.webp" } };
      }
      if (call.table === "media" && call.op === "delete") return { data: [{ id: ID.a }] };
      return { count: 0 };
    });
    loginAs("admin");
    expect((await media.deleteMedia({ id: ID.a })).ok).toBe(true);
    const order = calls.filter((call) => call.op === "delete" || call.op === "remove").map((call) => call.op);
    expect(order).toEqual(["delete", "remove"]);
    expect(calls.find((call) => call.op === "remove")?.values).toEqual(["galerie/2026/11/a.webp", "galerie/2026/11/a-sm.webp"]);
  });

  it("adresse temporaire d'un justificatif : seulement pour l'espace privé", async () => {
    useDb((call) =>
      call.op === "signedUrl"
        ? { data: { signedUrl: "https://projet.supabase.co/storage/v1/object/sign/x" } }
        : { data: { id: ID.a, bucket: "private-documents", storage_path: "justificatifs/2026/11/a.pdf" } },
    );
    loginAs("admin");
    expect(await media.getPrivateDocumentUrl({ id: ID.a })).toEqual({
      ok: true,
      data: { url: "https://projet.supabase.co/storage/v1/object/sign/x", expiresIn: 300 },
    });
  });
});
