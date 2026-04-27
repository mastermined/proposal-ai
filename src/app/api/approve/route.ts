import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sections, proposals } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { runHermesAnalysis } from "@/lib/agents/hermes";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 30;

const BodySchema = z.object({ sectionId: z.string().uuid() });

export async function POST(req: NextRequest) {
  try {
    const { sectionId } = BodySchema.parse(await req.json());

    const section = await db.query.sections.findFirst({
      where: eq(sections.id, sectionId),
      with: { proposal: true },
    });
    if (!section) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    // Approve the section
    await db
      .update(sections)
      .set({ status: "approved", approvedAt: new Date() })
      .where(eq(sections.id, sectionId));

    const nextSection = section.sectionNumber + 1;
    const isComplete = nextSection > 10;

    // Advance the proposal's active section
    await db
      .update(proposals)
      .set({
        activeSection: isComplete ? 10 : nextSection,
        status: isComplete ? "done" : "reviewing",
      })
      .where(eq(proposals.id, section.proposalId));

    // Run Hermes asynchronously (fire and forget — don't block the response)
    runHermesAnalysis(sectionId).catch((err) =>
      console.error("[Hermes] Analysis failed:", err)
    );

    return NextResponse.json({
      approved: true,
      nextSection: isComplete ? null : nextSection,
      isComplete,
    });
  } catch (error) {
    console.error("[approve]", error);
    return NextResponse.json(
      { error: "Approval failed. Please try again." },
      { status: 500 }
    );
  }
}
