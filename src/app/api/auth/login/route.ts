import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { verifyPassword } from "@/lib/auth/password";
import { setSessionCookie } from "@/lib/auth/session";
import { z } from "zod";

export const runtime = "nodejs";

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = LoginSchema.parse(await req.json());

    const user = await db.query.users.findFirst({
      where: eq(users.email, body.email.toLowerCase()),
    });

    if (!user || !user.isActive) {
      // Deliberately vague to prevent user enumeration
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const valid = verifyPassword(body.password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const res = NextResponse.json({ ok: true, role: user.role });
    return setSessionCookie(res, {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
  } catch (error) {
    console.error("[auth/login]", error);
    return NextResponse.json({ error: "Login failed." }, { status: 500 });
  }
}
