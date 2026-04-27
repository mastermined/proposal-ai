import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sections } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ proposalId: string; num: string }> }
) {
  const { proposalId, num } = await params;
  const sectionNumber = parseInt(num);

  const section = await db.query.sections.findFirst({
    where: and(
      eq(sections.proposalId, proposalId),
      eq(sections.sectionNumber, sectionNumber)
    ),
  });

  if (!section) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(section);
}
