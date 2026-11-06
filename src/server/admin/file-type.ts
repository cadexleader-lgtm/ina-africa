import "server-only";

import type { MediaMime } from "@/lib/validation/admin/media";

/*
 * Type RÉEL d'un fichier, lu dans ses premiers octets (« signature »).
 * Le type annoncé par le navigateur et l'extension du nom ne sont jamais
 * crus : un fichier HTML ou SVG renommé en .jpg est refusé.
 */

function startsWith(bytes: Uint8Array, signature: number[], offset = 0): boolean {
  if (bytes.length < offset + signature.length) return false;
  return signature.every((byte, index) => bytes[offset + index] === byte);
}

const ascii = (text: string) => Array.from(text, (char) => char.charCodeAt(0));

export function detectFileType(bytes: Uint8Array): MediaMime | null {
  // JPEG : FF D8 FF
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "image/jpeg";
  // PNG : 89 50 4E 47 0D 0A 1A 0A
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  // WebP : « RIFF » + taille sur 4 octets + « WEBP »
  if (startsWith(bytes, ascii("RIFF")) && startsWith(bytes, ascii("WEBP"), 8)) return "image/webp";
  // PDF : « %PDF- »
  if (startsWith(bytes, ascii("%PDF-"))) return "application/pdf";
  return null;
}
