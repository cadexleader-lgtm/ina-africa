import { describe, expect, it } from "vitest";

import { checkFormToken, issueFormToken, MAX_TOKEN_AGE_MS, MIN_FILL_MS } from "@/server/security/form-token";
import { clientIpFrom, hashIp } from "@/server/security/ip";
import { generateLinkToken, generateMerchantReference, hashLinkToken, sameHash } from "@/server/security/tokens";
import { MERCHANT_REFERENCE, NEWSLETTER_TOKEN } from "@/lib/validation/forms";

const SECRET = "secret-de-test-0123456789abcdef0123456789";
const NOW = 1_800_000_000_000;

describe("horodatage signé", () => {
  const token = issueFormToken("contact", SECRET, NOW);

  it("accepte un envoi entre 3 s et 2 h", () => {
    expect(checkFormToken(token, "contact", SECRET, NOW + MIN_FILL_MS + 1)).toBe("ok");
    expect(checkFormToken(token, "contact", SECRET, NOW + MAX_TOKEN_AGE_MS - 1)).toBe("ok");
  });

  it("refuse un envoi trop rapide (< 3 s)", () => {
    expect(checkFormToken(token, "contact", SECRET, NOW + 1500)).toBe("too_fast");
  });

  it("refuse un jeton expiré (> 2 h)", () => {
    expect(checkFormToken(token, "contact", SECRET, NOW + MAX_TOKEN_AGE_MS + 1)).toBe("expired");
  });

  it("refuse un jeton falsifié, d'un autre formulaire ou signé avec un autre secret", () => {
    const [time, signature] = token.split(".");
    const olderTime = (NOW - 60_000).toString(36);
    expect(checkFormToken(`${olderTime}.${signature}`, "contact", SECRET, NOW + 5000)).toBe("invalid");
    expect(checkFormToken(`${time}.${signature.slice(0, -1)}A`, "contact", SECRET, NOW + 5000)).not.toBe("ok");
    expect(checkFormToken(token, "volunteer", SECRET, NOW + 5000)).toBe("invalid");
    expect(checkFormToken(token, "contact", `${SECRET}-autre`, NOW + 5000)).toBe("invalid");
    expect(checkFormToken("n'importe quoi", "contact", SECRET, NOW + 5000)).toBe("invalid");
    expect(checkFormToken("", "contact", SECRET, NOW + 5000)).toBe("missing");
    expect(checkFormToken(null, "contact", SECRET, NOW + 5000)).toBe("missing");
  });

  it("refuse un horodatage dans le futur", () => {
    const future = issueFormToken("contact", SECRET, NOW + 10 * 60_000);
    expect(checkFormToken(future, "contact", SECRET, NOW)).toBe("invalid");
  });
});

describe("empreinte d'adresse IP", () => {
  it("est stable, ne contient pas l'adresse et dépend du secret", () => {
    const hash = hashIp("41.138.89.10", SECRET);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hashIp("41.138.89.10", SECRET)).toBe(hash);
    expect(hash).not.toContain("41.138.89.10");
    expect(hashIp("41.138.89.11", SECRET)).not.toBe(hash);
    expect(hashIp("41.138.89.10", `${SECRET}-autre`)).not.toBe(hash);
  });

  it("lit cf-connecting-ip, puis la 1re valeur de x-forwarded-for, puis x-real-ip", () => {
    const headers = (values: Record<string, string>) => new Headers(values);
    expect(clientIpFrom(headers({ "cf-connecting-ip": "41.1.1.1", "x-forwarded-for": "10.0.0.1" }))).toBe("41.1.1.1");
    expect(clientIpFrom(headers({ "x-forwarded-for": "41.2.2.2, 10.0.0.1", "x-real-ip": "10.0.0.2" }))).toBe("41.2.2.2");
    expect(clientIpFrom(headers({ "x-real-ip": "2001:DB8::1" }))).toBe("2001:db8::1");
    expect(clientIpFrom(headers({ "cf-connecting-ip": "<script>", "x-real-ip": "41.3.3.3" }))).toBe("41.3.3.3");
    expect(clientIpFrom(headers({}))).toBeNull();
  });
});

describe("jetons de la newsletter et références de paiement", () => {
  it("jeton de lien aléatoire (43 caractères), seule son empreinte sha256 est stockée", () => {
    const token = generateLinkToken();
    expect(token).toMatch(NEWSLETTER_TOKEN);
    expect(generateLinkToken()).not.toBe(token);
    const hash = hashLinkToken(token);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).not.toContain(token);
    expect(sameHash(hash, hashLinkToken(token))).toBe(true);
    expect(sameHash(hash, hashLinkToken(generateLinkToken()))).toBe(false);
  });

  it("référence de paiement aléatoire d'au moins 24 caractères", () => {
    const reference = generateMerchantReference();
    expect(reference.length).toBeGreaterThanOrEqual(24);
    expect(reference).toMatch(MERCHANT_REFERENCE);
    expect(generateMerchantReference()).not.toBe(reference);
  });
});
