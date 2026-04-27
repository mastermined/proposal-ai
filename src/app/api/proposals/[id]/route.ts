import { NextRequest, NextResponse } from "next/server";
import { db, proposals } from "@/lib/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

export const runtime = "nodejs";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.delete(proposals).where(eq(proposals.id, id));
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[proposals DELETE]", error);
    return NextResponse.json({ error: "Failed to delete proposal." }, { status: 500 });
  }
}

const PatchSchema = z.object({
  name: z.string().min(1).max(120),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = PatchSchema.parse(await req.json());

    const [updated] = await db
      .update(proposals)
      .set({ name: body.name.trim() })
      .where(eq(proposals.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, name: updated.name });
  } catch (error) {
    console.error("[proposals PATCH]", error);
    return NextResponse.json({ error: "Failed to rename proposal." }, { status: 500 });
  }
}
