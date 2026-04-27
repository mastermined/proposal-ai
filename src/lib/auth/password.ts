/**
 * Password hashing using Node.js built-in crypto (PBKDF2-SHA512)
 * Only used in API routes (Node.js runtime), never in Edge middleware.
 */
import { pbkdf2Sync, randomBytes, timingSafeEqual } from "crypto";

const ITERATIONS = 100_000;
const KEY_LEN = 64;
const DIGEST = "sha512";

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(password, salt, ITERATIONS, KEY_LEN, DIGEST).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [salt, hash] = stored.split(":");
    const derived = pbkdf2Sync(password, salt, ITERATIONS, KEY_LEN, DIGEST);
    const stored_buf = Buffer.from(hash, "hex");
    if (derived.length !== stored_buf.length) return false;
    return timingSafeEqual(derived, stored_buf);
  } catch {
    return false;
  }
}
