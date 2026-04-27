import { getLLMProvider } from "@/lib/llm/router";
import {
  buildExtractionPrompt,
  buildSectionPrompt,
  buildRevisionPrompt,
  EXTRACTION_SYSTEM_PROMPT,
} from "@/lib/prompts/sections";
import { db } from "@/lib/db";
import {
  proposals,
  sections,
  promptVersions,
  learningLogs,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import type { RFPContext } from "@/lib/db/schema";

/**
 * CLAWBOT — Execution Agent
 * Handles: RFP extraction, section generation (stream + complete), revision (stream + complete)
 *
 * All section and revision prompts are split into { system, user } pairs:
 * - system: Clawbot identity + full FPT standard template knowledge
 * - user:   RFP context + section-specific task instructions
 *
 * This means Clawbot always has the template in memory. When users say
 * "refer to template" in feedback, the revision prompt carries the same
 * system context so Clawbot knows exactly what they mean.
 */

// ─── Shared: load section generation context from DB ─────────────────────────

async function loadSectionContext(proposalId: string, sectionNumber: number) {
  const proposal = await db.query.proposals.findFirst({
    where: eq(proposals.id, proposalId),
    with: { sections: true },
  });
  if (!proposal) throw new Error("Proposal not found");

  const context = proposal.contextJson as RFPContext;
  const proposalType = proposal.proposalType ?? "r_and_m";

  // Previously approved sections for cross-section continuity
  const approvedSections = (proposal.sections ?? [])
    .filter((s) => s.status === "approved" && s.sectionNumber < sectionNumber)
    .sort((a, b) => a.sectionNumber - b.sectionNumber)
    .map((s) => ({
      name: s.sectionName,
      summary: (s.currentContent ?? "").slice(0, 300) + "…",
    }));

  // Active Hermes-improved prompt for this section + proposal type (if any)
  const activePrompt = await db.query.promptVersions.findFirst({
    where: and(
      eq(promptVersions.sectionNumber, sectionNumber),
      eq(promptVersions.proposalType, proposalType),
      eq(promptVersions.isActive, true)
    ),
  });

  // Recent Hermes learning notes for this proposal
  const recentLogs = await db.query.learningLogs.findMany({
    where: eq(learningLogs.proposalId, proposalId),
    orderBy: (t, { desc }) => [desc(t.createdAt)],
    limit: 5,
  });
  const learningNotes = recentLogs.map((l) => l.insight).join("\n");

  return { context, proposalType, approvedSections, activePrompt, learningNotes };
}

// ─── Extract RFP context ──────────────────────────────────────────────────────

export async function extractRFPContext(rfpText: string): Promise<RFPContext> {
  const llm = await getLLMProvider();

  const raw = await llm.complete(
    [
      { role: "system", content: EXTRACTION_SYSTEM_PROMPT },
      { role: "user", content: buildExtractionPrompt(rfpText) },
    ],
    { temperature: 0.1, maxTokens: 2048 }
  );

  try {
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleaned) as RFPContext;
  } catch {
    throw new Error(`Failed to parse RFP context JSON: ${raw.slice(0, 200)}`);
  }
}

// ─── Stream a section (primary path) ─────────────────────────────────────────

export async function* streamSection(
  proposalId: string,
  sectionNumber: number
): AsyncIterable<string> {
  const llm = await getLLMProvider();

  const { context, approvedSections, activePrompt, learningNotes } =
    await loadSectionContext(proposalId, sectionNumber);

  // buildSectionPrompt now returns { system, user }
  // system = Clawbot identity + full FPT standard template knowledge
  // user   = RFP context + section-specific task
  const { system, user } = buildSectionPrompt(
    sectionNumber,
    context,
    approvedSections,
    learningNotes,
    activePrompt?.promptText
  );

  yield* llm.stream(
    [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    { temperature: 0.7, maxTokens: 4096 }
  );
}

// ─── Generate a section (non-streaming fallback) ──────────────────────────────

export async function generateSection(
  proposalId: string,
  sectionNumber: number
): Promise<string> {
  const llm = await getLLMProvider();

  const { context, approvedSections, activePrompt, learningNotes } =
    await loadSectionContext(proposalId, sectionNumber);

  const { system, user } = buildSectionPrompt(
    sectionNumber,
    context,
    approvedSections,
    learningNotes,
    activePrompt?.promptText
  );

  return llm.complete(
    [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    { temperature: 0.7, maxTokens: 4096 }
  );
}

// ─── Stream a revision (primary path) ────────────────────────────────────────

export async function* streamRevision(
  sectionNumber: number,
  sectionName: string,
  currentContent: string,
  feedbackText: string
): AsyncIterable<string> {
  const llm = await getLLMProvider();

  // buildRevisionPrompt also returns { system, user }
  // system carries the full FPT template so "refer to template" works in feedback
  const { system, user } = buildRevisionPrompt(
    sectionNumber,
    sectionName,
    currentContent,
    feedbackText
  );

  yield* llm.stream(
    [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    { temperature: 0.6, maxTokens: 4096 }
  );
}

// ─── Revise a section (non-streaming fallback) ────────────────────────────────

export async function reviseSection(
  sectionNumber: number,
  sectionName: string,
  currentContent: string,
  feedbackText: string
): Promise<string> {
  const llm = await getLLMProvider();

  const { system, user } = buildRevisionPrompt(
    sectionNumber,
    sectionName,
    currentContent,
    feedbackText
  );

  return llm.complete(
    [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    { temperature: 0.6, maxTokens: 4096 }
  );
}
