/**
 * Session helpers — read/write the HTTP-only session cookie.
 * Only used in Node.js server components and API routes (NOT in Edge middleware).
 */
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { signToken, verifyToken, type SessionPayload } from "./jwt";

export const SESSION_COOKIE = "fpt_session";

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 60 * 24 * 7, // 7 days
};

/**
 * Read and VERIFY the session from the cookie store (server components / API routes).
 * Returns null if missing, expired, or tampered.
 */
export async function getSession(): Promise<SessionPayload | null> {
  try {
    const store = await cookies();
    const token = store.get(SESSION_COOKIE)?.value;
    if (!token) return null;
    return await verifyToken(token);
  } catch {
    return null;
  }
}

/** Attach a signed session cookie to a NextResponse */
export async function setSessionCookie(
  res: NextResponse,
  payload: Omit<SessionPayload, "exp">
): Promise<NextResponse> {
  const token = await signToken(payload);
  res.cookies.set(SESSION_COOKIE, token, COOKIE_OPTS);
  return res;
}

/** Clear the session cookie on a NextResponse */
export function clearSessionCookie(res: NextResponse): NextResponse {
  res.cookies.set(SESSION_COOKIE, "", { ...COOKIE_OPTS, maxAge: 0 });
  return res;
}
