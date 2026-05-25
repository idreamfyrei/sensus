import { type NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

/**
 * Optimistic auth gate.
 *
 * Runs on every matched request in the Edge runtime. We only check whether
 * the session cookie is *present* — we don't validate it against the DB
 * here, because:
 *   1. Edge runtime can't connect to Postgres (no pg driver in Edge).
 *   2. tRPC's `createContext` re-validates with `auth.api.getSession()` on
 *      every server call, so any tampering or expiry surfaces there.
 *
 * The cookie-presence check is enough for a UX redirect: if you don't have
 * a cookie at all, you're definitely not signed in. If you have a stale
 * cookie that's been revoked, you'll hit /dashboard, the page will try to
 * load data, and the api will return UNAUTHORIZED — handled in 3.5.
 *
 * Pattern: "optimistic in the middleware, authoritative on the server."
 */
export function middleware(req: NextRequest) {
  const sessionCookie = getSessionCookie(req);

  if (!sessionCookie) {
    const url = req.nextUrl.clone();
    url.pathname = "/sign-in";
    url.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

/**
 * Only run on protected paths. Public routes (/, /sign-in, /sign-up, /f/*,
 * /api/auth/*) bypass entirely.
 *
 * Next.js matcher syntax: `/dashboard/:path*` matches `/dashboard` and
 * everything under it.
 */
export const config = {
  matcher: ["/dashboard/:path*"],
};
