"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  FileText,
  File,
  Pencil,
  Check,
  X,
  Plus,
  Loader2,
  Trash2,
  UploadCloud,
  Calendar,
  Cpu,
  Tag,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface RFPFile {
  name: string;
  size: number;
  type: "pdf" | "docx";
}

interface ProposalDetail {
  id: string;
  name: string | null;
  rfpFilename: string;
  rfpFiles: RFPFile[] | null;
  proposalType: string | null;
  status: string;
  createdAt: string;
  llmProvider: { name: string; model: string; provider: string } | null;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-MY", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function typeLabel(t: string | null) {
  if (t === "r_and_m") return "Run & Maintain";
  if (t === "enhancement") return "Enhancement";
  if (t === "hybrid") return "Hybrid";
  return "Unknown";
}

function typeColor(t: string | null) {
  if (t === "r_and_m") return "bg-fpt-muted text-fpt";
  if (t === "enhancement") return "bg-purple-100 text-purple-700";
  if (t === "hybrid") return "bg-teal-100 text-teal-700";
  return "bg-gray-100 text-gray-500";
}

// Reusable card section
function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <section
      className={cn("rounded-xl mb-5 overflow-hidden", className)}
      style={{ border: "1px solid var(--border)", background: "var(--surface-1)" }}
    >
      {children}
    </section>
  );
}

function CardHeader({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="px-5 py-4 flex items-center justify-between"
      style={{ borderBottom: "1px solid var(--border)" }}
    >
      {children}
    </div>
  );
}

function CardRow({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex items-center justify-between px-5 py-3.5 text-sm"
      style={{ borderBottom: "1px solid var(--border)" }}
    >
      {children}
    </div>
  );
}

