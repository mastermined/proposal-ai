"use client";

import { useState, useEffect } from "react";
import {
  Brain,
  Zap,
  Database,
  FileText,
  Users,
  ArrowRight,
  CheckCircle2,
  Loader2,
  BookOpen,
  TrendingUp,
  MessageSquare,
  RefreshCw,
} from "lucide-react";

interface HermesLog {
  id: string;
  insight: string;
  appliedTo: number[] | null;
  createdAt: string;
  proposal: {
    name: string | null;
    rfpFilename: string;
    proposalType: string | null;
  } | null;
}

interface PromptVersion {
  id: string;
  sectionNumber: number;
  proposalType: string;
  performanceScore: number | null;
  createdAt: string;
}

interface InfoData {
  stats: {
    totalProposals: number;
    approvedSections: number;
    totalFeedback: number;
    promptVersions: number;
  };
  hermesLogs: HermesLog[];
  activePrompts: PromptVersion[];
}

const SECTION_NAMES: Record<number, string> = {
  1: "Executive Summary",
  2: "Company Profile",
  3: "Technical Approach",
  4: "Scope of Work",
  5: "Implementation Plan",
  6: "Team & Org Structure",
  7: "Risk Management",
  8: "SLA & Support",
  9: "Commercial Proposal",
  10: "Appendix",
};

function StatCard({ value, label, icon: Icon, color }: { value: number | string; label: string; icon: React.ElementType; color: string }) {
  return (
    <div className="rounded-xl p-4 flex items-center gap-4" style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
      <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: color + "18" }}>
        <Icon size={18} style={{ color }} />
      </div>
      <div>
        <p className="text-2xl font-bold" style={{ color: "var(--fg)" }}>{value}</p>
        <p className="text-xs" style={{ color: "var(--fg-muted)" }}>{label}</p>
      </div>
    </div>
  );
}

function TimeAgo({ date }: { date: string }) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return <span>just now</span>;
  if (mins < 60) return <span>{mins}m ago</span>;
  if (hours < 24) return <span>{hours}h ago</span>;
  return <span>{days}d ago</span>;
}

