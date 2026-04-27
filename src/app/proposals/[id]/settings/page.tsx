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

export default function ProposalSettingsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const proposalId = params.id;

  const [proposal, setProposal] = useState<ProposalDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Name editing
  const [nameDraft, setNameDraft] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [savingName, setSavingName] = useState(false);

  // File upload
  const [addingFiles, setAddingFiles] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [dragging, setDragging] = useState(false);
  const addFileRef = useRef<HTMLInputElement>(null);

  // Delete
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // ── Load proposal details ─────────────────────────────────────────────────

  useEffect(() => {
    fetch(`/api/proposals/${proposalId}/details`)
      .then((r) => r.json())
      .then((data) => {
        setProposal(data);
        setNameDraft(data.name || data.rfpFilename);
      })
      .finally(() => setLoading(false));
  }, [proposalId]);

  // ── Name save ─────────────────────────────────────────────────────────────

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

  // ── Add more files ────────────────────────────────────────────────────────

  const handleAddFiles = async (incoming: FileList | null) => {
    if (!incoming || incoming.length === 0 || !proposal) return;
    const newFiles = Array.from(incoming);
    setUploading(true);
    setUploadError("");

    const formData = new FormData();
    for (const f of newFiles) formData.append("files", f);
    formData.append("name", proposal.name || proposal.rfpFilename);
    formData.append("proposalId", proposalId); // signal to re-analyze existing proposal

    try {
      const res = await fetch(`/api/proposals/${proposalId}/add-documents`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.error || "Upload failed");
      } else {
        // Refresh proposal details
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

  // ── Delete proposal ───────────────────────────────────────────────────────

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await fetch(`/api/proposals/${proposalId}`, { method: "DELETE" });
      router.push("/proposals");
    } finally {
      setDeleting(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 size={28} className="animate-spin text-fpt" />
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center text-gray-500">
        Proposal not found.
      </div>
    );
  }

  const displayName = proposal.name || proposal.rfpFilename;
  const files: RFPFile[] = proposal.rfpFiles ?? [{ name: proposal.rfpFilename, size: 0, type: "pdf" }];

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
        <Link
          href={`/proposals/${proposalId}`}
          className="flex items-center gap-1 hover:text-foreground transition-colors"
        >
          <ChevronLeft size={15} />
          Back to proposal
        </Link>
        <span>·</span>
        <span className="truncate max-w-[200px]">{displayName}</span>
        <span>·</span>
        <span>Settings</span>
      </div>

      <h1 className="text-xl font-bold text-gray-900 mb-8">Proposal Settings</h1>

      {/* ── Section: Name ─────────────────────────────────────────────────── */}
      <section className="border rounded-xl bg-white shadow-sm mb-5">
        <div className="px-5 py-4 border-b">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Tag size={15} className="text-fpt" />
            Project Name
          </div>
        </div>
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
                className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-fpt"
                disabled={savingName}
                placeholder="e.g. Petronas Quality+ 2025"
              />
              <button
                onClick={saveName}
                disabled={savingName}
                className="p-2 bg-fpt text-white rounded-lg hover:bg-fpt-hover disabled:opacity-50 transition-colors"
              >
                {savingName ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
              </button>
              <button
                onClick={() => setEditingName(false)}
                className="p-2 border rounded-lg text-gray-500 hover:text-gray-800 transition-colors"
              >
                <X size={15} />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-base font-medium text-gray-900">{displayName}</p>
              <button
                onClick={() => setEditingName(true)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-fpt border rounded-lg px-3 py-1.5 transition-colors"
              >
                <Pencil size={12} />
                Rename
              </button>
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            This name appears in your proposals list and is used for export filenames.
          </p>
        </div>
      </section>

      {/* ── Section: Source Documents ──────────────────────────────────────── */}
      <section className="border rounded-xl bg-white shadow-sm mb-5">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <FileText size={15} className="text-fpt" />
            Source Documents
          </div>
          <span className="text-xs text-muted-foreground">{files.length} file{files.length !== 1 ? "s" : ""}</span>
        </div>

        {/* File list */}
        <div className="divide-y">
          {files.map((f, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3.5">
              <div className={cn(
                "shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold",
                f.type === "pdf" ? "bg-red-50 text-red-500" : "bg-fpt-muted text-fpt"
              )}>
                {f.type === "pdf" ? "PDF" : "DOC"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{f.name}</p>
                {f.size > 0 && (
                  <p className="text-xs text-muted-foreground">{formatBytes(f.size)}</p>
                )}
              </div>
              <File size={15} className="shrink-0 text-gray-300" />
            </div>
          ))}
        </div>

        {/* Add documents */}
        <div className="px-5 py-4 border-t bg-gray-50 rounded-b-xl">
          {!addingFiles ? (
            <button
              onClick={() => setAddingFiles(true)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-fpt transition-colors"
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
                className={cn(
                  "flex flex-col items-center gap-2 py-6 border-2 border-dashed rounded-xl cursor-pointer transition-all",
                  dragging ? "border-fpt bg-fpt-muted" : "border-gray-200 hover:border-fpt/30 hover:bg-gray-50"
                )}
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
                  <><Loader2 size={22} className="text-fpt animate-spin" /><p className="text-sm text-fpt">Processing documents…</p></>
                ) : (
                  <><UploadCloud size={22} className="text-gray-400" /><p className="text-sm text-gray-500">Drop files here or click to browse</p><p className="text-xs text-gray-400">PDF or DOCX · Added documents will be merged into the RFP context</p></>
                )}
              </label>
              {uploadError && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{uploadError}</p>
              )}
              <div className="flex justify-end">
                <button onClick={() => { setAddingFiles(false); setUploadError(""); }} className="text-xs text-muted-foreground hover:text-gray-700">Cancel</button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Section: Proposal Info ─────────────────────────────────────────── */}
      <section className="border rounded-xl bg-white shadow-sm mb-5">
        <div className="px-5 py-4 border-b">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Cpu size={15} className="text-fpt" />
            Proposal Info
          </div>
        </div>
        <div className="divide-y text-sm">
          <div className="flex items-center justify-between px-5 py-3.5">
            <span className="text-muted-foreground">Engagement type</span>
            <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-medium", typeColor(proposal.proposalType))}>
              {typeLabel(proposal.proposalType)}
            </span>
          </div>
          <div className="flex items-center justify-between px-5 py-3.5">
            <span className="text-muted-foreground">Status</span>
            <span className="capitalize font-medium text-gray-700">{proposal.status.replace("_", " ")}</span>
          </div>
          <div className="flex items-center justify-between px-5 py-3.5">
            <span className="text-muted-foreground flex items-center gap-1.5"><Calendar size={13} />Created</span>
            <span className="text-gray-700">{formatDate(proposal.createdAt)}</span>
          </div>
          {proposal.llmProvider && (
            <div className="flex items-center justify-between px-5 py-3.5">
              <span className="text-muted-foreground">LLM used</span>
              <span className="text-gray-700 font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                {proposal.llmProvider.model}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* ── Section: Danger Zone ───────────────────────────────────────────── */}
      <section className="border border-red-200 rounded-xl bg-white shadow-sm">
        <div className="px-5 py-4 border-b border-red-200">
          <p className="text-sm font-semibold text-red-600">Danger Zone</p>
        </div>
        <div className="px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-800">Delete this proposal</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Permanently deletes all sections, feedback, and generated content. This cannot be undone.
            </p>
          </div>
          {confirmDelete ? (
            <div className="flex items-center gap-2 shrink-0 ml-4">
              <span className="text-xs text-red-600 font-medium">Are you sure?</span>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-1 text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
              >
                {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                Delete
              </button>
              <button onClick={() => setConfirmDelete(false)} className="text-xs text-gray-400 hover:text-gray-700 px-2">Cancel</button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="shrink-0 ml-4 flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 border border-red-200 hover:border-red-400 px-3 py-1.5 rounded-lg transition-colors"
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
