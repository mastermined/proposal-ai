"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  CheckCircle2,
  Loader2,
  RotateCcw,
  ChevronLeft,
  Sparkles,
  Eye,
  Pencil,
  Copy,
  Check,
} from "lucide-react";
import { SECTION_NAMES } from "@/lib/prompts/sections";
import { cn } from "@/lib/utils/cn";
import Link from "next/link";
import { MarkdownPreview } from "@/components/MarkdownPreview";

type SectionStatus = "pending" | "draft" | "in_review" | "approved";

interface SectionData {
  id: string;
  sectionNumber: number;
  sectionName: string;
  currentContent: string;
  aiDraft: string;
  status: SectionStatus;
  revisionCount: number;
}

export default function SectionEditorPage() {
  const params = useParams<{ id: string; num: string }>();
  const router = useRouter();
  const proposalId = params.id;
  const sectionNumber = parseInt(params.num);
  const sectionName = SECTION_NAMES[sectionNumber] ?? "Section";

  const [section, setSection] = useState<SectionData | null>(null);
  const [content, setContent] = useState("");
  const [feedback, setFeedback] = useState("");
  const [generating, setGenerating] = useState(false);
  const [revising, setRevising] = useState(false);
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState<"edit" | "preview">("preview");
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Auto-save debounced (silent — no feedback capture, no Hermes)
  const autoSave = useCallback(
    (newContent: string) => {
      if (!section) return;
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        await fetch("/api/save-section", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sectionId: section.id, content: newContent }),
        });
      }, 2000);
    },
    [section]
  );

  // Load existing section — auto-generate if no content yet
  useEffect(() => {
    const load = async () => {
      const res = await fetch(`/api/sections/${proposalId}/${sectionNumber}`);
      if (res.ok) {
        const data = await res.json();
        setSection(data);
        const existing = data.currentContent ?? "";
        setContent(existing);
        // Auto-generate if the section exists but has never been generated
        if (!existing) generate();
      } else {
        // Section row doesn't exist yet — generate fresh
        generate();
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proposalId, sectionNumber]);

  const generate = async () => {
    setGenerating(true);
    setError("");
    setContent("");

    try {
      const res = await fetch("/api/generate-section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposalId, sectionNumber }),
      });

      if (!res.body) throw new Error("No stream");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.chunk) {
                full += data.chunk;
                setContent(full);
              }
              if (data.done && data.sectionId) {
                setSection((prev) =>
                  prev
                    ? { ...prev, id: data.sectionId, status: "draft" }
                    : {
                        id: data.sectionId,
                        sectionNumber,
                        sectionName,
                        currentContent: full,
                        aiDraft: full,
                        status: "draft",
                        revisionCount: 0,
                      }
                );
              }
              if (data.error) setError(data.error);
            } catch {
              // skip malformed SSE lines
            }
          }
        }
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setGenerating(false);
    }
  };

  const revise = async () => {
    if (!section || !feedback.trim()) return;
    setRevising(true);
    setError("");

    try {
      const res = await fetch("/api/revise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionId: section.id,
          feedbackText: feedback,
          currentContent: content,
        }),
      });

      if (!res.body) throw new Error("No stream");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "";
      setContent("");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.chunk) {
                full += data.chunk;
                setContent(full);
              }
              if (data.done) {
                setSection((prev) =>
                  prev
                    ? { ...prev, status: "in_review", revisionCount: (prev.revisionCount ?? 0) + 1 }
                    : prev
                );
                setFeedback("");
              }
            } catch {
              // skip
            }
          }
        }
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setRevising(false);
    }
  };

  const approve = async () => {
    if (!section) return;
    setApproving(true);
    setError("");

    try {
      const res = await fetch("/api/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionId: section.id }),
      });
      const data = await res.json();
      if (data.approved) {
        if (data.isComplete) {
          router.push(`/proposals/${proposalId}?complete=true`);
        } else {
          router.push(`/proposals/${proposalId}/sections/${data.nextSection}`);
        }
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setApproving(false);
    }
  };

  const isLoading = generating || revising || approving;

  const copyToClipboard = async () => {
    if (!previewRef.current) return;
    try {
      // Copy as HTML so Word preserves table formatting
      const html = previewRef.current.innerHTML;
      const blob = new Blob([html], { type: "text/html" });
      const text = previewRef.current.innerText;
      const textBlob = new Blob([text], { type: "text/plain" });
      await navigator.clipboard.write([
        new ClipboardItem({ "text/html": blob, "text/plain": textBlob }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: copy plain text
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href={`/proposals/${proposalId}`} className="hover:text-foreground flex items-center gap-1">
          <ChevronLeft size={14} />
          Back to proposal
        </Link>
        <span>·</span>
        <span>Section {sectionNumber}: {sectionName}</span>
        {section && (
          <>
            <span>·</span>
            <span className={cn(
              "capitalize",
              section.status === "approved" ? "text-green-600" :
              section.status === "in_review" ? "text-yellow-600" :
              "text-fpt"
            )}>
              {section.status.replace("_", " ")}
            </span>
          </>
        )}
      </div>

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">
          {sectionNumber}. {sectionName}
        </h1>
        <div className="flex items-center gap-2">
          {/* Show Generate before first generation, Regenerate after */}
          {(!section || !content) && !generating ? (
            <button
              onClick={generate}
              disabled={isLoading}
              className="flex items-center gap-1.5 text-xs bg-fpt hover:bg-fpt-hover text-white font-medium border border-blue-600 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-40"
            >
              <Sparkles size={13} />
              Generate
            </button>
          ) : section && content ? (
            <button
              onClick={generate}
              disabled={isLoading}
              title="Discard and regenerate from scratch"
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border rounded-lg px-3 py-1.5 transition-colors disabled:opacity-40"
            >
              <RotateCcw size={13} />
              Regenerate
            </button>
          ) : null}
          <button
            onClick={approve}
            disabled={!section || section.status === "approved" || isLoading}
            className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-40"
          >
            {approving ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <CheckCircle2 size={15} />
            )}
            Approve & Continue
          </button>
        </div>
      </div>

      {/* Main editor */}
      <div className="border rounded-xl overflow-hidden bg-white shadow-sm mb-4">

        {/* Tab bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b bg-gray-50">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setViewMode("preview")}
              className={cn(
                "flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md transition-colors",
                viewMode === "preview"
                  ? "bg-white text-gray-900 shadow-sm border"
                  : "text-gray-500 hover:text-gray-800"
              )}
            >
              <Eye size={12} />
              Preview
            </button>
            <button
              onClick={() => setViewMode("edit")}
              className={cn(
                "flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md transition-colors",
                viewMode === "edit"
                  ? "bg-white text-gray-900 shadow-sm border"
                  : "text-gray-500 hover:text-gray-800"
              )}
            >
              <Pencil size={12} />
              Edit (raw)
            </button>
          </div>

          {/* Copy button — only in preview mode with content */}
          {viewMode === "preview" && content && !generating && (
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 border rounded-md px-2.5 py-1.5 transition-colors bg-white"
              title="Copy as formatted HTML (paste directly into Word)"
            >
              {copied ? (
                <><Check size={12} className="text-green-500" /> Copied!</>
              ) : (
                <><Copy size={12} /> Copy for Word</>
              )}
            </button>
          )}
        </div>

        {/* Generating banner */}
        {generating && (
          <div className="flex items-center gap-3 px-6 py-3 bg-fpt-muted border-b">
            <Sparkles size={16} className="text-fpt animate-pulse shrink-0" />
            <p className="text-sm text-blue-700 font-medium">
              {content ? "Clawbot is writing…" : "Clawbot is thinking…"}
            </p>
          </div>
        )}

        {/* Preview pane */}
        {viewMode === "preview" && (
          <div
            ref={previewRef}
            className="min-h-[520px] p-6 overflow-auto"
          >
            {content ? (
              generating ? (
                // While streaming: plain pre-wrap text — no markdown parsing to avoid freezing
                <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans text-gray-800">
                  {content}
                </pre>
              ) : (
                // Generation done: full markdown render with tables
                <MarkdownPreview content={content} />
              )
            ) : !generating ? (
              <p className="text-sm text-gray-400 italic">Content will appear here after generation.</p>
            ) : null}
          </div>
        )}

        {/* Edit pane */}
        {viewMode === "edit" && (
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              autoSave(e.target.value);
            }}
            disabled={generating || approving}
            placeholder="Content will appear here…"
            className="w-full min-h-[520px] p-6 text-sm font-mono leading-relaxed resize-none focus:outline-none disabled:opacity-70 disabled:cursor-default"
          />
        )}
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Feedback */}
      {section && section.status !== "approved" && (
        <div className="border rounded-xl p-4 bg-gray-50">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Feedback for Clawbot
          </label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="e.g. Make the tone more technical. Add more detail about SLA response times. Shorten the intro."
            rows={3}
            className="w-full border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
          <div className="mt-2 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {section.revisionCount > 0
                ? `${section.revisionCount} revision(s) so far`
                : "No revisions yet"}
            </p>
            <button
              onClick={revise}
              disabled={!feedback.trim() || isLoading}
              className="flex items-center gap-1.5 bg-fpt hover:bg-fpt-hover text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-40"
            >
              {revising ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <RotateCcw size={15} />
              )}
              Revise
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
