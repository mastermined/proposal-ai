/**
 * Zero-dependency JWT using Web Crypto API (works in Edge + Node.js 18+)
 * Algorithm: HS256 (HMAC-SHA-256)
 */

export interface SessionPayload {
  sub: string;        // userId
  email: string;
  name: string;
  role: "admin" | "user";
  exp: number;        // Unix epoch seconds
}

// ── helpers ──────────────────────────────────────────────────────────────────

function b64url(buf: ArrayBuffer): string {
  // Use Array.from to avoid spread-operator stack overflow on large buffers
  return btoa(Array.from(new Uint8Array(buf), (b) => String.fromCharCode(b)).join(""))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

function b64urlDecode(s: string): ArrayBuffer {
  // Restore base64url → standard base64 (replace chars + re-add padding)
  const base64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "====".slice(0, (4 - (base64.length % 4)) % 4);
  const bin = atob(padded);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}

function textToB64url(s: string): string {
  const bytes = new TextEncoder().encode(s);
  return b64url(bytes.buffer as ArrayBuffer);
}

// ── key cache ────────────────────────────────────────────────────────────────

let _key: CryptoKey | null = null;

async function getKey(): Promise<CryptoKey> {
  if (_key) return _key;
  const raw = new TextEncoder().encode(
    process.env.AUTH_SECRET ?? "dev-secret-change-in-production-32+"
  );
  _key = await crypto.subtle.importKey(
    "raw",
    raw,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
  return _key;
}

// ── public API ────────────────────────────────────────────────────────────────

const HEADER = textToB64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
const SESSION_TTL = 60 * 60 * 24 * 7; // 7 days

export async function signToken(payload: Omit<SessionPayload, "exp">): Promise<string> {
  const full: SessionPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL,
  };
  const body = textToB64url(JSON.stringify(full));
  const key = await getKey();
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${HEADER}.${body}`)
  );
  return `${HEADER}.${body}.${b64url(sig)}`;
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, body, sig] = parts;
    const key = await getKey();
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      b64urlDecode(sig),
      new TextEncoder().encode(`${header}.${body}`)
    );
    if (!valid) return null;
    const payload = JSON.parse(
      new TextDecoder().decode(b64urlDecode(body))
    ) as SessionPayload;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
