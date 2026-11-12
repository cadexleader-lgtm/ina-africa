import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { JsonLd } from "@/components/seo/JsonLd";
import { aboutJsonLd, articleJsonLd, breadcrumbJsonLd, homeJsonLd, organizationJsonLd } from "@/lib/seo/structured-data";
import type { Article } from "@/lib/types/content";

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://ina-africa.example");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://projet.supabase.co");
});
afterEach(() => vi.unstubAllEnvs());

const EMPTY = { address: null, contactEmail: null, contactPhone: null, socialLinks: {} };

describe("organizationJsonLd", () => {
  it("décrit l'ONG avec ses seuls faits établis quand rien n'est renseigné", () => {
    expect(organizationJsonLd(EMPTY)).toEqual({
      "@type": "NGO",
      "@id": "https://ina-africa.example/#organisation",
      name: "INA-AFRICA",
      alternateName: "Initiative pour un Nouvel Avenir en Afrique",
      url: "https://ina-africa.example/",
      logo: "https://ina-africa.example/brand/ina-africa-logo.png",
      description: expect.stringContaining("ONG béninoise fondée en 2017"),
      foundingDate: "2017",
      address: { "@type": "PostalAddress", addressCountry: "BJ" },
      areaServed: { "@type": "Country", name: "Bénin" },
      knowsAbout: expect.arrayContaining(["Éducation", "Autonomisation des femmes"]),
      potentialAction: { "@type": "DonateAction", name: "Faire un don", target: "https://ina-africa.example/faire-un-don" },
    });
  });

  it("n'ajoute que les coordonnées et réseaux renseignés, jamais de note ni d'avis", () => {
    const data = organizationJsonLd({
      address: "Quartier X\nCotonou",
      contactEmail: "contact@exemple.org",
      contactPhone: null,
      socialLinks: { facebook: "https://www.facebook.com/exemple", x: "http://non-securise.example" },
    });
    expect(data.email).toBe("contact@exemple.org");
    expect(data).not.toHaveProperty("telephone");
    expect(data.sameAs).toEqual(["https://www.facebook.com/exemple"]);
    expect(data.address).toEqual({ "@type": "PostalAddress", streetAddress: "Quartier X, Cotonou", addressCountry: "BJ" });
    for (const key of ["aggregateRating", "review", "numberOfEmployees"]) {
      expect(data).not.toHaveProperty(key);
    }
  });
});

describe("aboutJsonLd", () => {
  it("relie les membres publiés à l'ONG, avec leur portrait s'il existe", () => {
    const data = aboutJsonLd([
      { fullName: "Awa Test", position: "Présidente", photo: { path: "equipe/awa.webp", alt: "Portrait" } },
      { fullName: "Koffi Test", position: "Trésorier", photo: null },
    ]);
    const ngo = (data["@graph"] as Record<string, unknown>[])[1] as { member: Record<string, unknown>[] };
    expect(ngo.member[0]).toMatchObject({ "@type": "Person", name: "Awa Test", jobTitle: "Présidente", image: expect.stringContaining("equipe/awa.webp") });
    expect(ngo.member[1]).not.toHaveProperty("image");
  });
});

describe("homeJsonLd", () => {
  it("produit un JSON valide avec l'organisation et le site", () => {
    const html = renderToStaticMarkup(JsonLd({ data: homeJsonLd(EMPTY) }));
    const json = JSON.parse(html.replace(/^<script[^>]*>/, "").replace(/<\/script>$/, ""));
    expect(json["@context"]).toBe("https://schema.org");
    expect(json["@graph"].map((item: { "@type": string }) => item["@type"])).toEqual(["NGO", "WebSite"]);
  });
});

const ARTICLE: Article = {
  id: "1",
  slug: "exemple-article",
  title: "Exemple de titre d'article",
  excerpt: "Exemple d'extrait.",
  publishedAt: "2026-11-01T10:00:00Z",
  updatedAt: "2026-11-03T10:00:00Z",
  cover: { path: "articles/couverture.webp", alt: "Exemple" },
  category: { slug: "exemple", name: "Exemple de catégorie" },
  content: { type: "doc", content: [] },
  contentText: "mot ".repeat(420),
  seoTitle: null,
  seoDescription: null,
};

describe("articleJsonLd", () => {
  it("décrit l'article publié par INA-AFRICA avec sa vraie couverture et ses dates", () => {
    const data = articleJsonLd(ARTICLE);
    expect(data).toMatchObject({
      "@type": "Article",
      headline: "Exemple de titre d'article",
      description: "Exemple d'extrait.",
      image: ["https://projet.supabase.co/storage/v1/object/public/public-media/articles/couverture.webp"],
      datePublished: "2026-11-01T10:00:00Z",
      dateModified: "2026-11-03T10:00:00Z",
      url: "https://ina-africa.example/actualites/exemple-article",
      articleSection: "Exemple de catégorie",
      wordCount: 420,
    });
    expect(data.author).toMatchObject({ "@type": "NGO", name: "INA-AFRICA" });
  });

  it("omet l'image et la rubrique quand elles n'existent pas", () => {
    const data = articleJsonLd({ ...ARTICLE, cover: null, category: null, excerpt: null, seoDescription: "Description SEO." });
    expect(data).not.toHaveProperty("image");
    expect(data).not.toHaveProperty("articleSection");
    expect(data.description).toBe("Description SEO.");
  });

  it("limite le titre à 110 caractères", () => {
    const data = articleJsonLd({ ...ARTICLE, title: "Titre ".repeat(40) });
    expect(String(data.headline).length).toBeLessThanOrEqual(110);
  });
});

describe("breadcrumbJsonLd", () => {
  it("numérote les étapes avec des adresses absolues", () => {
    expect(breadcrumbJsonLd([{ name: "Accueil", path: "/" }, { name: "Actualités", path: "/actualites" }])).toEqual({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Accueil", item: "https://ina-africa.example/" },
        { "@type": "ListItem", position: 2, name: "Actualités", item: "https://ina-africa.example/actualites" },
      ],
    });
  });
});
