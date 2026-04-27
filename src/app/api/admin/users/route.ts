import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { hashPassword } from "@/lib/auth/password";
import { getSession } from "@/lib/auth/session";
import { desc } from "drizzle-orm";
import { z } from "zod";

export const runtime = "nodejs";

/** GET /api/admin/users — list all users */
export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const all = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt));

    return NextResponse.json(all);
  } catch (error) {
    console.error("[admin/users GET]", error);
    return NextResponse.json({ error: "Failed to load users." }, { status: 500 });
  }
}

const CreateUserSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["admin", "user"]).default("user"),
});

/** POST /api/admin/users — create a user */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const body = CreateUserSchema.parse(await req.json());

    const [user] = await db
      .insert(users)
      .values({
        email: body.email.toLowerCase(),
        name: body.name,
        passwordHash: hashPassword(body.password),
        role: body.role,
        isActive: true,
        createdBy: session.sub,
      })
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt,
      });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error("[admin/users POST]", error);
    const msg = error instanceof Error ? error.message : "Failed to create user.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
