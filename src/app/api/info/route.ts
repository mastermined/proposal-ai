import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { learningLogs, promptVersions, proposals, sections, feedback } from "@/lib/db/schema";
import { desc, count, eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [
    recentLogs,
    activePrompts,
    totalProposals,
    totalSections,
    totalFeedback,
    promptCount,
  ] = await Promise.all([
    // Last 20 Hermes learning logs with section name
    db.query.learningLogs.findMany({
      orderBy: [desc(learningLogs.createdAt)],
      limit: 20,
      with: {
        proposal: { columns: { name: true, rfpFilename: true, proposalType: true } },
      },
    }),

    // Active prompt versions (Hermes-improved prompts)
    db.query.promptVersions.findMany({
      where: eq(promptVersions.isActive, true),
      orderBy: [desc(promptVersions.createdAt)],
      limit: 20,
    }),

    // Stats
    db.select({ c: count() }).from(proposals),
    db.select({ c: count() }).from(sections).where(eq(sections.status, "approved")),
    db.select({ c: count() }).from(feedback),
    db.select({ c: count() }).from(promptVersions),
  ]);

  return NextResponse.json({
    stats: {
      totalProposals: totalProposals[0]?.c ?? 0,
      approvedSections: totalSections[0]?.c ?? 0,
      totalFeedback: totalFeedback[0]?.c ?? 0,
      promptVersions: promptCount[0]?.c ?? 0,
    },
    hermesLogs: recentLogs,
    activePrompts,
  });
}
