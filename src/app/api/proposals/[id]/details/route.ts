import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { proposals, llmProviders } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const proposal = await db.query.proposals.findFirst({
      where: eq(proposals.id, id),
    });

    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    let llmProvider = null;
    if (proposal.llmProviderId) {
      const provider = await db.query.llmProviders.findFirst({
        where: eq(llmProviders.id, proposal.llmProviderId),
      });
      if (provider) {
        llmProvider = {
          name: provider.name,
          model: provider.model,
          provider: provider.provider,
        };
      }
    }

    return NextResponse.json({
      id: proposal.id,
      name: proposal.name,
      rfpFilename: proposal.rfpFilename,
      rfpFiles: proposal.rfpFiles,
      proposalType: proposal.proposalType,
      status: proposal.status,
      createdAt: proposal.createdAt,
      llmProvider,
    });
  } catch (error) {
    console.error("[proposal details GET]", error);
    return NextResponse.json({ error: "Failed to load proposal details." }, { status: 500 });
  }
}
