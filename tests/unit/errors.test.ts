import { describe, expect, it, vi } from "vitest";

import { APP_ERROR_HINT, AppError, fromDatabaseError, runAction } from "@/server/errors";

describe("fromDatabaseError", () => {
  it("affiche tel quel un message levé par nos fonctions SQL (indice ina-africa)", () => {
    const error = fromDatabaseError({
      code: "23505",
      message: "Cette opération (même mode de réception et même référence) est déjà enregistrée.",
      hint: APP_ERROR_HINT,
    });
    expect(error.code).toBe("CONFLICT");
    expect(error.message).toBe("Cette opération (même mode de réception et même référence) est déjà enregistrée.");
  });

  it("ne montre jamais un message technique de Postgres", () => {
    const error = fromDatabaseError({ code: "42501", message: "permission denied for table donations" });
    expect(error.code).toBe("FORBIDDEN");
    expect(error.message).toBe("Vous n'avez pas les droits pour cette action.");
  });

  it("traduit une contrainte connue en message clair", () => {
    const error = fromDatabaseError({
      code: "23505",
      message: 'duplicate key value violates unique constraint "articles_slug_key"',
    });
    expect(error.code).toBe("CONFLICT");
    expect(error.message).toBe("Cette adresse est déjà utilisée par un autre article.");
  });

  it("traduit l'oubli du texte alternatif avant publication", () => {
    const error = fromDatabaseError({
      code: "23514",
      message: 'new row for relation "articles" violates check constraint "articles_published_cover_has_alt"',
    });
    expect(error.code).toBe("VALIDATION");
    expect(error.message).toContain("texte alternatif");
  });

  it("renvoie un message générique pour une erreur inconnue", () => {
    const error = fromDatabaseError({ code: "XX000", message: "internal error" });
    expect(error.code).toBe("INTERNAL");
    expect(error.message).not.toContain("internal");
  });

  it("n'affiche pas un message en anglais même s'il commence par une majuscule", () => {
    const error = fromDatabaseError({ code: "PGRST116", message: "JSON object requested, multiple (or no) rows returned" });
    expect(error.code).toBe("NOT_FOUND");
    expect(error.message).toBe("Élément introuvable.");
  });
});

describe("runAction", () => {
  it("renvoie les données quand tout va bien", async () => {
    await expect(runAction(async () => 42)).resolves.toEqual({ ok: true, data: 42 });
  });

  it("renvoie une AppError sous forme de résultat", async () => {
    const result = await runAction(async () => {
      throw new AppError("VALIDATION", "Montant invalide", { amount: ["Minimum 500 FCFA"] });
    });
    expect(result).toEqual({
      ok: false,
      error: { code: "VALIDATION", message: "Montant invalide", fieldErrors: { amount: ["Minimum 500 FCFA"] } },
    });
  });

  it("masque une erreur inattendue et la journalise côté serveur", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const result = await runAction(async () => {
      throw new Error("connexion perdue avec la base 10.0.0.3");
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("INTERNAL");
      expect(result.error.message).not.toContain("10.0.0.3");
    }
    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });
});
