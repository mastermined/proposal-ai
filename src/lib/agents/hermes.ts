import { getLLMProvider } from "@/lib/llm/router";
import { buildHermesPrompt } from "@/lib/prompts/sections";
import { db } from "@/lib/db";
import {
  sections,
  feedback,
  promptVersions,
  learningLogs,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * HERMES — Learning Agent
 * Triggered after each section approval.
 * Analyzes feedback + diffs, improves prompts, stores insights.
 */

type HermesAnalysis = {
  patterns: string[];
  improvements: string[];
  improvedPrompt: string;
  learningNote: string;
  performanceScore: number;
};

export async function runHermesAnalysis(sectionId: string): Promise<void> {
  // Load section with feedback; fetch proposal separately to avoid deep nesting issues
  const section = await db.query.sections.findFirst({
    where: eq(sections.id, sectionId),
    with: { feedback: true },
  });

  if (!section) throw new Error("Section not found");
  if (!section.aiDraft || !section.currentContent) return; // Nothing to analyze

  // Load proposal to get type
  const { proposals } = await import("@/lib/db/schema");
  const { eq: eqOp } = await import("drizzle-orm");
  const proposal = await db.query.proposals.findFirst({
    where: eqOp(proposals.id, section.proposalId),
  });

  const llm = await getLLMProvider();
  const proposalType = proposal?.proposalType ?? "r_and_m";
  const feedbackTexts = section.feedback
    .filter((f) => f.feedbackText !== "_auto_save_")
    .map((f) => f.feedbackText);

  const prompt = buildHermesPrompt(
    section.sectionNumber,
    section.sectionName,
    proposalType,
    section.aiDraft,
    section.currentContent,
    feedbackTexts
  );

  const raw = await llm.complete(
    [{ role: "user", content: prompt }],
    { temperature: 0.3, maxTokens: 2048 }
  );

  let analysis: HermesAnalysis;
  try {
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    analysis = JSON.parse(cleaned) as HermesAnalysis;
  } catch {
    console.error("Hermes failed to parse analysis JSON:", raw.slice(0, 300));
    return;
  }

  // Deactivate old prompt versions for this section + type
  await db
    .update(promptVersions)
    .set({ isActive: false })
    .where(
      and(
        eq(promptVersions.sectionNumber, section.sectionNumber),
        eq(promptVersions.proposalType, proposalType as "r_and_m" | "enhancement" | "hybrid"),
        eq(promptVersions.isActive, true)
      )
    );

  // Save the improved prompt
  await db.insert(promptVersions).values({
    sectionNumber: section.sectionNumber,
    proposalType: proposalType as "r_and_m" | "enhancement" | "hybrid",
    promptText: analysis.improvedPrompt,
    performanceScore: analysis.performanceScore,
    isActive: true,
  });

  // Save learning insight
  await db.insert(learningLogs).values({
    proposalId: section.proposalId,
    sectionId: sectionId,
    insight: analysis.learningNote,
    appliedTo: [section.sectionNumber],
  });

  console.log(
    `[Hermes] Section ${section.sectionNumber} analyzed. Score: ${analysis.performanceScore}. Note: ${analysis.learningNote}`
  );
}
