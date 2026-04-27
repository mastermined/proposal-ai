/**
 * First-run setup: creates the initial admin account.
 * Only works when zero users exist in the database.
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { hashPassword } from "@/lib/auth/password";
import { setSessionCookie } from "@/lib/auth/session";
import { z } from "zod";
import { sql } from "drizzle-orm";

export const runtime = "nodejs";

const SetupSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8),
});

/** Check if setup is needed (GET) */
export async function GET() {
  try {
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(users);
    return NextResponse.json({ needsSetup: count === 0 });
  } catch {
    // Table may not exist yet
    return NextResponse.json({ needsSetup: true });
  }
}

/** Create the first admin (POST) */
export async function POST(req: NextRequest) {
  try {
    // Guard: only allowed when no users exist
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(users);
    if (count > 0) {
      return NextResponse.json({ error: "Setup already completed." }, { status: 403 });
    }

    const body = SetupSchema.parse(await req.json());
    const passwordHash = hashPassword(body.password);

    const [admin] = await db
      .insert(users)
      .values({
        email: body.email.toLowerCase(),
        name: body.name,
        passwordHash,
        role: "admin",
        isActive: true,
      })
      .returning();

    const res = NextResponse.json({ ok: true });
    return setSessionCookie(res, {
      sub: admin.id,
      email: admin.email,
      name: admin.name,
      role: "admin",
    });
  } catch (error) {
    console.error("[setup]", error);
    const msg = error instanceof Error ? error.message : "Setup failed.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
