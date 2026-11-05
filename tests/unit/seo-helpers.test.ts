import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { JsonLd } from "@/components/seo/JsonLd";
import { absoluteUrl } from "@/lib/site-url";

describe("JsonLd", () => {
  it("échappe « < » pour qu'un texte ne puisse pas fermer la balise script", () => {
    const html = renderToStaticMarkup(JsonLd({ data: { name: "</script><script>alert(1)</script>" } }));
    expect(html).not.toContain("</script><script>");
    expect(html).toContain("\\u003c/script>");
  });
});

describe("absoluteUrl", () => {
  afterEach(() => vi.unstubAllEnvs());
  it("utilise l'adresse du site configurée", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://ina-africa.example/");
    expect(absoluteUrl("/actualites/un-article")).toBe("https://ina-africa.example/actualites/un-article");
  });
  it("revient à localhost sans configuration", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    expect(absoluteUrl("faire-un-don")).toBe("http://localhost:3000/faire-un-don");
  });
});
