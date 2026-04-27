import { NextRequest, NextResponse } from "next/server";
import { db, proposals } from "@/lib/db";
import { sections } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { extractRFPContext } from "@/lib/agents/clawbot";
import { SECTION_NAMES } from "@/lib/prompts/sections";
import { getActiveProviderInfo } from "@/lib/llm/router";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 60;

const BodySchema = z.object({ proposalId: z.string().uuid() });

export async function POST(req: NextRequest) {
  try {
    const body = BodySchema.parse(await req.json());

    const proposal = await db.query.proposals.findFirst({
      where: eq(proposals.id, body.proposalId),
    });
    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    // Get active provider so we can pin it to the proposal
    const activeProvider = await getActiveProviderInfo();

    // Run Clawbot extraction
    const context = await extractRFPContext(proposal.rfpText);

    // Update proposal with extracted context + type
    await db
      .update(proposals)
      .set({
        contextJson: context,
        proposalType: context.type,
        status: "generating",
        llmProviderId: activeProvider?.id ?? null,
      })
      .where(eq(proposals.id, proposal.id));

    // Pre-create all 10 section rows (as pending)
    const sectionRows = Object.entries(SECTION_NAMES).map(
      ([num, name]) => ({
        proposalId: proposal.id,
        sectionNumber: parseInt(num),
        sectionName: name,
        status: "pending" as const,
      })
    );

    await db.insert(sections).values(sectionRows).onConflictDoNothing();

    return NextResponse.json({
      proposalType: context.type,
      contextJson: context,
    });
  } catch (error) {
    console.error("[analyze]", error);
    return NextResponse.json(
      { error: "Analysis failed. Check your LLM provider settings." },
      { status: 500 }
    );
  }
}
