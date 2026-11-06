import { afterEach, describe, expect, it, vi } from "vitest";

import {
  alternateTones,
  breadcrumbJsonLd,
  excerpt,
  firstParam,
  hasActiveFilter,
  initials,
  paragraphs,
  parsePage,
  parseProjectFilters,
  projectFilterParams,
  projectPeriod,
  projectStatusLabel,
  projectsHref,
  splitTerm,
  viewerAnnouncement,
  wrapIndex,
} from "@/components/pages/page-helpers";
import { pageHref } from "@/lib/pagination";
import type { GalleryItem } from "@/lib/types/content";

const AREAS = ["education", "innovation-sociale"];

describe("parsePage (paramètre ?page=)", () => {
  it("accepte un entier positif", () => {
    expect(parsePage("3")).toBe(3);
    expect(parsePage(["2", "9"])).toBe(2);
  });
  it("ramène tout le reste à la page 1", () => {
    for (const value of [undefined, "", " ", "abc", "0", "-2", "1.5", "2e3", "9999999", "<script>"]) {
      expect(parsePage(value)).toBe(1);
    }
  });
});

describe("firstParam", () => {
  it("prend la première valeur, sans espaces ; vide → undefined", () => {
    expect(firstParam(["a", "b"])).toBe("a");
    expect(firstParam("  x ")).toBe("x");
    expect(firstParam("   ")).toBeUndefined();
    expect(firstParam(undefined)).toBeUndefined();
  });
});

describe("parseProjectFilters (/projets?domaine=&statut=&page=)", () => {
  it("garde un domaine actif et un état connu", () => {
    expect(parseProjectFilters({ domaine: "education", statut: "ongoing", page: "2" }, AREAS)).toEqual({
      area: "education",
      status: "ongoing",
      page: 2,
    });
  });
  it("ignore un domaine inconnu ou non publié", () => {
    expect(parseProjectFilters({ domaine: "inconnu" }, AREAS).area).toBeUndefined();
    expect(parseProjectFilters({ domaine: "education" }, []).area).toBeUndefined();
  });
  it("ignore un état inconnu, y compris « archived » (jamais listé)", () => {
    for (const statut of ["archived", "draft", "ONGOING", "", "ongoing,completed"]) {
      expect(parseProjectFilters({ statut }, AREAS).status).toBeUndefined();
    }
  });
  it("ne garde que la première valeur d'un paramètre répété", () => {
    expect(parseProjectFilters({ domaine: ["innovation-sociale", "education"], statut: ["planned", "x"] }, AREAS)).toEqual({
      area: "innovation-sociale",
      status: "planned",
      page: 1,
    });
  });
  it("aucun paramètre → aucun filtre", () => {
    const filters = parseProjectFilters({}, AREAS);
    expect(filters).toEqual({ area: undefined, status: undefined, page: 1 });
    expect(hasActiveFilter(filters)).toBe(false);
  });
});

describe("liens de la liste des projets", () => {
  it("projectsHref construit l'adresse sans page (retour à la page 1)", () => {
    expect(projectsHref({})).toBe("/projets");
    expect(projectsHref({ area: "education" })).toBe("/projets?domaine=education");
    expect(projectsHref({ area: "education", status: "completed" })).toBe("/projets?domaine=education&statut=completed");
    expect(projectsHref({ area: null, status: "planned" })).toBe("/projets?statut=planned");
  });
  it("la pagination conserve seulement les filtres VALIDES", () => {
    const filters = parseProjectFilters({ domaine: "inconnu", statut: "ongoing", page: "2", autre: "x" }, AREAS);
    expect(pageHref("/projets", 3, projectFilterParams(filters))).toBe("/projets?statut=ongoing&page=3");
    expect(pageHref("/projets", 1, projectFilterParams(filters))).toBe("/projets?statut=ongoing");
  });
});

describe("libellés et période des projets", () => {
  it("états : Prévu, En cours, Terminé ; archivé → aucun libellé", () => {
    expect(projectStatusLabel("planned")).toBe("Prévu");
    expect(projectStatusLabel("ongoing")).toBe("En cours");
    expect(projectStatusLabel("completed")).toBe("Terminé");
    expect(projectStatusLabel("archived")).toBeNull();
  });
  it("période en toutes lettres", () => {
    expect(projectPeriod("2026-03-05", "2026-09-30", "ongoing")).toBe("Du 5 mars 2026 au 30 septembre 2026");
    expect(projectPeriod("2026-03-05", null, "ongoing")).toBe("Depuis le 5 mars 2026");
    expect(projectPeriod("2026-03-05", null, "planned")).toBe("À partir du 5 mars 2026");
    expect(projectPeriod(null, "2026-09-30", "completed")).toBe("Jusqu'au 30 septembre 2026");
    expect(projectPeriod("2026-03-05", "2026-03-05", "completed")).toBe("5 mars 2026");
    expect(projectPeriod(null, null, "ongoing")).toBeNull();
    expect(projectPeriod("pas-une-date", null, "ongoing")).toBeNull();
  });
});

