import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { loginAs, state, useDb as installFakeDb, type FakeHandler } from "./admin-test-utils";

vi.mock("next/cache", () => ({ updateTag: vi.fn(), revalidateTag: vi.fn(), cacheTag: vi.fn(), cacheLife: vi.fn() }));
vi.mock("@/server/auth/guard", async () => (await import("./admin-test-utils")).guardModule);
vi.mock("@/server/supabase/server", async () => (await import("./admin-test-utils")).sessionModule);

const { requestProofUpload, finalizeProofUpload } = await import("@/server/actions/admin/proof-upload");
const { readHead, isProofPath } = await import("@/server/admin/upload");

const PDF = new Uint8Array([...Buffer.from("%PDF-1.7\n%âãÏÓ\n1 0 obj")]);
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0x0d, 0x49, 0x48, 0x44, 0x52]);
const HTML = new Uint8Array(Buffer.from("<!doctype html><script>alert(1)</script>"));

const PATH_PDF = "justificatifs/2026/11/0123456789abcdef0123456789abcdef.pdf";

type StorageCall = { bucket: string; op: string; args: unknown[] };

/**
 * Faux client de session avec un faux stockage : fichier « déposé » à un
 * chemin (contenu et taille), adresses signées, suppression.
 */
function setup(options: {
  handler?: FakeHandler;
  stored?: { bytes: Uint8Array; size?: number } | null;
  signError?: boolean;
} = {}) {
  const fake = installFakeDb(options.handler);
  const storageCalls: StorageCall[] = [];
  const stored = options.stored === undefined ? null : options.stored;
  (fake.db.storage as { from: (bucket: string) => unknown }).from = (bucket: string) => ({
    createSignedUploadUrl: async (path: string) => {
      storageCalls.push({ bucket, op: "signUpload", args: [path] });
      if (options.signError) return { data: null, error: { message: "refusé" } };
      return {
        data: { signedUrl: `https://example.supabase.co/storage/v1/object/upload/sign/${bucket}/${path}?token=t`, token: "t", path },
        error: null,
      };
    },
    info: async (path: string) => {
      storageCalls.push({ bucket, op: "info", args: [path] });
      if (!stored) return { data: null, error: { message: "Object not found", statusCode: "404" } };
      return { data: { size: stored.size ?? stored.bytes.length, name: path }, error: null };
    },
    createSignedUrl: async (path: string, expiresIn: number) => {
      storageCalls.push({ bucket, op: "signedUrl", args: [path, expiresIn] });
      return { data: { signedUrl: `https://example.supabase.co/storage/v1/object/sign/${bucket}/${path}?token=r` }, error: null };
    },
    remove: async (paths: string[]) => {
      storageCalls.push({ bucket, op: "remove", args: [paths] });
      return { data: [], error: null };
    },
  });
  const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
    void init;
    return new Response(stored ? (stored.bytes as BodyInit) : null, {
      status: 206,
      headers: { "content-range": `bytes 0-15/${stored?.size ?? stored?.bytes.length ?? 0}` },
    });
  });
  vi.stubGlobal("fetch", fetchMock);
  return { ...fake, storageCalls, fetchMock };
}

