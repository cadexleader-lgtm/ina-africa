/**
 * Image du QR code de double authentification renvoyée par Supabase Auth,
 * remise dans un format unique et sûr pour un attribut `src` d'image.
 *
 * Supabase peut renvoyer un SVG brut, ou une adresse `data:` en texte
 * (encodé ou non) ou en base64, parfois précédée d'un en-tête `<?xml …?>`.
 * Tous ces formats sont acceptés ; tout autre contenu est refusé (null).
 */
export function qrCodeDataUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  let raw = value.trim();

  const match = /^data:image\/svg\+xml([^,]*),([\s\S]*)$/i.exec(raw);
  if (match) {
    const params = match[1].toLowerCase();
    const payload = match[2];
    try {
      raw = params.includes(";base64") ? decodeBase64(payload) : safeDecodeUri(payload);
    } catch {
      return null;
    }
  }

  // En-tête XML et commentaires éventuels avant la balise <svg>.
  const svg = raw.replace(/^\s*(<\?xml[^>]*\?>\s*)?(<!--[\s\S]*?-->\s*)*/i, "").trim();
  if (!/^<svg[\s>]/i.test(svg) || !/<\/svg>\s*$/i.test(svg)) return null;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function safeDecodeUri(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function decodeBase64(value: string): string {
  if (typeof atob === "function") {
    const binary = atob(value);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }
  return Buffer.from(value, "base64").toString("utf-8");
}
