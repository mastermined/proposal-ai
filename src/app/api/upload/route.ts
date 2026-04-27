import { NextRequest, NextResponse } from "next/server";
import { db, proposals } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import type { RFPFile } from "@/lib/db/schema";

export const runtime = "nodejs";
export const maxDuration = 30;

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

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    // Accept multiple files under the key "files"
    const files = formData.getAll("files") as File[];
    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided." }, { status: 400 });
    }

    // Optional project name — falls back to first filename (without extension)
    const rawName = (formData.get("name") as string | null)?.trim();
    const defaultName = files[0].name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");
    const projectName = rawName || defaultName;

    // Extract text from every uploaded file and combine
    const parts: string[] = [];
    const filesMeta: RFPFile[] = [];

    for (const file of files) {
      const text = await extractText(file);
      if (!text.trim()) {
        return NextResponse.json(
          { error: `Could not extract text from "${file.name}". It may be a scanned image PDF.` },
          { status: 422 }
        );
      }
      // Label each document section clearly for Clawbot
      if (files.length > 1) {
        parts.push(`\n\n════ DOCUMENT: ${file.name} ════\n\n${text}`);
      } else {
        parts.push(text);
      }
      filesMeta.push({
        name: file.name,
        size: file.size,
        type: file.name.toLowerCase().endsWith(".pdf") ? "pdf" : "docx",
      });
    }

    const combinedText = parts.join("\n\n");

    // Tag the proposal with the current user's ID
    const session = await getSession();
    const userId = session?.sub ?? undefined;
    const [proposal] = await db
      .insert(proposals)
      .values({
        name: projectName,
        rfpFilename: files[0].name,
        rfpFiles: filesMeta,
        rfpText: combinedText,
        status: "analyzing",
        userId,
      })
      .returning();

    return NextResponse.json({
      proposalId: proposal.id,
      name: proposal.name,
      filename: files[0].name,
      fileCount: files.length,
      textLength: combinedText.length,
    });
  } catch (error) {
    console.error("[upload]", error);
    const msg = error instanceof Error ? error.message : "Upload failed. Please try again.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
