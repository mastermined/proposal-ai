import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sections } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

export const runtime = "nodejs";

const BodySchema = z.object({
  sectionId: z.string().uuid(),
  content: z.string(),
});

// Silent auto-save — just persists content, no feedback capture, no Hermes
export async function POST(req: NextRequest) {
  try {
    const { sectionId, content } = BodySchema.parse(await req.json());

    await db
      .update(sections)
      .set({ currentContent: content, status: "in_review" })
      .where(eq(sections.id, sectionId));

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
