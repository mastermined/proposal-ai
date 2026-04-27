"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Pencil, Check, X, Loader2 } from "lucide-react";

interface Props {
  proposalId: string;
  initialName: string;
  rfpFilename: string;
  typeLabel: string;
  approvedCount: number;
}

export function ProposalHeader({ proposalId, initialName, rfpFilename, typeLabel, approvedCount }: Props) {
  const [name, setName] = useState(initialName);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(initialName);
  const [saving, setSaving] = useState(false);

  const startEdit = () => { setDraft(name); setEditing(true); };
  const cancelEdit = () => { setEditing(false); setDraft(name); };

  const saveEdit = async () => {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === name) { setEditing(false); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/proposals/${proposalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      if (res.ok) setName(trimmed);
    } finally { setSaving(false); setEditing(false); }
  };

  return (
    <div className="mb-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs mb-3" style={{ color: "var(--fg-muted)" }}>
        <Link href="/proposals" className="hover:text-foreground transition-colors">My Proposals</Link>
        <ChevronRight size={12} />
        <span className="truncate max-w-[220px]" style={{ color: "var(--fg-2)" }}>{name}</span>
      </div>

      {/* Title with inline rename */}
      <div className="flex items-start gap-3">
        {editing ? (
          <div className="flex items-center gap-2 flex-1">
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") cancelEdit(); }}
              className="auth-input text-xl font-bold flex-1"
              disabled={saving}
            />
            <button onClick={saveEdit} disabled={saving}
              className="p-1.5 rounded-lg text-white transition-colors disabled:opacity-50"
              style={{ background: "var(--accent)" }} title="Save name">
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
            </button>
            <button onClick={cancelEdit} className="icon-btn" title="Cancel">
              <X size={15} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 group">
            <h1 className="text-xl font-bold tracking-tight" style={{ color: "var(--fg)", letterSpacing: "-0.02em" }}>{name}</h1>
            <button onClick={startEdit}
              className="opacity-0 group-hover:opacity-100 icon-btn transition-all"
              title="Rename proposal">
              <Pencil size={13} />
            </button>
          </div>
        )}
      </div>

      {/* Subtitle */}
      <div className="flex items-center gap-3 mt-2">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
          style={{ background: "var(--accent-muted)", color: "var(--accent)" }}>
          {typeLabel}
        </span>
        <span className="text-xs" style={{ color: "var(--fg-muted)" }}>
          {approvedCount}/10 sections approved
        </span>
        {rfpFilename !== name && (
          <span className="text-xs truncate" style={{ color: "var(--fg-muted)" }}>· {rfpFilename}</span>
        )}
      </div>
    </div>
  );
}
