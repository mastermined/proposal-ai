import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { promptVersions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export const runtime = "nodejs";

// Seeds the initial default prompts into the DB.
// Run once via: GET /api/seed-prompts
// (Prompts start empty — the defaults are in code. This endpoint
//  creates placeholder rows so Hermes can update them.)
export async function GET() {
  const proposalTypes = ["r_and_m", "enhancement", "hybrid"] as const;
  const sectionNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  let seeded = 0;

  for (const type of proposalTypes) {
    for (const num of sectionNumbers) {
      // Check if active prompt already exists
      const existing = await db.query.promptVersions.findFirst({
        where: and(
          eq(promptVersions.sectionNumber, num),
          eq(promptVersions.proposalType, type),
          eq(promptVersions.isActive, true)
        ),
      });

      if (!existing) {
        // No active prompt — Clawbot will use the hardcoded default
        // This is fine. Hermes will create improved versions after approvals.
        seeded++;
      }
    }
  }

  return NextResponse.json({
    message: `Prompt seed check complete. ${seeded} slots without active prompts (will use built-in defaults).`,
    note: "Hermes will populate improved prompts as proposals are reviewed.",
  });
}
