import { describe, expect, it } from "vitest";

import { socialLinks, telHref, whatsappHref } from "@/components/site/social";
import { formatDate, isoDate } from "@/lib/format";
import { isActivePath } from "@/lib/nav";
import { pageHref, pageWindow } from "@/lib/pagination";
import { videoEmbedUrl, youtubeId } from "@/lib/video";

describe("pageHref (pagination qui conserve les filtres)", () => {
  it("garde les autres paramètres et remplace la page", () => {
    expect(pageHref("/actualites", 3, { categorie: "sante", q: "école", page: "1" })).toBe(
      "/actualites?categorie=sante&q=%C3%A9cole&page=3",
    );
  });
  it("la page 1 n'a pas de paramètre (adresse canonique)", () => {
    expect(pageHref("/projets", 1, { domaine: "education", page: "4" })).toBe("/projets?domaine=education");
    expect(pageHref("/projets", 1)).toBe("/projets");
  });
  it("conserve les paramètres répétés et ignore les vides", () => {
    expect(pageHref("/x", 2, { tag: ["a", "b"], vide: "", absent: undefined })).toBe("/x?tag=a&tag=b&page=2");
  });
});

describe("pageWindow", () => {
  it("affiche les extrémités, la page courante et ses voisines", () => {
    expect(pageWindow(5, 12)).toEqual([1, null, 4, 5, 6, null, 12]);
  });
  it("ne met pas de « … » pour une seule page manquante", () => {
    expect(pageWindow(3, 8)).toEqual([1, 2, 3, 4, null, 8]);
  });
  it("une seule page", () => {
    expect(pageWindow(1, 1)).toEqual([1]);
  });
});

describe("vidéos", () => {
  it("reconnaît les adresses YouTube courantes", () => {
    expect(youtubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(youtubeId("https://youtu.be/dQw4w9WgXcQ?t=10")).toBe("dQw4w9WgXcQ");
    expect(youtubeId("https://www.youtube.com/shorts/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(youtubeId("https://m.youtube.com/embed/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });
  it("refuse les adresses non YouTube ou mal formées", () => {
    expect(youtubeId("https://exemple.com/watch?v=dQw4w9WgXcQ")).toBeNull();
    expect(youtubeId("https://www.youtube.com/watch?v=court")).toBeNull();
  });
  it("YouTube passe par youtube-nocookie.com avec le début de lecture", () => {
    expect(videoEmbedUrl("youtube", "https://youtu.be/dQw4w9WgXcQ?t=1m30s")).toBe(
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0&start=90",
    );
  });
  it("Facebook utilise le lecteur officiel, et seulement pour une adresse Facebook", () => {
    expect(videoEmbedUrl("facebook", "https://www.facebook.com/ina/videos/123")).toBe(
      "https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Fina%2Fvideos%2F123&show_text=false&autoplay=true",
    );
    expect(videoEmbedUrl("facebook", "https://evil.example/facebook.com/x")).toBeNull();
  });
});

describe("isActivePath (lien actif de la navigation)", () => {
  it("l'accueil n'est actif que sur /", () => {
    expect(isActivePath("/", "/")).toBe(true);
    expect(isActivePath("/projets", "/")).toBe(false);
  });
  it("une rubrique est active sur ses sous-pages, pas sur un préfixe voisin", () => {
    expect(isActivePath("/projets/puits-village", "/projets")).toBe(true);
    expect(isActivePath("/projets-anciens", "/projets")).toBe(false);
    expect(isActivePath(null, "/projets")).toBe(false);
  });
});

describe("formatDate", () => {
  it("date en français, fuseau du Bénin", () => {
    expect(formatDate("2026-11-05T23:30:00Z")).toBe("6 novembre 2026");
    expect(isoDate("2026-11-05T10:00:00Z")).toBe("2026-11-05");
  });
  it("valeur absente ou invalide → null", () => {
    expect(formatDate(null)).toBeNull();
    expect(formatDate("pas une date")).toBeNull();
  });
});

describe("réseaux et coordonnées", () => {
  it("seuls les réseaux en https sont gardés, dans un ordre stable, avec leur nom", () => {
    expect(socialLinks({ youtube: "https://youtube.com/@ina", facebook: "https://facebook.com/ina", x: "http://x.com/ina" })).toEqual([
      { key: "facebook", label: "Facebook", href: "https://facebook.com/ina" },
      { key: "youtube", label: "YouTube", href: "https://youtube.com/@ina" },
    ]);
  });
  it("liens téléphone et WhatsApp", () => {
    expect(telHref("+229 01 23 45 67")).toBe("tel:+22901234567");
    expect(whatsappHref("+229 01 23 45 67")).toBe("https://wa.me/22901234567");
    expect(whatsappHref("12")).toBeNull();
  });
});
