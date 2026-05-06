// Fast-fail auth hint for /api/* routes. The actual auth verification happens
// in the route handler via requireSession(). This middleware just rejects
// requests with no plausible auth cookie early to save work.
//
// Treat this as a perf hint, NOT a security boundary. The route handler is
// the security boundary.
//
// Stub mode is gated on JUMPSTART_ALLOW_STUB=1 only (NODE_ENV is not
// sufficient because Vercel preview deployments also run NODE_ENV=production).

import { NextResponse, type NextRequest } from "next/server";

// Routes that bypass the cookie-presence check. /api/health is public.
// /api/cron/* uses CRON_SECRET bearer auth in the route handler instead of
// session cookies, so the middleware must not 401 it (Vercel Cron requests
// carry an Authorization Bearer header, not a Supabase auth cookie).
const PUBLIC_API_ROUTES = ["/api/health", "/api/cron"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  if (PUBLIC_API_ROUTES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const supabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  // Stub-mode allowlist requires explicit opt-in.
  if (!supabaseConfigured) {
    if (process.env.JUMPSTART_ALLOW_STUB !== "1") {
      return NextResponse.json(
        { error: "Supabase environment is required.", code: "SUPABASE_NOT_CONFIGURED" },
        { status: 500 }
      );
    }
    return NextResponse.next();
  }

  // Fast cookie presence check. This is NOT real auth; the route handler
  // calls requireSession() which validates the cookie with Supabase.
  // Supabase SSR can chunk auth cookies as `sb-...-auth-token.0`,
  // `sb-...-auth-token.1`, so the suffix check accepts both `-auth-token`
  // and `-auth-token.<n>`. Closes Codex challenge P2 #8.
  const hasAuthCookie = req.cookies
    .getAll()
    .some((c) => c.name.startsWith("sb-") && /-auth-token(?:\.\d+)?$/.test(c.name));

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