export default function InfoPage() {
  const [data, setData] = useState<InfoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await fetch("/api/info");
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--fg)" }}>System Info</h1>
        <p className="text-sm" style={{ color: "var(--fg-muted)" }}>
          Architecture overview and live agent activity for Proposal AI
        </p>
      </div>

      {/* ─── Stats Row ─── */}
      {loading ? (
        <div className="flex items-center gap-2 mb-8" style={{ color: "var(--fg-muted)" }}>
          <Loader2 size={16} className="animate-spin" />
          <span className="text-sm">Loading stats…</span>
        </div>
      ) : data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          <StatCard value={data.stats.totalProposals} label="Proposals created" icon={FileText} color="#3b82f6" />
          <StatCard value={data.stats.approvedSections} label="Sections approved" icon={CheckCircle2} color="#22c55e" />
          <StatCard value={data.stats.totalFeedback} label="Feedback rounds" icon={MessageSquare} color="#f59e0b" />
          <StatCard value={data.stats.promptVersions} label="Prompt versions" icon={TrendingUp} color="#a855f7" />
        </div>
      )}

      {/* ─── Architecture Diagram ─── */}
      <section className="rounded-xl p-6 mb-8" style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
        <h2 className="text-base font-semibold mb-6" style={{ color: "var(--fg)" }}>How it works — System Architecture</h2>

        {/* Flow diagram */}
        <div className="overflow-x-auto">
          <div className="flex items-start gap-2 min-w-[640px] pb-2">

            {/* Step 1: Upload */}
            <div className="flex flex-col items-center gap-2 w-28 shrink-0">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.3)" }}>
                <FileText size={22} style={{ color: "#3b82f6" }} />
              </div>
              <p className="text-xs font-semibold text-center" style={{ color: "var(--fg)" }}>RFP Upload</p>
              <p className="text-[10px] text-center leading-relaxed" style={{ color: "var(--fg-muted)" }}>PDF / DOCX uploaded by user</p>
            </div>

            <div className="flex items-center mt-5"><ArrowRight size={16} style={{ color: "var(--fg-muted)" }} /></div>

            {/* Step 2: Analyze */}
            <div className="flex flex-col items-center gap-2 w-28 shrink-0">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.3)" }}>
                <Zap size={22} style={{ color: "#6366f1" }} />
              </div>
              <p className="text-xs font-semibold text-center" style={{ color: "var(--fg)" }}>Analyse</p>
              <p className="text-[10px] text-center leading-relaxed" style={{ color: "var(--fg-muted)" }}>Clawbot reads RFP, classifies type</p>
            </div>

            <div className="flex items-center mt-5"><ArrowRight size={16} style={{ color: "var(--fg-muted)" }} /></div>

            {/* Step 3: Clawbot generates */}
            <div className="flex flex-col items-center gap-2 w-28 shrink-0">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "rgba(14,165,233,0.12)", border: "1px solid rgba(14,165,233,0.3)" }}>
                <Brain size={22} style={{ color: "#0ea5e9" }} />
              </div>
              <p className="text-xs font-semibold text-center" style={{ color: "var(--fg)" }}>Clawbot</p>
              <p className="text-[10px] text-center leading-relaxed" style={{ color: "var(--fg-muted)" }}>Generates each of 10 proposal sections</p>
            </div>

            <div className="flex items-center mt-5"><ArrowRight size={16} style={{ color: "var(--fg-muted)" }} /></div>

            {/* Step 4: Human review */}
            <div className="flex flex-col items-center gap-2 w-28 shrink-0">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)" }}>
                <Users size={22} style={{ color: "#f59e0b" }} />
              </div>
              <p className="text-xs font-semibold text-center" style={{ color: "var(--fg)" }}>Human Review</p>
              <p className="text-[10px] text-center leading-relaxed" style={{ color: "var(--fg-muted)" }}>Edit, give feedback, approve</p>
            </div>

            <div className="flex items-center mt-5"><ArrowRight size={16} style={{ color: "var(--fg-muted)" }} /></div>

            {/* Step 5: Hermes */}
            <div className="flex flex-col items-center gap-2 w-28 shrink-0">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "rgba(168,85,247,0.12)", border: "1px solid rgba(168,85,247,0.3)" }}>
                <BookOpen size={22} style={{ color: "#a855f7" }} />
              </div>
              <p className="text-xs font-semibold text-center" style={{ color: "var(--fg)" }}>Hermes</p>
              <p className="text-[10px] text-center leading-relaxed" style={{ color: "var(--fg-muted)" }}>Learns from feedback, improves prompts</p>
            </div>

            <div className="flex items-center mt-5"><ArrowRight size={16} style={{ color: "var(--fg-muted)" }} /></div>

            {/* Step 6: Export */}
            <div className="flex flex-col items-center gap-2 w-28 shrink-0">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)" }}>
                <CheckCircle2 size={22} style={{ color: "#22c55e" }} />
              </div>
              <p className="text-xs font-semibold text-center" style={{ color: "var(--fg)" }}>Export DOCX</p>
              <p className="text-[10px] text-center leading-relaxed" style={{ color: "var(--fg-muted)" }}>Final proposal ready to submit</p>
            </div>
          </div>
        </div>

        {/* Learning loop note */}
        <div className="mt-5 rounded-lg px-4 py-3 text-xs flex items-start gap-2" style={{ background: "rgba(168,85,247,0.07)", border: "1px solid rgba(168,85,247,0.2)", color: "var(--fg-muted)" }}>
          <RefreshCw size={13} style={{ color: "#a855f7", marginTop: 1, flexShrink: 0 }} />
          <span>
            <strong style={{ color: "#a855f7" }}>Hermes learning loop:</strong> each time a section is approved, Hermes analyses the original AI draft vs the final approved content plus all revision feedback. It extracts patterns, updates the generation prompt with a new version, and logs a learning insight — so future proposals for similar RFPs keep getting smarter.
          </span>
        </div>
      </section>

      {/* ─── Agent Cards ─── */}
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        {/* Clawbot */}
        <div className="rounded-xl p-5" style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(14,165,233,0.12)" }}>
              <Brain size={18} style={{ color: "#0ea5e9" }} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--fg)" }}>Clawbot</p>
              <p className="text-xs" style={{ color: "#0ea5e9" }}>Generation Agent</p>
            </div>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: "var(--fg-muted)" }}>
            Clawbot is responsible for reading and understanding the uploaded RFP, classifying the proposal type (Run & Maintain, Enhancement, or Hybrid), and streaming all 10 proposal sections. It uses the best available Hermes-trained prompt for each section, tailored to the proposal type.
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {["Analyse RFP", "Classify type", "Stream sections", "Use Hermes prompts"].map(tag => (
              <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(14,165,233,0.1)", color: "#0ea5e9" }}>{tag}</span>
            ))}
          </div>
        </div>

        {/* Hermes */}
        <div className="rounded-xl p-5" style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(168,85,247,0.12)" }}>
              <BookOpen size={18} style={{ color: "#a855f7" }} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--fg)" }}>Hermes</p>
              <p className="text-xs" style={{ color: "#a855f7" }}>Learning Agent</p>
            </div>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: "var(--fg-muted)" }}>
            Hermes runs silently in the background every time a section is approved. It compares the original AI draft to the human-approved version, analyses all revision feedback, and produces an improved generation prompt. Over time, Hermes reduces the number of revisions needed per section.
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {["Diff analysis", "Feedback patterns", "Prompt evolution", "Performance scoring"].map(tag => (
              <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(168,85,247,0.1)", color: "#a855f7" }}>{tag}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Hermes Activity Feed ─── */}
      <section className="rounded-xl overflow-hidden mb-8" style={{ border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border)", background: "var(--surface-1)" }}>
          <div className="flex items-center gap-2">
            <BookOpen size={15} style={{ color: "#a855f7" }} />
            <h2 className="text-sm font-semibold" style={{ color: "var(--fg)" }}>Hermes Activity Feed</h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(168,85,247,0.1)", color: "#a855f7" }}>live</span>
          </div>
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 text-xs rounded-lg px-3 py-1.5 transition-colors disabled:opacity-40"
            style={{ color: "var(--fg-muted)", border: "1px solid var(--border)" }}
          >
            <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 px-5 py-6" style={{ color: "var(--fg-muted)" }}>
            <Loader2 size={15} className="animate-spin" />
            <span className="text-sm">Loading Hermes logs…</span>
          </div>
        ) : !data || data.hermesLogs.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <BookOpen size={28} className="mx-auto mb-3 opacity-30" style={{ color: "var(--fg-muted)" }} />
            <p className="text-sm font-medium mb-1" style={{ color: "var(--fg)" }}>No activity yet</p>
            <p className="text-xs" style={{ color: "var(--fg-muted)" }}>Hermes logs will appear here after sections are approved and analysed.</p>
          </div>
        ) : (
          <div>
            {data.hermesLogs.map((log, i) => (
              <div
                key={log.id}
                className="flex gap-4 px-5 py-4 text-sm"
                style={{
                  borderBottom: i < data.hermesLogs.length - 1 ? "1px solid var(--border)" : "none",
                  background: "var(--surface-1)",
                }}
              >
                {/* Icon */}
                <div className="shrink-0 mt-0.5">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(168,85,247,0.1)" }}>
                    <Brain size={13} style={{ color: "#a855f7" }} />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {log.appliedTo && log.appliedTo.length > 0 && (
                        <span className="text-xs font-medium" style={{ color: "#a855f7" }}>
                          Section {log.appliedTo.join(", ")}
                          {log.appliedTo[0] && SECTION_NAMES[log.appliedTo[0]]
                            ? ` — ${SECTION_NAMES[log.appliedTo[0]]}`
                            : ""}
                        </span>
                      )}
                      {log.proposal?.proposalType && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full capitalize" style={{ background: "var(--surface-2)", color: "var(--fg-muted)" }}>
                          {log.proposal.proposalType.replace("_", " ")}
                        </span>
                      )}
                    </div>
                    <span className="text-xs shrink-0" style={{ color: "var(--fg-muted)" }}>
                      <TimeAgo date={log.createdAt} />
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--fg)" }}>{log.insight}</p>
                  {log.proposal && (
                    <p className="text-[10px] mt-1.5" style={{ color: "var(--fg-muted)" }}>
                      From: {log.proposal.name || log.proposal.rfpFilename}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ─── Active Prompt Versions ─── */}
      {data && data.activePrompts.length > 0 && (
        <section className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border)", background: "var(--surface-1)" }}>
            <div className="flex items-center gap-2">
              <TrendingUp size={15} style={{ color: "#a855f7" }} />
              <h2 className="text-sm font-semibold" style={{ color: "var(--fg)" }}>Active Hermes Prompts</h2>
            </div>
            <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>Current best prompt per section, as evolved by Hermes</p>
          </div>
          <div>
            {data.activePrompts.map((pv, i) => (
              <div
                key={pv.id}
                className="flex items-center justify-between px-5 py-3"
                style={{
                  borderBottom: i < data.activePrompts.length - 1 ? "1px solid var(--border)" : "none",
                  background: "var(--surface-1)",
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold" style={{ background: "rgba(168,85,247,0.1)", color: "#a855f7" }}>
                    {pv.sectionNumber}
                  </div>
                  <div>
                    <p className="text-xs font-medium" style={{ color: "var(--fg)" }}>
                      {SECTION_NAMES[pv.sectionNumber] ?? `Section ${pv.sectionNumber}`}
                    </p>
                    <p className="text-[10px] capitalize" style={{ color: "var(--fg-muted)" }}>{pv.proposalType.replace("_", " ")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {pv.performanceScore !== null && (
                    <div className="flex items-center gap-1.5">
                      <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--surface-3)" }}>
                        <div className="h-full rounded-full" style={{ width: `${Math.min(100, (pv.performanceScore ?? 0) * 10)}%`, background: "#a855f7" }} />
                      </div>
                      <span className="text-[10px]" style={{ color: "var(--fg-muted)" }}>
                        {pv.performanceScore?.toFixed(1)}/10
                      </span>
                    </div>
                  )}
                  <span className="text-[10px]" style={{ color: "var(--fg-muted)" }}>
                    <TimeAgo date={pv.createdAt} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── Tech Stack ─── */}
      <section className="rounded-xl p-5 mt-8" style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}>
        <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--fg)" }}>Tech Stack</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { name: "Next.js 15", role: "Full-stack framework", color: "#000" },
            { name: "Neon PostgreSQL", role: "Serverless database", color: "#00e599" },
            { name: "Drizzle ORM", role: "Type-safe queries", color: "#c5f74f" },
            { name: "Anthropic Claude", role: "Primary LLM", color: "#d4a85a" },
            { name: "OpenAI / Groq", role: "Fallback LLMs", color: "#10a37f" },
            { name: "Vercel", role: "Deployment & edge", color: "#000" },
            { name: "AES-256", role: "API key encryption", color: "#3b82f6" },
            { name: "JWT", role: "Session auth", color: "#f59e0b" },
          ].map(item => (
            <div key={item.name} className="rounded-lg p-3" style={{ background: "var(--surface-2)" }}>
              <p className="text-xs font-semibold mb-0.5" style={{ color: "var(--fg)" }}>{item.name}</p>
              <p className="text-[10px]" style={{ color: "var(--fg-muted)" }}>{item.role}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
