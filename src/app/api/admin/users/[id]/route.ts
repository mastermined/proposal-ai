import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { z } from "zod";

export const runtime = "nodejs";

const PatchSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  role: z.enum(["admin", "user"]).optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(8).optional(),
});

/** PATCH /api/admin/users/[id] */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { id } = await params;
    const body = PatchSchema.parse(await req.json());

    if (session.sub === id && (body.isActive === false || body.role === "user")) {
      return NextResponse.json(
        { error: "You cannot deactivate or demote your own account." },
        { status: 400 }
      );
    }

    const updates: Partial<typeof users.$inferInsert> = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.role !== undefined) updates.role = body.role;
    if (body.isActive !== undefined) updates.isActive = body.isActive;
    if (body.password !== undefined) {
      const { hashPassword } = await import("@/lib/auth/password");
      updates.passwordHash = hashPassword(body.password);
    }

    const [updated] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        isActive: users.isActive,
      });

    if (!updated) return NextResponse.json({ error: "User not found." }, { status: 404 });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("[admin/users PATCH]", error);
    return NextResponse.json({ error: "Failed to update user." }, { status: 500 });
  }
}

/** DELETE /api/admin/users/[id] */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { id } = await params;
    if (session.sub === id) {
      return NextResponse.json({ error: "You cannot delete your own account." }, { status: 400 });
    }

    await db.delete(users).where(eq(users.id, id));
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[admin/users DELETE]", error);
    return NextResponse.json({ error: "Failed to delete user." }, { status: 500 });
  }
}
