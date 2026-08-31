// Fast-fail auth hint for /api/* routes. The actual auth verification happens
// in the route handler via requireSession(). This proxy rejects requests with
// no plausible auth cookie early to save work.
//
// Treat this as a performance hint, not a security boundary. The route handler
// is the security boundary.
//
// Stub mode is gated on JUMPSTART_ALLOW_STUB=1 only (NODE_ENV is not
// sufficient because Vercel preview deployments also run NODE_ENV=production).

import { NextResponse, type NextRequest } from "next/server";

// Routes that bypass the cookie-presence check. /api/health is public.
// /api/cron/* uses CRON_SECRET bearer auth in the route handler instead of
// session cookies, so the proxy must not reject it.
const PUBLIC_API_ROUTES = new Set(["/api/health"]);
const PUBLIC_API_ROUTE_PREFIXES = ["/api/cron"];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  if (
    PUBLIC_API_ROUTES.has(pathname) ||
    PUBLIC_API_ROUTE_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    )
  ) {
    return NextResponse.next();
  }

  const supabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  if (!supabaseConfigured) {
    if (process.env.JUMPSTART_ALLOW_STUB !== "1") {
      return NextResponse.json(
        { error: "Supabase environment is required.", code: "SUPABASE_NOT_CONFIGURED" },
        { status: 500 }
      );
    }
    return NextResponse.next();
  }

  // This cookie-presence check is not authentication. Route handlers call
  // requireSession(), which validates the cookie with Supabase. Supabase SSR
  // can chunk tokens as `sb-...-auth-token.0`, `.1`, and so on.
  const hasAuthCookie = req.cookies
    .getAll()
    .some((cookie) =>
      cookie.name.startsWith("sb-") && /-auth-token(?:\.\d+)?$/.test(cookie.name)
    );

  if (!hasAuthCookie) {
    return NextResponse.json(
      { error: "Authentication required.", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
