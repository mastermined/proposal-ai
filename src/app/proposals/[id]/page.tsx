import { db } from "@/lib/db";
import { proposals, sections } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Circle, Clock, ChevronRight, Download, Settings } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { SECTION_NAMES } from "@/lib/prompts/sections";
import { ProposalHeader } from "@/components/ProposalHeader";

export const dynamic = "force-dynamic";

export default async function ProposalDashboard({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const proposal = await db.query.proposals.findFirst({
    where: eq(proposals.id, id),
  });
  if (!proposal) notFound();

  const sectionList = await db.query.sections.findMany({
    where: eq(sections.proposalId, id),
    orderBy: [asc(sections.sectionNumber)],
  });

  // Build full list including not-yet-created sections
  const allSections = Object.entries(SECTION_NAMES).map(([num, name]) => {
    const existing = sectionList.find((s) => s.sectionNumber === parseInt(num));
    return existing ?? { sectionNumber: parseInt(num), sectionName: name, status: "pending" as const, id: null };
  });

  const approvedCount = sectionList.filter((s) => s.status === "approved").length;
  const isComplete = proposal.status === "done";

  const typeLabel =
    proposal.proposalType === "r_and_m"
      ? "Run & Maintain"
      : proposal.proposalType === "enhancement"
      ? "Enhancement"
      : proposal.proposalType === "hybrid"
      ? "Hybrid"
      : "Analysing…";

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      {/* Header — inline rename handled by client component */}
      <ProposalHeader
        proposalId={id}
        initialName={proposal.name || proposal.rfpFilename}
        rfpFilename={proposal.rfpFilename}
        typeLabel={typeLabel}
        approvedCount={approvedCount}
      />

      {/* Progress bar */}
      <div className="mb-8">
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-500"
            style={{ width: `${(approvedCount / 10) * 100}%` }}
          />
        </div>
      </div>

      {/* Action bar */}
      <div className="flex items-center justify-between mb-6">
        {isComplete ? (
          <a
            href={`/api/export?proposalId=${id}`}
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium px-5 py-2.5 rounded-lg text-sm transition-colors"
          >
            <Download size={16} />
            Download Proposal DOCX
          </a>
        ) : (
          <div />
        )}
        <Link
          href={`/proposals/${id}/settings`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gray-800 border rounded-lg px-3 py-1.5 transition-colors"
        >
          <Settings size={14} />
          Settings
        </Link>
      </div>

      {/* Section list */}
      <div className="space-y-2">
        {allSections.map((section) => {
          const status = section.status;
          const isApproved = status === "approved";
          const isDraft = status === "draft" || status === "in_review";
          const isActive = section.sectionNumber === proposal.activeSection;
          const canAccess = section.sectionNumber <= proposal.activeSection;

          return (
            <div
              key={section.sectionNumber}
              style={{
                background: isApproved
                  ? "var(--green-muted)"
                  : isActive
                  ? "var(--accent-muted)"
                  : isDraft
                  ? "rgba(234,179,8,0.07)"
                  : "var(--surface)",
                borderColor: isApproved
                  ? "rgba(34,197,94,0.3)"
                  : isActive
                  ? "var(--accent)"
                  : isDraft
                  ? "rgba(234,179,8,0.3)"
                  : "var(--border)",
                opacity: !canAccess && !isActive ? 0.5 : 1,
              }}
              className="flex items-center gap-4 p-4 rounded-xl border transition-all"
            >
              {/* Status icon */}
              <div className="shrink-0">
                {isApproved ? (
                  <CheckCircle2 size={20} style={{ color: "var(--green)" }} />
                ) : isDraft ? (
                  <Clock size={20} style={{ color: "var(--yellow)" }} />
                ) : (
                  <Circle size={20} style={{ color: "var(--fg-muted)" }} />
                )}
              </div>

              {/* Section info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm" style={{ color: "var(--fg)" }}>
                  <span className="mr-2" style={{ color: "var(--fg-muted)" }}>{section.sectionNumber}.</span>
                  {section.sectionName}
                </p>
                <p className="text-xs capitalize mt-0.5" style={{ color: "var(--fg-muted)" }}>
                  {status.replace("_", " ")}
                  {isApproved && "revisionCount" in section && (section as { revisionCount: number }).revisionCount > 0
                    ? ` · ${(section as { revisionCount: number }).revisionCount} revision(s)`
                    : ""}
                </p>
              </div>

              {/* Action */}
              {canAccess && section.id && (
                <Link
                  href={`/proposals/${id}/sections/${section.sectionNumber}`}
                  className="shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                  style={isApproved
                    ? { background: "var(--green-muted)", color: "var(--green)" }
                    : isActive
                    ? { background: "var(--accent)", color: "white" }
                    : { background: "var(--surface-2)", color: "var(--fg-2)" }}
                >
                  {isApproved ? "View" : isActive ? "Work on this →" : "Review"}
                </Link>
              )}
              {isActive && !section.id && (
                <Link
                  href={`/proposals/${id}/sections/${section.sectionNumber}`}
                  className="shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                  style={{ background: "var(--accent)", color: "white" }}
                >
                  Generate →
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
