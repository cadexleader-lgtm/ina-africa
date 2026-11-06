import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { hasPublicSupabaseEnv } from "@/lib/public-env";
import { ADMIN_LOGIN_PATH, isPublicAdminPath, withSuite } from "@/lib/validation/auth";

/**
 * Proxy (ex-middleware, Next.js 16) de l'ADMINISTRATION uniquement
 * (voir `config.matcher` : jamais exécuté sur le site public).
 *
 *  1. rafraîchit la session Supabase (cookies) avant le rendu ;
 *  2. redirige toute personne non connectée qui demande /admin/** vers
 *     /admin/connexion?suite=<chemin> ;
 *  3. transmet le chemin demandé aux pages (en-tête x-ina-admin-path).
 *
 * C'est un contrôle « optimiste » : chaque page (requireAdminPage) et chaque
 * Server Action (authorize) revérifient la session et le rôle, et la base
 * refuse tout ce que le rôle ne permet pas (RLS).
 */

/** Doit rester identique à ADMIN_PATH_HEADER (src/server/auth/guard.ts, non importable ici : server-only). */
const ADMIN_PATH_HEADER = "x-ina-admin-path";

function loginRedirect(request: NextRequest): NextResponse {
  const { pathname, search } = request.nextUrl;
  const url = new URL(withSuite(ADMIN_LOGIN_PATH, `${pathname}${search}`), request.url);
  return NextResponse.redirect(url);
}

function noIndex(response: NextResponse): NextResponse {
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");
  const needsSession = isAdmin && !isPublicAdminPath(pathname);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete(ADMIN_PATH_HEADER);
  if (isAdmin) requestHeaders.set(ADMIN_PATH_HEADER, `${pathname}${search}`);

  // Supabase pas encore configuré : la page de connexion l'explique.
  if (!hasPublicSupabaseEnv()) {
    return noIndex(needsSession ? loginRedirect(request) : NextResponse.next({ request: { headers: requestHeaders } }));
  }

  const pendingCookies: { name: string; value: string; options: CookieOptions }[] = [];
  const pendingHeaders: Record<string, string> = {};

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          for (const { name, value, options } of cookiesToSet) {
            // Visible des pages rendues pendant CETTE requête…
            request.cookies.set(name, value);
            // … et renvoyé au navigateur avec la réponse.
            pendingCookies.push({ name, value, options });
          }
          Object.assign(pendingHeaders, headers);
        },
      },
    },
  );

  // getClaims() rafraîchit la session si besoin puis VÉRIFIE le jeton
  // (signature ou Supabase Auth). Ne rien appeler entre la création du client et cet appel.
  let signedIn = false;
  try {
    const { data } = await supabase.auth.getClaims();
    signedIn = Boolean(data?.claims?.sub);
  } catch (error) {
    console.error("[ina-africa] proxy : vérification de session impossible", error);
  }

  // Cookies éventuellement rafraîchis : à jour dans les en-têtes transmis aux pages.
  const cookieHeader = request.headers.get("cookie");
  if (cookieHeader !== null) requestHeaders.set("cookie", cookieHeader);

  const response = needsSession && !signedIn ? loginRedirect(request) : NextResponse.next({ request: { headers: requestHeaders } });
  for (const { name, value, options } of pendingCookies) {
    response.cookies.set(name, value, options);
  }
  for (const [key, value] of Object.entries(pendingHeaders)) {
    response.headers.set(key, value);
  }
  return noIndex(response);
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/auth/:path*"],
};
