import { NextRequest, NextResponse } from "next/server";

// Cookie name — must match session.ts
const SESSION_COOKIE = "fpt_session";

// Public routes — no auth required
const PUBLIC = ["/login", "/setup", "/api/auth/", "/api/setup", "/_next", "/favicon"];

// Admin-only route prefixes (enforced again in the page/API itself via getSession)
const ADMIN_ONLY = ["/admin", "/api/admin"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always allow public paths
  if (PUBLIC.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Read the session cookie — just check it exists and looks like a JWT
  // Real cryptographic verification happens in getSession() on the Node.js side.
  // Edge crypto is unreliable across Next.js versions; keeping middleware sync is safest.
  const token = req.cookies.get(SESSION_COOKIE)?.value ?? "";
  const looksLikeJWT = token.split(".").length === 3 && token.length > 20;

  if (!looksLikeJWT) {
    const url = new URL("/login", req.url);
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  // For admin routes, we peek at the role stored in the JWT payload (middle segment).
  // We do NOT verify the signature here — we just read the unverified claim for routing.
  // The actual admin API/page verifies via getSession() before doing any real work.
  if (ADMIN_ONLY.some((p) => pathname.startsWith(p))) {
    try {
      const payloadB64 = token.split(".")[1];
      // Add padding so atob works
      const padded = payloadB64 + "====".slice(0, (4 - (payloadB64.length % 4)) % 4);
      const payload = JSON.parse(atob(padded.replace(/-/g, "+").replace(/_/g, "/")));
      if (payload?.role !== "admin") {
        return NextResponse.redirect(new URL("/proposals", req.url));
      }
    } catch {
      return NextResponse.redirect(new URL("/proposals", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
