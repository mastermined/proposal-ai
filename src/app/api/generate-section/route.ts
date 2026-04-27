import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { sections } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { streamSection } from "@/lib/agents/clawbot";
import { SECTION_NAMES } from "@/lib/prompts/sections";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 60;

const BodySchema = z.object({
  proposalId: z.string().uuid(),
  sectionNumber: z.number().int().min(1).max(10),
});

export async function POST(req: NextRequest) {
  try {
    const body = BodySchema.parse(await req.json());
    const { proposalId, sectionNumber } = body;

    const sectionName = SECTION_NAMES[sectionNumber];

    // Stream the section content using SSE
    const encoder = new TextEncoder();
    let fullContent = "";

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamSection(proposalId, sectionNumber)) {
            fullContent += chunk;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`));
          }

          // Upsert the section in DB with the full generated content
          const existingSection = await db.query.sections.findFirst({
            where: and(
              eq(sections.proposalId, proposalId),
              eq(sections.sectionNumber, sectionNumber)
            ),
          });

          if (existingSection) {
            await db
              .update(sections)
              .set({
                aiDraft: fullContent,
                currentContent: fullContent,
                status: "draft",
              })
              .where(eq(sections.id, existingSection.id));

            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ done: true, sectionId: existingSection.id })}\n\n`
              )
            );
          } else {
            const [newSection] = await db
              .insert(sections)
              .values({
                proposalId,
                sectionNumber,
                sectionName,
                aiDraft: fullContent,
                currentContent: fullContent,
                status: "draft",
              })
              .returning();

            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ done: true, sectionId: newSection.id })}\n\n`
              )
            );
          }

          controller.close();
        } catch (err) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: String(err) })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("[generate-section]", error);
    return new Response(
      JSON.stringify({ error: "Generation failed. Please try again." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
