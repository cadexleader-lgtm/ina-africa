import { describe, expect, it } from "vitest";

import { qrCodeDataUrl } from "@/lib/auth/qr-code";

const SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><path d="M0 0h1v1H0z"/></svg>';
const EXPECTED = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(SVG)}`;

describe("QR code de double authentification", () => {
  it("accepte un SVG brut", () => {
    expect(qrCodeDataUrl(SVG)).toBe(EXPECTED);
  });

  it("accepte une adresse data: en texte, encodée ou non", () => {
    expect(qrCodeDataUrl(`data:image/svg+xml;utf-8,${SVG}`)).toBe(EXPECTED);
    expect(qrCodeDataUrl(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(SVG)}`)).toBe(EXPECTED);
  });

  it("accepte une adresse data: en base64", () => {
    const base64 = Buffer.from(SVG, "utf-8").toString("base64");
    expect(qrCodeDataUrl(`data:image/svg+xml;base64,${base64}`)).toBe(EXPECTED);
  });

  it("ignore un en-tête XML avant la balise svg", () => {
    expect(qrCodeDataUrl(`<?xml version="1.0" encoding="UTF-8"?>\n${SVG}`)).toBe(EXPECTED);
  });

  it("refuse ce qui n'est pas un SVG complet", () => {
    expect(qrCodeDataUrl("")).toBeNull();
    expect(qrCodeDataUrl(null)).toBeNull();
    expect(qrCodeDataUrl("<html><svg></svg></html>")).toBeNull();
    expect(qrCodeDataUrl("data:image/png;base64,AAAA")).toBeNull();
    expect(qrCodeDataUrl("<svg><path/>")).toBeNull();
  });
});
