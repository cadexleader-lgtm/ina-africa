import { FACEBOOK_URL, YOUTUBE_URL } from "@/lib/validation/rich-text";

/**
 * Adresses de lecture des vidéos YouTube et Facebook (seuls fournisseurs
 * autorisés, même règle que la base et le contenu riche).
 * YouTube passe par youtube-nocookie.com (aucun cookie avant la lecture).
 */

export type VideoProvider = "youtube" | "facebook";

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

/** Identifiant d'une vidéo YouTube, ou null si l'adresse n'est pas reconnue. */
export function youtubeId(url: string): string | null {
  if (!YOUTUBE_URL.test(url)) return null;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  let candidate: string | null = null;
  if (parsed.hostname.endsWith("youtu.be")) {
    candidate = parsed.pathname.split("/")[1] ?? null;
  } else if (parsed.pathname === "/watch") {
    candidate = parsed.searchParams.get("v");
  } else {
    const match = parsed.pathname.match(/^\/(embed|shorts|live|v)\/([^/?#]+)/);
    candidate = match?.[2] ?? null;
  }
  return candidate && YOUTUBE_ID.test(candidate) ? candidate : null;
}

/** Début de lecture en secondes (`t=90`, `t=1m30s`, `start=90`), si présent. */
function youtubeStart(url: string): number | null {
  try {
    const params = new URL(url).searchParams;
    const raw = params.get("start") ?? params.get("t");
    if (!raw) return null;
    if (/^\d+$/.test(raw)) return Number(raw);
    const match = raw.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
    if (!match) return null;
    const seconds = Number(match[1] ?? 0) * 3600 + Number(match[2] ?? 0) * 60 + Number(match[3] ?? 0);
    return seconds > 0 ? seconds : null;
  } catch {
    return null;
  }
}

/**
 * Adresse à charger dans l'iframe, au clic seulement (lecture automatique
 * puisque la personne vient de demander la lecture). null si refusée.
 */
export function videoEmbedUrl(provider: VideoProvider, url: string): string | null {
  if (provider === "youtube") {
    const id = youtubeId(url);
    if (!id) return null;
    const params = new URLSearchParams({ autoplay: "1", rel: "0" });
    const start = youtubeStart(url);
    if (start) params.set("start", String(start));
    return `https://www.youtube-nocookie.com/embed/${id}?${params.toString()}`;
  }
  if (!FACEBOOK_URL.test(url)) return null;
  const params = new URLSearchParams({ href: url, show_text: "false", autoplay: "true" });
  return `https://www.facebook.com/plugins/video.php?${params.toString()}`;
}
