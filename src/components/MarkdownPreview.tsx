"use client";

import { useMemo } from "react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderInline(text: string): string {
  return escapeHtml(text)
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>");
}

function isSeparatorRow(line: string): boolean {
  const cells = line.split("|").slice(1, -1);
  return cells.length > 0 && cells.every((c) => /^[\s:-]+$/.test(c));
}

function renderTable(tableLines: string[]): string {
  const rows = tableLines.filter((l) => !isSeparatorRow(l));
  if (rows.length === 0) return "";

  const parseRow = (line: string): string[] =>
    line.split("|").slice(1, -1).map((c) => c.trim());

  const [headerRow, ...bodyRows] = rows;
  const headerCells = parseRow(headerRow);
  const thead = `<thead><tr>${headerCells
    .map((c) => `<th>${renderInline(c)}</th>`)
    .join("")}</tr></thead>`;

  const tbody = `<tbody>${bodyRows
    .map(
      (row) =>
        `<tr>${parseRow(row)
          .map((c) => `<td>${renderInline(c)}</td>`)
          .join("")}</tr>`
    )
    .join("")}</tbody>`;

  return `<table class="md-table">${thead}${tbody}</table>`;
}

// ─── Core renderer ────────────────────────────────────────────────────────────

export function markdownToHtml(markdown: string): string {
  const lines = markdown.split("\n");
  const blocks: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // ── Table block ──────────────────────────────────────────────────────────
    if (line.trim().startsWith("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        tableLines.push(lines[i]);
        i++;
      }
      blocks.push(renderTable(tableLines));
      continue;
    }

    // ── Fenced code block ────────────────────────────────────────────────────
    if (line.trim().startsWith("```")) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++;
      blocks.push(
        `<pre class="md-pre"><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`
      );
      continue;
    }

    // ── Headings ─────────────────────────────────────────────────────────────
    if (line.startsWith("#### ")) {
      blocks.push(`<h4 class="md-h4">${renderInline(line.slice(5))}</h4>`);
      i++; continue;
    }
    if (line.startsWith("### ")) {
      blocks.push(`<h3 class="md-h3">${renderInline(line.slice(4))}</h3>`);
      i++; continue;
    }
    if (line.startsWith("## ")) {
      blocks.push(`<h2 class="md-h2">${renderInline(line.slice(3))}</h2>`);
      i++; continue;
    }
    if (line.startsWith("# ")) {
      blocks.push(`<h1 class="md-h1">${renderInline(line.slice(2))}</h1>`);
      i++; continue;
    }

    // ── Horizontal rule ───────────────────────────────────────────────────────
    if (line.trim().match(/^[-*_]{3,}$/)) {
      blocks.push('<hr class="md-hr" />');
      i++; continue;
    }

    // ── Unordered list ────────────────────────────────────────────────────────
    if (line.match(/^[-*+] /)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^[-*+] /)) {
        items.push(`<li>${renderInline(lines[i].replace(/^[-*+] /, ""))}</li>`);
        i++;
      }
      blocks.push(`<ul class="md-ul">${items.join("")}</ul>`);
      continue;
    }

    // ── Ordered list ─────────────────────────────────────────────────────────
    if (line.match(/^\d+\. /)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^\d+\. /)) {
        items.push(
          `<li>${renderInline(lines[i].replace(/^\d+\. /, ""))}</li>`
        );
        i++;
      }
      blocks.push(`<ol class="md-ol">${items.join("")}</ol>`);
      continue;
    }

    // ── Empty line ────────────────────────────────────────────────────────────
    if (line.trim() === "") {
      i++; continue;
    }

    // ── Paragraph ─────────────────────────────────────────────────────────────
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].trim().startsWith("|") &&
      !lines[i].startsWith("#") &&
      !lines[i].match(/^[-*+] /) &&
      !lines[i].match(/^\d+\. /) &&
      !lines[i].trim().startsWith("```") &&
      !lines[i].trim().match(/^[-*_]{3,}$/)
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length > 0) {
      blocks.push(`<p class="md-p">${renderInline(paraLines.join("<br/>"))}</p>`);
    }
  }

  return blocks.join("\n");
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  content: string;
  className?: string;
}

export function MarkdownPreview({ content, className }: Props) {
  const html = useMemo(() => markdownToHtml(content), [content]);
  return (
    <div
      className={`markdown-preview ${className ?? ""}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
