/**
 * Outils des tests de l'administration : faux client Supabase (enregistre
 * chaque requête et renvoie la réponse choisie par le test) et faux module
 * d'authentification (contrat de src/server/auth/guard.ts).
 *
 * Utilisation dans un fichier de test :
 *   vi.mock("@/server/auth/guard", async () => (await import("./admin-test-utils")).guardModule);
 *   vi.mock("@/server/supabase/server", async () => (await import("./admin-test-utils")).sessionModule);
 */
import { vi } from "vitest";

import type { AdminSession, AppRole } from "@/server/auth/guard";
import { fail, ok } from "@/server/errors";

// ---------------------------------------------------------------------------
// Faux client Supabase
// ---------------------------------------------------------------------------

export type FakeCall = {
  /** Table, « rpc:<fonction> » ou « storage:<espace> ». */
  table: string;
  op: "select" | "insert" | "update" | "delete" | "upsert" | "rpc" | "upload" | "remove" | "signedUrl";
  values?: unknown;
  columns?: string;
  options?: unknown;
  /** Filtres et modificateurs dans l'ordre : ["eq", "id", "…"], ["order", "created_at", {…}]… */
  filters: unknown[][];
  single?: "single" | "maybeSingle";
};

export type FakeResponse = { data?: unknown; error?: unknown; count?: number | null } | undefined;

export type FakeHandler = (call: FakeCall) => FakeResponse;

const FILTERS = ["eq", "neq", "gt", "gte", "lt", "lte", "ilike", "like", "in", "is", "or", "order", "range", "limit", "contains"];

export function createFakeDb(handler: FakeHandler = () => undefined) {
  const calls: FakeCall[] = [];

  function respond(call: FakeCall) {
    calls.push(call);
    const response = handler(call) ?? {};
    return { data: response.data ?? null, error: response.error ?? null, count: response.count ?? null };
  }

  function builder(table: string) {
    const call: FakeCall = { table, op: "select", filters: [] };
    let opChosen = false;
    const chain: Record<string, unknown> = {
      select(columns?: string, options?: unknown) {
        if (!opChosen) {
          call.op = "select";
          opChosen = true;
          call.options = options;
        }
        call.columns = columns;
        return chain;
      },
      insert(values: unknown) {
        Object.assign(call, { op: "insert", values });
        opChosen = true;
        return chain;
      },
      update(values: unknown) {
        Object.assign(call, { op: "update", values });
        opChosen = true;
        return chain;
      },
      upsert(values: unknown, options?: unknown) {
        Object.assign(call, { op: "upsert", values, options });
        opChosen = true;
        return chain;
      },
      delete() {
        call.op = "delete";
        opChosen = true;
        return chain;
      },
      single() {
        call.single = "single";
        return chain;
      },
      maybeSingle() {
        call.single = "maybeSingle";
        return chain;
      },
      then(resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) {
        return Promise.resolve(respond(call)).then(resolve, reject);
      },
    };
    for (const name of FILTERS) {
      chain[name] = (...args: unknown[]) => {
        call.filters.push([name, ...args]);
        return chain;
      };
    }
    return chain;
  }

  const db = {
    from: (table: string) => builder(table),
    rpc: (name: string, args?: unknown) => Promise.resolve(respond({ table: `rpc:${name}`, op: "rpc", values: args, filters: [] })),
    storage: {
      from: (bucket: string) => ({
        upload: (path: string, body: unknown, options?: unknown) =>
          Promise.resolve(respond({ table: `storage:${bucket}`, op: "upload", values: { path, body }, options, filters: [] })),
        remove: (paths: string[]) =>
          Promise.resolve(respond({ table: `storage:${bucket}`, op: "remove", values: paths, filters: [] })),
        createSignedUrl: (path: string, expiresIn: number) =>
          Promise.resolve(respond({ table: `storage:${bucket}`, op: "signedUrl", values: { path, expiresIn }, filters: [] })),
      }),
    },
  };

  return { db, calls };
}

/** Valeur d'un filtre `eq` enregistré. */
export function eqValue(call: FakeCall, column: string): unknown {
  return call.filters.find((filter) => filter[0] === "eq" && filter[1] === column)?.[2];
}

// ---------------------------------------------------------------------------
// Faux contrat d'authentification et faux client de session
// ---------------------------------------------------------------------------

const RANK: Record<AppRole, number> = { editor: 1, admin: 2, super_admin: 3 };

export const state: { session: AdminSession | null; db: ReturnType<typeof createFakeDb>["db"] | null } = {
  session: null,
  db: null,
};

export const USER_ID = "7a3c1a9e-4f2b-4c8e-9d1a-2b3c4d5e6f70";

export function loginAs(role: AppRole | null, userId = USER_ID) {
  state.session = role
    ? { userId, email: "membre@ina-africa.org", fullName: "Membre de l'équipe", role, mfaVerified: role !== "editor" }
    : null;
}

export function useDb(handler: FakeHandler = () => undefined) {
  const fake = createFakeDb(handler);
  state.db = fake.db;
  return fake;
}

function roleAtLeast(role: AppRole, min: AppRole) {
  return RANK[role] >= RANK[min];
}

export const guardModule = {
  roleAtLeast,
  getAdminSession: vi.fn(async () => state.session),
  requireAdminPage: vi.fn(async (min: AppRole) => {
    if (!state.session || !roleAtLeast(state.session.role, min)) throw new Error("REDIRECT");
    return state.session;
  }),
  authorize: vi.fn(async (min: AppRole) => {
    if (!state.session) return fail("UNAUTHENTICATED", "Connectez-vous pour continuer.");
    if (!roleAtLeast(state.session.role, min)) return fail("FORBIDDEN", "Vous n'avez pas les droits pour cette action.");
    return ok(state.session);
  }),
};

export const sessionModule = {
  createSessionClient: vi.fn(async () => {
    if (!state.db) throw new Error("Aucun faux client : appelez useDb() dans le test.");
    return state.db;
  }),
};

/** Identifiants valides (UUID v4) pour les tests. */
export const ID = {
  a: "11111111-1111-4111-8111-111111111111",
  b: "22222222-2222-4222-8222-222222222222",
  c: "33333333-3333-4333-8333-333333333333",
};

/** Petit document de l'éditeur visuel. */
export const DOC = { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Bonjour" }] }] };