beforeEach(() => {
  vi.clearAllMocks();
  state.session = null;
  state.db = null;
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("envoi signé d'un justificatif : demande d'adresse", () => {
  const request = { fileName: "recu-mtn.pdf", fileType: "application/pdf", fileSize: 8 * 1024 * 1024 };

  it("refuse sans session et sans rôle admin, sans toucher au stockage", async () => {
    const { storageCalls } = setup();
    const anonymous = await requestProofUpload(request);
    expect(anonymous.ok).toBe(false);
    if (!anonymous.ok) expect(anonymous.error.code).toBe("UNAUTHENTICATED");

    loginAs("editor");
    const editor = await requestProofUpload(request);
    expect(editor.ok).toBe(false);
    if (!editor.ok) expect(editor.error.code).toBe("FORBIDDEN");
    expect(storageCalls).toHaveLength(0);
  });

  it("donne une adresse signée pour un chemin ALÉATOIRE dans private-documents/justificatifs", async () => {
    loginAs("admin");
    const { storageCalls } = setup();
    const first = await requestProofUpload(request);
    const second = await requestProofUpload(request);
    expect(first.ok && second.ok).toBe(true);
    if (!first.ok || !second.ok) return;

    expect(first.data.path).toMatch(/^justificatifs\/\d{4}\/\d{2}\/[0-9a-f]{32}\.pdf$/);
    expect(isProofPath(first.data.path)).toBe(true);
    expect(second.data.path).not.toBe(first.data.path);
    expect(first.data.contentType).toBe("application/pdf");
    expect(first.data.signedUrl).toContain("token=");
    // Le nom choisi par la personne n'entre jamais dans le chemin.
    expect(first.data.path).not.toContain("recu");
    expect(storageCalls.map((call) => [call.bucket, call.op])).toEqual([
      ["private-documents", "signUpload"],
      ["private-documents", "signUpload"],
    ]);
  });

  it("l'extension du chemin suit le type annoncé (image)", async () => {
    loginAs("super_admin");
    setup();
    const result = await requestProofUpload({ fileName: "capture.png", fileType: "image/png", fileSize: 1000 });
    expect(result.ok && result.data.path.endsWith(".png")).toBe(true);
  });

  it("refuse un type non accepté ou un fichier de plus de 10 Mo, avant tout envoi", async () => {
    loginAs("admin");
    const { storageCalls } = setup();
    const html = await requestProofUpload({ fileName: "page.html", fileType: "text/html", fileSize: 100 });
    expect(html.ok).toBe(false);
    if (!html.ok) expect(html.error.fieldErrors?.fileType?.[0]).toMatch(/Format non accepté/);

    const svg = await requestProofUpload({ fileName: "logo.svg", fileType: "image/svg+xml", fileSize: 100 });
    expect(svg.ok).toBe(false);

    const big = await requestProofUpload({ fileName: "scan.pdf", fileType: "application/pdf", fileSize: 10 * 1024 * 1024 + 1 });
    expect(big.ok).toBe(false);
    if (!big.ok) expect(big.error.fieldErrors?.fileSize?.[0]).toMatch(/10 Mo/);
    expect(storageCalls).toHaveLength(0);
  });

  it("erreur du stockage → message clair, sans détail technique", async () => {
    loginAs("admin");
    setup({ signError: true });
    const result = await requestProofUpload(request);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("INTERNAL");
      expect(result.error.message).not.toContain("refusé");
    }
  });
});

describe("envoi signé d'un justificatif : finalisation", () => {
  it("refuse sans rôle admin", async () => {
    loginAs("editor");
    const { storageCalls } = setup({ stored: { bytes: PDF } });
    const result = await finalizeProofUpload({ path: PATH_PDF, fileName: "recu.pdf" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("FORBIDDEN");
    expect(storageCalls).toHaveLength(0);
  });

  it("refuse un chemin qui n'a pas été produit par le serveur (autre dossier, remontée…)", async () => {
    loginAs("admin");
    const { storageCalls } = setup({ stored: { bytes: PDF } });
    for (const path of [
      "divers/2026/11/0123456789abcdef0123456789abcdef.pdf",
      "justificatifs/../articles/x.pdf",
      "justificatifs/2026/11/mon-recu.pdf",
      "justificatifs/2026/11/0123456789abcdef0123456789abcdef.html",
    ]) {
      const result = await finalizeProofUpload({ path, fileName: "recu.pdf" });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe("VALIDATION");
    }
    expect(storageCalls).toHaveLength(0);
  });

  it("un FAUX PDF (HTML renommé) est refusé et le fichier SUPPRIMÉ, sans fiche dans la médiathèque", async () => {
    loginAs("admin");
    const { storageCalls, calls, fetchMock } = setup({ stored: { bytes: HTML } });
    const result = await finalizeProofUpload({ path: PATH_PDF, fileName: "recu.pdf" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("VALIDATION");
      expect(result.error.fieldErrors?.file?.[0]).toMatch(/ne correspond pas/);
    }
    expect(storageCalls).toContainEqual({ bucket: "private-documents", op: "remove", args: [[PATH_PDF]] });
    expect(calls.some((call) => call.table === "media" && call.op === "insert")).toBe(false);
    // Seuls les premiers octets sont demandés.
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(new Headers(init.headers).get("range")).toBe("bytes=0-15");
  });

  it("une image PNG déposée sous un nom .pdf est refusée et supprimée", async () => {
    loginAs("admin");
    const { storageCalls } = setup({ stored: { bytes: PNG } });
    const result = await finalizeProofUpload({ path: PATH_PDF, fileName: "recu.pdf" });
    expect(result.ok).toBe(false);
    expect(storageCalls.some((call) => call.op === "remove")).toBe(true);
  });

  it("un fichier de plus de 10 Mo est refusé et supprimé", async () => {
    loginAs("admin");
    const { storageCalls } = setup({ stored: { bytes: PDF, size: 10 * 1024 * 1024 + 1 } });
    const result = await finalizeProofUpload({ path: PATH_PDF, fileName: "recu.pdf" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toMatch(/10 Mo/);
    expect(storageCalls.some((call) => call.op === "remove")).toBe(true);
  });

  it("un vrai PDF est accepté : fiche créée avec le type RÉEL et la taille stockée", async () => {
    loginAs("admin");
    const handler: FakeHandler = (call) => {
      if (call.table === "media" && call.op === "insert") {
        const values = call.values as Record<string, unknown>;
        return {
          data: {
            id: "44444444-4444-4444-8444-444444444444",
            storage_path: values.storage_path,
            file_name: values.file_name,
            file_type: values.file_type,
            file_size: values.file_size,
          },
        };
      }
      return { data: null };
    };
    const { storageCalls, calls } = setup({ handler, stored: { bytes: PDF, size: 7_340_032 } });
    const result = await finalizeProofUpload({ path: PATH_PDF, fileName: "Reçu MTN 06-11.pdf" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toMatchObject({ path: PATH_PDF, fileType: "application/pdf", fileSize: 7_340_032 });
    }
    const insert = calls.find((call) => call.table === "media" && call.op === "insert");
    expect(insert?.values).toMatchObject({
      bucket: "private-documents",
      storage_path: PATH_PDF,
      file_type: "application/pdf",
      file_size: 7_340_032,
      file_name: "Reçu MTN 06-11.pdf",
    });
    expect(storageCalls.some((call) => call.op === "remove")).toBe(false);
  });

  it("finaliser deux fois le même fichier renvoie la fiche existante (double clic)", async () => {
    loginAs("admin");
    const existing = {
      id: "55555555-5555-4555-8555-555555555555",
      storage_path: PATH_PDF,
      file_name: "recu.pdf",
      file_type: "application/pdf",
      file_size: 1234,
    };
    const { storageCalls, fetchMock } = setup({
      handler: (call) => (call.table === "media" && call.op === "select" ? { data: existing } : undefined),
      stored: { bytes: HTML },
    });
    const result = await finalizeProofUpload({ path: PATH_PDF, fileName: "recu.pdf" });
    expect(result.ok && result.data.id).toBe(existing.id);
    expect(storageCalls).toHaveLength(0);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fichier jamais reçu → message clair, rien n'est supprimé", async () => {
    loginAs("admin");
    const { storageCalls } = setup({ stored: null });
    const result = await finalizeProofUpload({ path: PATH_PDF, fileName: "recu.pdf" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toMatch(/n'a pas été reçu/);
    expect(storageCalls.some((call) => call.op === "remove")).toBe(false);
  });
});

describe("lecture des premiers octets", () => {
  it("demande une plage et s'arrête au nombre d'octets voulu, même si le serveur envoie tout", async () => {
    const big = new Uint8Array(100_000).fill(0x41);
    big.set(PDF);
    const fetchImpl = vi.fn(
      async () => new Response(big as BodyInit, { status: 200, headers: { "content-length": String(big.length) } }),
    );
    const head = await readHead("https://example.supabase.co/x", 16, fetchImpl as unknown as typeof fetch);
    expect(head.bytes).toHaveLength(16);
    expect(Buffer.from(head.bytes.subarray(0, 5)).toString()).toBe("%PDF-");
    expect(head.totalSize).toBe(100_000);
  });

  it("lit la taille totale dans Content-Range et refuse une réponse en erreur", async () => {
    const partial = vi.fn(
      async () => new Response(PDF.subarray(0, 16) as BodyInit, { status: 206, headers: { "content-range": "bytes 0-15/2048" } }),
    );
    expect((await readHead("https://x", 16, partial as unknown as typeof fetch)).totalSize).toBe(2048);

    const missing = vi.fn(async () => new Response("introuvable", { status: 404 }));
    await expect(readHead("https://x", 16, missing as unknown as typeof fetch)).rejects.toThrow();
  });
});