export default function ProposalSettingsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const proposalId = params.id;

  const [proposal, setProposal] = useState<ProposalDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const [nameDraft, setNameDraft] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [savingName, setSavingName] = useState(false);

  const [addingFiles, setAddingFiles] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [dragging, setDragging] = useState(false);
  const addFileRef = useRef<HTMLInputElement>(null);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch(`/api/proposals/${proposalId}/details`)
      .then((r) => r.json())
      .then((data) => {
        setProposal(data);
        setNameDraft(data.name || data.rfpFilename);
      })
      .finally(() => setLoading(false));
  }, [proposalId]);

  const saveName = async () => {
    const trimmed = nameDraft.trim();
    if (!trimmed || !proposal) { setEditingName(false); return; }
    setSavingName(true);
    try {
      const res = await fetch(`/api/proposals/${proposalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      if (res.ok) setProposal((p) => p ? { ...p, name: trimmed } : p);
    } finally {
      setSavingName(false);
      setEditingName(false);
    }
  };

  const handleAddFiles = async (incoming: FileList | null) => {
    if (!incoming || incoming.length === 0 || !proposal) return;
    const newFiles = Array.from(incoming);
    setUploading(true);
    setUploadError("");

    const formData = new FormData();
    for (const f of newFiles) formData.append("files", f);
    formData.append("name", proposal.name || proposal.rfpFilename);
    formData.append("proposalId", proposalId);

    try {
      const res = await fetch(`/api/proposals/${proposalId}/add-documents`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.error || "Upload failed");
      } else {
        const refreshed = await fetch(`/api/proposals/${proposalId}/details`).then(r => r.json());
        setProposal(refreshed);
        setAddingFiles(false);
      }
    } catch (e) {
      setUploadError(String(e));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await fetch(`/api/proposals/${proposalId}`, { method: "DELETE" });
      router.push("/proposals");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 size={28} className="animate-spin text-fpt" />
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center" style={{ color: "var(--fg-muted)" }}>
        Proposal not found.
      </div>
    );
  }

  const displayName = proposal.name || proposal.rfpFilename;
  const files: RFPFile[] = proposal.rfpFiles ?? [{ name: proposal.rfpFilename, size: 0, type: "pdf" }];

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm mb-8" style={{ color: "var(--fg-muted)" }}>
        <Link
          href={`/proposals/${proposalId}`}
          className="flex items-center gap-1 transition-colors hover:text-[var(--accent)]"
        >
          <ChevronLeft size={15} />
          Back to proposal
        </Link>
        <span>·</span>
        <span className="truncate max-w-[200px]">{displayName}</span>
        <span>·</span>
        <span>Settings</span>
      </div>

      <h1 className="text-xl font-bold mb-8" style={{ color: "var(--accent)" }}>
        Proposal Settings
      </h1>

      {/* ── Project Name ─────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--fg)" }}>
            <Tag size={15} style={{ color: "var(--accent)" }} />
            Project Name
          </div>
        </CardHeader>
        <div className="px-5 py-4">
          {editingName ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveName();
                  if (e.key === "Escape") setEditingName(false);
                }}
                className="flex-1 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                style={{ border: "1px solid var(--border)", background: "var(--surface-2)", color: "var(--fg)" }}
                disabled={savingName}
                placeholder="e.g. Petronas Quality+ 2025"
              />
              <button
                onClick={saveName}
                disabled={savingName}
                className="p-2 text-white rounded-lg transition-colors disabled:opacity-50"
                style={{ background: "var(--accent)" }}
              >
                {savingName ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
              </button>
              <button
                onClick={() => setEditingName(false)}
                className="p-2 rounded-lg transition-colors"
                style={{ border: "1px solid var(--border)", color: "var(--fg-muted)" }}
              >
                <X size={15} />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-base font-medium" style={{ color: "var(--fg)" }}>{displayName}</p>
              <button
                onClick={() => setEditingName(true)}
                className="flex items-center gap-1.5 text-xs rounded-lg px-3 py-1.5 transition-colors hover:text-[var(--accent)]"
                style={{ border: "1px solid var(--border)", color: "var(--fg-muted)" }}
              >
                <Pencil size={12} />
                Rename
              </button>
            </div>
          )}
          <p className="text-xs mt-2" style={{ color: "var(--fg-muted)" }}>
            This name appears in your proposals list and is used for export filenames.
          </p>
        </div>
      </Card>

      {/* ── Source Documents ──────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--fg)" }}>
            <FileText size={15} style={{ color: "var(--accent)" }} />
            Source Documents
          </div>
          <span className="text-xs" style={{ color: "var(--fg-muted)" }}>{files.length} file{files.length !== 1 ? "s" : ""}</span>
        </CardHeader>

        <div>
          {files.map((f, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
              <div className={cn(
                "shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold",
                f.type === "pdf" ? "bg-red-50 text-red-500" : "bg-fpt-muted text-fpt"
              )}>
                {f.type === "pdf" ? "PDF" : "DOC"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: "var(--fg)" }}>{f.name}</p>
                {f.size > 0 && (
                  <p className="text-xs" style={{ color: "var(--fg-muted)" }}>{formatBytes(f.size)}</p>
                )}
              </div>
              <File size={15} className="shrink-0" style={{ color: "var(--border-2)" }} />
            </div>
          ))}
        </div>

        {/* Add documents */}
        <div className="px-5 py-4 rounded-b-xl" style={{ background: "var(--surface-2)" }}>
          {!addingFiles ? (
            <button
              onClick={() => setAddingFiles(true)}
              className="flex items-center gap-2 text-sm transition-colors hover:text-[var(--accent)]"
              style={{ color: "var(--fg-muted)" }}
            >
              <Plus size={15} />
              Add documents (addendum, SOW, clarifications…)
            </button>
          ) : (
            <div className="space-y-3">
              <label
                htmlFor="add-docs"
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => { e.preventDefault(); setDragging(false); handleAddFiles(e.dataTransfer.files); }}
                className="flex flex-col items-center gap-2 py-6 border-2 border-dashed rounded-xl cursor-pointer transition-all"
                style={{
                  borderColor: dragging ? "var(--accent)" : "var(--border-2)",
                  background: dragging ? "var(--accent-muted)" : "transparent",
                }}
              >
                <input
                  id="add-docs"
                  ref={addFileRef}
                  type="file"
                  accept=".pdf,.docx"
                  multiple
                  className="sr-only"
                  onChange={(e) => handleAddFiles(e.target.files)}
                  disabled={uploading}
                />
                {uploading ? (
                  <>
                    <Loader2 size={22} className="animate-spin" style={{ color: "var(--accent)" }} />
                    <p className="text-sm" style={{ color: "var(--accent)" }}>Processing documents…</p>
                  </>
                ) : (
                  <>
                    <UploadCloud size={22} style={{ color: "var(--fg-muted)" }} />
                    <p className="text-sm" style={{ color: "var(--fg-muted)" }}>Drop files here or click to browse</p>
                    <p className="text-xs" style={{ color: "var(--fg-muted)" }}>PDF or DOCX · Added documents will be merged into the RFP context</p>
                  </>
                )}
              </label>
              {uploadError && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{uploadError}</p>
              )}
              <div className="flex justify-end">
                <button
                  onClick={() => { setAddingFiles(false); setUploadError(""); }}
                  className="text-xs transition-colors hover:text-[var(--fg)]"
                  style={{ color: "var(--fg-muted)" }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* ── Proposal Info ─────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--fg)" }}>
            <Cpu size={15} style={{ color: "var(--accent)" }} />
            Proposal Info
          </div>
        </CardHeader>
        <div>
          <CardRow>
            <span style={{ color: "var(--fg-muted)" }}>Engagement type</span>
            <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-medium", typeColor(proposal.proposalType))}>
              {typeLabel(proposal.proposalType)}
            </span>
          </CardRow>
          <CardRow>
            <span style={{ color: "var(--fg-muted)" }}>Status</span>
            <span className="capitalize font-medium" style={{ color: "var(--fg)" }}>
              {proposal.status.replace("_", " ")}
            </span>
          </CardRow>
          <CardRow>
            <span className="flex items-center gap-1.5" style={{ color: "var(--fg-muted)" }}>
              <Calendar size={13} />Created
            </span>
            <span style={{ color: "var(--fg)" }}>{formatDate(proposal.createdAt)}</span>
          </CardRow>
          {proposal.llmProvider && (
            <div className="flex items-center justify-between px-5 py-3.5 text-sm">
              <span style={{ color: "var(--fg-muted)" }}>LLM used</span>
              <span className="font-mono text-xs px-2 py-1 rounded" style={{ background: "var(--surface-2)", color: "var(--fg)" }}>
                {proposal.llmProvider.model}
              </span>
            </div>
          )}
        </div>
      </Card>

      {/* ── Danger Zone ───────────────────────────────────────────── */}
      <section
        className="rounded-xl overflow-hidden"
        style={{ border: "1px solid var(--red, #ef4444)", background: "var(--surface-1)" }}
      >
        <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(239,68,68,0.3)" }}>
          <p className="text-sm font-semibold text-red-500">Danger Zone</p>
        </div>
        <div className="px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--fg)" }}>Delete this proposal</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>
              Permanently deletes all sections, feedback, and generated content. This cannot be undone.
            </p>
          </div>
          {confirmDelete ? (
            <div className="flex items-center gap-2 shrink-0 ml-4">
              <span className="text-xs text-red-500 font-medium">Are you sure?</span>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-1 text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
              >
                {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                Delete
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-xs px-2 transition-colors"
                style={{ color: "var(--fg-muted)" }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="shrink-0 ml-4 flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 px-3 py-1.5 rounded-lg transition-colors"
              style={{ border: "1px solid rgba(239,68,68,0.4)" }}
            >
              <Trash2 size={13} />
              Delete
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