describe("textes de l'administration", () => {
  it("paragraphs : une ligne vide sépare deux paragraphes", () => {
    expect(paragraphs("Premier.\n\nSecond\nsuite.\n\n\n  \nTroisième.")).toEqual(["Premier.", "Second\nsuite.", "Troisième."]);
    expect(paragraphs(null)).toEqual([]);
    expect(paragraphs("  \n ")).toEqual([]);
  });
  it("splitTerm : « Terme : explication » ou « Terme — explication »", () => {
    expect(splitTerm("Solidarité : agir ensemble")).toEqual({ term: "Solidarité", description: "agir ensemble" });
    expect(splitTerm("Solidarité : agir ensemble")).toEqual({ term: "Solidarité", description: "agir ensemble" });
    expect(splitTerm("Engagement — tenir parole")).toEqual({ term: "Engagement", description: "tenir parole" });
    expect(splitTerm("Innovation")).toEqual({ term: "Innovation", description: null });
    // Un trait d'union dans un mot n'est pas un séparateur.
    expect(splitTerm("Auto-organisation")).toEqual({ term: "Auto-organisation", description: null });
  });
  it("initials : deux lettres au plus, accents conservés", () => {
    expect(initials("Awa Dossou-Yovo")).toBe("AY");
    expect(initials("élodie")).toBe("É");
    expect(initials("  Jean  Paul  Kossi ")).toBe("JK");
    expect(initials("")).toBe("");
  });
  it("excerpt : coupé sur un mot avec « … », jamais plus long que la limite", () => {
    const long = "Face aux défis socio-économiques persistants que rencontrent les communautés africaines, notamment dans les domaines de l'éducation, de la santé et de l'inclusion.";
    const result = excerpt(long, 80);
    expect(result).not.toBeNull();
    expect(result!.length).toBeLessThanOrEqual(80);
    expect(result!.endsWith("…")).toBe(true);
    expect(excerpt("  Court\n texte. ")).toBe("Court texte.");
    expect(excerpt(null)).toBeNull();
    expect(excerpt("   ")).toBeNull();
  });
});

describe("alternateTones (fonds des sections)", () => {
  it("alterne blanc / ivoire après l'en-tête ivoire et repart sur blanc après un fond bleu", () => {
    expect(alternateTones(["a", "vision", "b", "c", "d"], ["vision"])).toEqual({
      a: "white",
      vision: "brand",
      b: "white",
      c: "ivory",
      d: "white",
    });
  });
  it("sans section : rien", () => {
    expect(alternateTones([])).toEqual({});
  });
});

describe("visionneuse", () => {
  it("wrapIndex boucle dans les deux sens", () => {
    expect(wrapIndex(0, 5)).toBe(0);
    expect(wrapIndex(5, 5)).toBe(0);
    expect(wrapIndex(-1, 5)).toBe(4);
    expect(wrapIndex(12, 5)).toBe(2);
    expect(wrapIndex(3, 0)).toBe(0);
  });
  it("annonce la position et le texte alternatif (ou la légende)", () => {
    const photo: GalleryItem = { id: "1", type: "photo", image: { path: "a.webp", alt: "Une salle" }, caption: "Légende", takenOn: null };
    const video: GalleryItem = { id: "2", type: "video", provider: "youtube", url: "https://youtu.be/x", poster: null, caption: null, takenOn: null };
    expect(viewerAnnouncement(photo, 2, 12)).toBe("Photo 3 sur 12 : Une salle");
    expect(viewerAnnouncement({ ...photo, image: { path: "a.webp", alt: "" } }, 0, 1)).toBe("Photo 1 sur 1 : Légende");
    expect(viewerAnnouncement(video, 1, 2)).toBe("Vidéo 2 sur 2");
  });
});

describe("breadcrumbJsonLd", () => {
  afterEach(() => vi.unstubAllEnvs());
  it("produit une BreadcrumbList avec des adresses absolues", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://ina-africa.example");
    expect(
      breadcrumbJsonLd([
        { label: "Accueil", href: "/" },
        { label: "Nos projets", href: "/projets" },
        { label: "Un projet", href: "/projets/un-projet" },
      ]),
    ).toEqual({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Accueil", item: "https://ina-africa.example/" },
        { "@type": "ListItem", position: 2, name: "Nos projets", item: "https://ina-africa.example/projets" },
        { "@type": "ListItem", position: 3, name: "Un projet", item: "https://ina-africa.example/projets/un-projet" },
      ],
    });
  });
});
