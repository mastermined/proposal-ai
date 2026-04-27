import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { sections, feedback } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { streamRevision } from "@/lib/agents/clawbot";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 60;

const BodySchema = z.object({
  sectionId: z.string().uuid(),
  feedbackText: z.string().min(1),
  currentContent: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const body = BodySchema.parse(await req.json());
    const { sectionId, feedbackText, currentContent } = body;

    const section = await db.query.sections.findFirst({
      where: eq(sections.id, sectionId),
    });
    if (!section) {
      return new Response(JSON.stringify({ error: "Section not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Store the feedback before revision
    await db.insert(feedback).values({
      sectionId,
      feedbackText,
      diffBefore: currentContent,
    });

    const encoder = new TextEncoder();
    let fullContent = "";

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamRevision(
            section.sectionNumber,
            section.sectionName,
            currentContent,
            feedbackText
          )) {
            fullContent += chunk;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`)
            );
          }

          // Update section with revised content
          await db
            .update(sections)
            .set({
              currentContent: fullContent,
              status: "in_review",
              revisionCount: (section.revisionCount ?? 0) + 1,
            })
            .where(eq(sections.id, sectionId));

          // Update feedback diff_after
          await db
            .update(feedback)
            .set({ diffAfter: fullContent })
            .where(eq(feedback.sectionId, sectionId));

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`)
          );
          controller.close();
        } catch (err) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: String(err) })}\n\n`)
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
    console.error("[revise]", error);
    return new Response(
      JSON.stringify({ error: "Revision failed. Please try again." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
