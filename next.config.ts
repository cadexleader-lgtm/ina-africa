import type { NextConfig } from "next";

import { isSiteIndexable } from "./src/lib/seo/indexing";
import { resolveSiteOrigin } from "./src/lib/site-url";

/*
 * Configuration Next.js, lue au BUILD : changer une variable d'environnement
 * demande un nouveau déploiement. Hébergement prévu : Vercel (docs/deploiement.md).
 */

const isDev = process.env.NODE_ENV === "development";

/** Origine du projet Supabase (https://<ref>.supabase.co), ou null tant qu'il n'est pas configuré. */
function supabaseOrigin(): string | null {
  try {
    const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");
    return url.protocol === "https:" || url.protocol === "http:" ? url.origin : null;
  } catch {
    return null;
  }
}

const supabase = supabaseOrigin();

/**
 * Adresse du site figée au build : NEXT_PUBLIC_SITE_URL, sinon l'adresse
 * fournie par Vercel (premier déploiement, prévisualisations), sinon
 * localhost. Voir src/lib/site-url.ts.
 */
const siteUrl = resolveSiteOrigin(process.env);

/**
 * Indexation : SITE_INDEXABLE=true (src/lib/seo/indexing.ts) ET déploiement
 * de production. Une prévisualisation Vercel n'est JAMAIS indexée, même si
 * SITE_INDEXABLE=true y a été recopié par erreur.
 */
const indexable = isSiteIndexable() && (!process.env.VERCEL_ENV || process.env.VERCEL_ENV === "production");

// ---------------------------------------------------------------------------
// Content-Security-Policy SANS nonce : un nonce imposerait le rendu dynamique
// de toutes les pages (fin du prérendu et du rendu partiel). D'où
// 'unsafe-inline' pour les scripts : Next.js insère les données de la page
// dans des scripts en ligne. Aucun script externe n'est autorisé en dehors de
// la liste ci-dessous.
//
// Ce que le site charge réellement :
//  - Cloudflare Turnstile (anti-robot, seulement si sa clé est configurée) :
//    script + iframe challenges.cloudflare.com (src/components/forms/SpamFields.tsx) ;
//  - vidéos (galerie, articles), au clic seulement : iframes
//    www.youtube-nocookie.com et www.facebook.com (src/lib/video.ts) ;
//  - images et API du projet Supabase (https + wss pour le temps réel).
//
//  - paiement KKiaPay (formulaire de don, seulement quand le visiteur paie) :
//    script https://cdn.kkiapay.me/k.js + iframe https://widget-v3.kkiapay.me.
//    La vérification des paiements se fait côté serveur (aucun connect-src).
//    Si CinetPay est ajouté un jour : script-src https://cdn.cinetpay.com ;
//    frame-src https://checkout.cinetpay.com ; form-action https://checkout.cinetpay.com.
// ---------------------------------------------------------------------------

const TURNSTILE = "https://challenges.cloudflare.com";
const VIDEO_FRAMES = ["https://www.youtube-nocookie.com", "https://www.facebook.com"];
const KKIAPAY_SCRIPT = "https://cdn.kkiapay.me";
const KKIAPAY_FRAME = "https://widget-v3.kkiapay.me";

const supabaseHttp = supabase ? [supabase] : [];
const supabaseWs = supabase ? [supabase.replace(/^http/, "ws")] : [];

const csp: Record<string, string[]> = {
  "default-src": ["'self'"],
  "script-src": ["'self'", "'unsafe-inline'", ...(isDev ? ["'unsafe-eval'"] : []), TURNSTILE, KKIAPAY_SCRIPT],
  "style-src": ["'self'", "'unsafe-inline'"],
  "img-src": ["'self'", "data:", "blob:", ...supabaseHttp],
  "font-src": ["'self'"],
  "connect-src": ["'self'", ...supabaseHttp, ...supabaseWs],
  "media-src": ["'self'", ...supabaseHttp],
  "frame-src": [...VIDEO_FRAMES, TURNSTILE, KKIAPAY_FRAME],
  "worker-src": ["'self'", "blob:"],
  "manifest-src": ["'self'"],
  "object-src": ["'none'"],
  "base-uri": ["'self'"],
  "form-action": ["'self'"],
  "frame-ancestors": ["'none'"],
  "upgrade-insecure-requests": [],
};

const contentSecurityPolicy = Object.entries(csp)
  .map(([directive, sources]) => [directive, ...sources].join(" "))
  .join("; ");

/** Fonctions du navigateur inutiles au site : refusées à la page et à ses iframes. */
const permissionsPolicy = [
  "camera=()",
  "microphone=()",
  "geolocation=()",
  "payment=()",
  "usb=()",
  "serial=()",
  "hid=()",
  "midi=()",
  "magnetometer=()",
  "display-capture=()",
  "browsing-topics=()",
].join(", ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  // Deux ans, sans includeSubDomains ni preload : les sous-domaines du futur
  // nom de domaine ne sont pas forcément tous en HTTPS (à revoir au lancement).
  { key: "Strict-Transport-Security", value: "max-age=63072000" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: permissionsPolicy },
  { key: "X-Frame-Options", value: "DENY" },
];

const noindex = { key: "X-Robots-Tag", value: "noindex, nofollow" };

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,

  // Envoi des photos par l'administration (Server Actions, 1 Mo par défaut).
  // 4 Mo : sous la limite de 4,5 Mo des fonctions Vercel. Les photos sont
  // converties en WebP dans le navigateur avant l'envoi ; les justificatifs
  // plus lourds (jusqu'à 10 Mo) passeront par un envoi signé direct vers
  // Supabase Storage (interface d'administration, à venir).
  experimental: {
    serverActions: { bodySizeLimit: "4mb" },
  },

  // Même adresse du site côté serveur et navigateur (repli Vercel compris).
  env: { NEXT_PUBLIC_SITE_URL: siteUrl },

  images: {
    formats: ["image/avif", "image/webp"],
    // Seules les images publiques du stockage Supabase (bucket public-media).
    remotePatterns: supabase ? [new URL(`${supabase}/storage/v1/object/public/public-media/**`)] : [],
  },

  async headers() {
    return [
      { source: "/:path*", headers: indexable ? securityHeaders : [...securityHeaders, noindex] },
      // Jamais indexées, même une fois le site ouvert à Google.
      ...(indexable
        ? [
            { source: "/admin/:path*", headers: [noindex] },
            { source: "/styleguide", headers: [noindex] },
          ]
        : []),
    ];
  },
};

export default nextConfig;
