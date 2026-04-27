"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, FileText, Loader2, X, Plus, Pencil, Zap, Brain, CheckSquare } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type Stage = "idle" | "staged" | "uploading" | "analyzing" | "error";

function guessName(files: File[]): string {
  if (files.length === 0) return "";
  return files[0].name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");
}

export default function HomePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addMoreRef = useRef<HTMLInputElement>(null);

  const [stage, setStage] = useState<Stage>("idle");
  const [dragging, setDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [projectName, setProjectName] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [error, setError] = useState("");

  const addFiles = useCallback((incoming: FileList | File[]) => {
    const arr = Array.from(incoming).filter(
      (f) => f.name.toLowerCase().endsWith(".pdf") || f.name.toLowerCase().endsWith(".docx")
    );
    if (arr.length === 0) return;
    setFiles((prev) => {
      const merged = [...prev];
      for (const f of arr) {
        if (!merged.find((x) => x.name === f.name && x.size === f.size)) merged.push(f);
      }
      if (!projectName && merged.length > 0) setProjectName(guessName(merged));
      return merged;
    });
    setStage("staged");
    setError("");
  }, [projectName]);

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (next.length === 0) setStage("idle");
      return next;
    });
  };

  const reset = () => { setFiles([]); setProjectName(""); setStage("idle"); setError(""); };

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files);
  };

  const handleCreate = async () => {
    if (files.length === 0) return;
    setError("");
    setStage("uploading");
    const formData = new FormData();
    for (const f of files) formData.append("files", f);
    formData.append("name", projectName.trim() || guessName(files));

    const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
    if (!uploadRes.ok) {
      setError((await uploadRes.json()).error || "Upload failed");
      setStage("staged");
      return;
    }
    const { proposalId } = await uploadRes.json();
    setStage("analyzing");
    const analyzeRes = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ proposalId }),
    });
    if (!analyzeRes.ok) {
      setError((await analyzeRes.json()).error || "Analysis failed");
      setStage("staged");
      return;
    }
    router.push(`/proposals/${proposalId}`);
  };

  const isProcessing = stage === "uploading" || stage === "analyzing";

  return (
    <div className="page-container flex flex-col items-center justify-center min-h-[calc(100vh-80px)]" style={{ maxWidth: "680px" }}>

      {/* Hero */}
      {stage === "idle" && (
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold tracking-tight mb-3" style={{ color: "var(--fg)", letterSpacing: "-0.03em" }}>
            RFP → Proposal,{" "}
            <span style={{ color: "var(--accent)" }}>automated</span>
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: "var(--fg-2)" }}>
            Upload your RFP. Clawbot reads and classifies the engagement, then generates
            all 10 sections with your template — ready for your feedback.
          </p>
        </div>
      )}

      <div className="w-full space-y-3">

        {/* Idle: drop zone */}
        {stage === "idle" && (
          <label
            htmlFor="file-upload-main"
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            className={cn(
              "flex flex-col items-center gap-4 p-12 border-2 border-dashed rounded-2xl cursor-pointer transition-all",
              dragging ? "border-[var(--accent)] bg-[var(--accent-muted)]" : "border-[var(--border-2)] hover:border-[var(--accent)] hover:bg-[var(--surface-2)]"
            )}
          >
            <input
              id="file-upload-main"
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx"
              multiple
              className="sr-only"
              onChange={(e) => e.target.files && addFiles(e.target.files)}
            />
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "var(--accent-muted)" }}>
              <UploadCloud size={24} style={{ color: "var(--accent)" }} />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold" style={{ color: "var(--fg)" }}>
                Drop your RFP here, or <span style={{ color: "var(--accent)" }}>click to browse</span>
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--fg-muted)" }}>
                PDF or DOCX · multiple files supported
              </p>
            </div>
          </label>
        )}

        {/* Staged / processing: file card */}
        {(stage === "staged" || isProcessing) && (
          <div className="card overflow-hidden">
            {/* Project name */}
            <div className="card-header" style={{ background: "var(--surface-2)" }}>
              <div className="flex-1 min-w-0">
                {editingName ? (
                  <input
                    autoFocus
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    onBlur={() => setEditingName(false)}
                    onKeyDown={(e) => e.key === "Enter" && setEditingName(false)}
                    className="auth-input text-base font-bold"
                    placeholder="Project name"
                    disabled={isProcessing}
                  />
                ) : (
                  <button
                    onClick={() => !isProcessing && setEditingName(true)}
                    className="flex items-center gap-2 group text-left w-full"
                    disabled={isProcessing}
                  >
                    <span className="text-base font-bold truncate" style={{ color: "var(--fg)" }}>
                      {projectName || "Untitled Proposal"}
                    </span>
                    {!isProcessing && (
                      <Pencil size={13} style={{ color: "var(--fg-muted)" }} className="group-hover:text-[var(--accent)]" />
                    )}
                  </button>
                )}
                <p className="text-xs mt-0.5" style={{ color: "var(--fg-muted)" }}>Click name to rename</p>
              </div>
            </div>

            {/* File list */}
            <div style={{ borderTop: "1px solid var(--border)" }}>
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                    style={{ background: "var(--accent-muted)", color: "var(--accent)" }}>
                    {f.name.toLowerCase().endsWith(".pdf") ? "PDF" : "DOC"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--fg)" }}>{f.name}</p>
                    <p className="text-xs" style={{ color: "var(--fg-muted)" }}>{(f.size / 1024).toFixed(0)} KB</p>
                  </div>
                  {!isProcessing && (
                    <button onClick={() => removeFile(i)} className="icon-btn">
                      <X size={14} />
                    </button>
                  )}
                  {isProcessing && <Loader2 size={14} className="animate-spin" style={{ color: "var(--accent)" }} />}
                </div>
              ))}
            </div>

            {/* Add more */}
            {!isProcessing && (
              <div className="px-4 py-3" style={{ borderTop: "1px solid var(--border)" }}>
                <label htmlFor="file-upload-add" className="flex items-center gap-2 text-xs cursor-pointer transition-colors"
                  style={{ color: "var(--fg-muted)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--fg-muted)")}
                  onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
                >
                  <input id="file-upload-add" ref={addMoreRef} type="file" accept=".pdf,.docx"
                    multiple className="sr-only"
                    onChange={(e) => e.target.files && addFiles(e.target.files)} />
                  <Plus size={14} />
                  Add another document (scope, SOW, addendum…)
                </label>
              </div>
            )}

            {/* Processing indicator */}
            {isProcessing && (
              <div className="px-4 py-3 flex items-center gap-3" style={{ borderTop: "1px solid var(--border)", background: "var(--accent-muted)" }}>
                <Loader2 size={16} className="animate-spin shrink-0" style={{ color: "var(--accent)" }} />
                <div>
                  <p className="text-xs font-semibold" style={{ color: "var(--accent)" }}>
                    {stage === "uploading" ? "Uploading & extracting text…" : "Clawbot is analysing the RFP…"}
                  </p>
                  <p className="text-xs" style={{ color: "var(--fg-muted)" }}>This may take 20–40 seconds</p>
                </div>
              </div>
            )}

            {/* Actions */}
            {!isProcessing && (
              <div className="px-4 py-3 flex items-center justify-between" style={{ borderTop: "1px solid var(--border)" }}>
                <button onClick={reset} className="text-xs" style={{ color: "var(--fg-muted)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--fg)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--fg-muted)")}>
                  Cancel
                </button>
                <button onClick={handleCreate} disabled={files.length === 0} className="btn-primary">
                  <UploadCloud size={15} />
                  Create Proposal
                </button>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="auth-error">{error}</div>
        )}
      </div>

      {/* How it works */}
      {stage === "idle" && (
        <div className="mt-10 grid grid-cols-3 gap-4 w-full">
          {[
            { icon: UploadCloud, label: "Upload RFP", desc: "PDF or DOCX, multiple files OK" },
            { icon: Brain, label: "Clawbot Analyses", desc: "Scope, SLA, timeline extracted" },
            { icon: CheckSquare, label: "Generate & Refine", desc: "10 sections with your feedback" },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="card p-4 text-center">
              <div className="w-8 h-8 rounded-lg mx-auto mb-3 flex items-center justify-center"
                style={{ background: "var(--accent-muted)" }}>
                <Icon size={16} style={{ color: "var(--accent)" }} />
              </div>
              <p className="text-xs font-semibold mb-1" style={{ color: "var(--fg)" }}>{label}</p>
              <p className="text-xs" style={{ color: "var(--fg-muted)" }}>{desc}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
