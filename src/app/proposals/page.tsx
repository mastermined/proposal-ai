import { db } from "@/lib/db";
import { proposals, sections } from "@/lib/db/schema";
import { desc, eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  Circle,
  ChevronRight,
  UploadCloud,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

export const dynamic = "force-dynamic";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function typeLabel(type: string | null) {
  if (type === "r_and_m") return "Run & Maintain";
  if (type === "enhancement") return "Enhancement";
  if (type === "hybrid") return "Hybrid";
  return "Analysing…";
}

function typeColor(type: string | null) {
  if (type === "r_and_m") return "bg-blue-100 text-blue-700";
  if (type === "enhancement") return "bg-purple-100 text-purple-700";
  if (type === "hybrid") return "bg-teal-100 text-teal-700";
  return "bg-gray-100 text-gray-500";
}

function statusColor(status: string) {
  if (status === "done") return "text-green-600";
  if (status === "reviewing") return "text-yellow-600";
  if (status === "generating") return "text-blue-600";
  return "text-gray-400";
}

function statusLabel(status: string) {
  if (status === "done") return "Complete";
  if (status === "reviewing") return "In review";
  if (status === "generating") return "Generating";
  if (status === "analyzing") return "Analysing";
  return "Uploading";
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-MY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ProposalsListPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  // Admins see all proposals; users see only their own
  const allProposals = await db.query.proposals.findMany({
    where: session.role === "admin" ? undefined : eq(proposals.userId, session.sub),
    orderBy: [desc(proposals.createdAt)],
  });

  // For each proposal, count approved sections
  const approvedCounts: Record<string, number> = {};
  if (allProposals.length > 0) {
    const approvedSections = await db.query.sections.findMany({
      where: and(
        eq(sections.status, "approved")
      ),
    });
    for (const s of approvedSections) {
      approvedCounts[s.proposalId] = (approvedCounts[s.proposalId] ?? 0) + 1;
    }
  }

  return (
    <div className="page-container" style={{ maxWidth: "860px" }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">My Proposals</h1>
          <p className="page-subtitle">
            {allProposals.length === 0
              ? "No proposals yet — upload an RFP to get started."
              : `${allProposals.length} proposal${allProposals.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Link href="/" className="btn-primary">
          <UploadCloud size={15} />
          New Proposal
        </Link>
      </div>

      {/* Empty state */}
      {allProposals.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed rounded-2xl" style={{ borderColor: "var(--border-2)" }}>
          <div className="w-12 h-12 rounded-xl mb-4 flex items-center justify-center" style={{ background: "var(--surface-2)" }}>
            <FileText size={22} style={{ color: "var(--fg-muted)" }} />
          </div>
          <p className="text-sm font-semibold mb-1" style={{ color: "var(--fg)" }}>No proposals yet</p>
          <p className="text-xs mb-6" style={{ color: "var(--fg-muted)" }}>Upload an RFP document to generate your first proposal</p>
          <Link href="/" className="btn-primary">
            <UploadCloud size={14} />
            Upload RFP
          </Link>
        </div>
      )}

      {/* Proposal list */}
      {allProposals.length > 0 && (
        <div className="space-y-2">
          {allProposals.map((proposal) => {
            const approved = approvedCounts[proposal.id] ?? 0;
            const pct = Math.round((approved / 10) * 100);
            const isDone = proposal.status === "done";

            return (
              <Link
                key={proposal.id}
                href={`/proposals/${proposal.id}`}
                className="proposal-row flex items-center gap-4 p-4 rounded-xl border transition-all group"
              >
                {/* File icon */}
                <div className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold"
                  style={{ background: "var(--accent-muted)", color: "var(--accent)" }}>
                  RFP
                </div>

                {/* Main info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <p className="font-semibold text-sm truncate" style={{ color: "var(--fg)" }}>
                      {proposal.name || proposal.rfpFilename}
                    </p>
                    {proposal.proposalType && (
                      <span className={cn("shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", typeColor(proposal.proposalType))}>
                        {typeLabel(proposal.proposalType)}
                      </span>
                    )}
                  </div>
                  {proposal.name && proposal.name !== proposal.rfpFilename && (
                    <p className="text-xs mb-1.5 truncate" style={{ color: "var(--fg-muted)" }}>{proposal.rfpFilename}</p>
                  )}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "var(--surface-3)" }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: isDone ? "var(--green)" : "var(--accent)" }} />
                    </div>
                    <span className="text-xs shrink-0" style={{ color: "var(--fg-muted)" }}>{approved}/10</span>
                  </div>
                </div>

                {/* Status + date */}
                <div className="shrink-0 text-right hidden sm:block">
                  <div className="flex items-center justify-end gap-1.5 mb-1">
                    {isDone ? (
                      <CheckCircle2 size={13} style={{ color: "var(--green)" }} />
                    ) : proposal.status === "reviewing" ? (
                      <Clock size={13} style={{ color: "var(--yellow)" }} />
                    ) : (
                      <Circle size={13} style={{ color: "var(--fg-muted)" }} />
                    )}
                    <span className="text-xs font-medium" style={{ color: isDone ? "var(--green)" : proposal.status === "reviewing" ? "var(--yellow)" : "var(--fg-muted)" }}>
                      {statusLabel(proposal.status)}
                    </span>
                  </div>
                  <p className="text-xs" style={{ color: "var(--fg-muted)" }}>{formatDate(proposal.createdAt)}</p>
                </div>

                <ChevronRight size={16} style={{ color: "var(--fg-muted)" }} className="shrink-0 group-hover:text-[var(--accent)]" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
