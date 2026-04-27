import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { proposals } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { RFPFile } from "@/lib/db/schema";

export const runtime = "nodejs";
export const maxDuration = 60;

async function extractText(file: File): Promise<string> {
  const filename = file.name.toLowerCase();
  const buffer = Buffer.from(await file.arrayBuffer());

  if (filename.endsWith(".pdf")) {
    const pdfParse = (await import("pdf-parse")).default;
    const parsed = await pdfParse(buffer);
    return parsed.text;
  }

  if (filename.endsWith(".docx")) {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  throw new Error(`Unsupported file type: ${file.name}. Use PDF or DOCX.`);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Load existing proposal
    const proposal = await db.query.proposals.findFirst({
      where: eq(proposals.id, id),
    });

    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided." }, { status: 400 });
    }

    // Extract text from new files
    const newParts: string[] = [];
    const newFilesMeta: RFPFile[] = [];

    for (const file of files) {
      const text = await extractText(file);
      if (!text.trim()) {
        return NextResponse.json(
          { error: `Could not extract text from "${file.name}". It may be a scanned image PDF.` },
          { status: 422 }
        );
      }
      newParts.push(`\n\n════ DOCUMENT: ${file.name} ════\n\n${text}`);
      newFilesMeta.push({
        name: file.name,
        size: file.size,
        type: file.name.toLowerCase().endsWith(".pdf") ? "pdf" : "docx",
      });
    }

    // Merge with existing data
    const existingFiles: RFPFile[] = Array.isArray(proposal.rfpFiles)
      ? (proposal.rfpFiles as RFPFile[])
      : [{ name: proposal.rfpFilename, size: 0, type: "pdf" }];

    const mergedFiles = [...existingFiles, ...newFilesMeta];
    const mergedText = proposal.rfpText + newParts.join("\n\n");

    await db
      .update(proposals)
      .set({
        rfpFiles: mergedFiles,
        rfpText: mergedText,
        // Reset to analyzing so Clawbot re-reads the new context
        status: "analyzing",
      })
      .where(eq(proposals.id, id));

    return NextResponse.json({
      ok: true,
      totalFiles: mergedFiles.length,
      addedFiles: newFilesMeta.length,
    });
  } catch (error) {
    console.error("[add-documents POST]", error);
    const msg = error instanceof Error ? error.message : "Upload failed.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
