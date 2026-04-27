import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { proposals, sections } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  PageBreak,
  AlignmentType,
} from "docx";
import { SECTION_NAMES } from "@/lib/prompts/sections";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const proposalId = searchParams.get("proposalId");

    if (!proposalId) {
      return NextResponse.json({ error: "proposalId required" }, { status: 400 });
    }

    const proposal = await db.query.proposals.findFirst({
      where: eq(proposals.id, proposalId),
    });
    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    const approvedSections = await db.query.sections.findMany({
      where: eq(sections.proposalId, proposalId),
      orderBy: [asc(sections.sectionNumber)],
    });

    // Build DOCX document
    const docSections: Paragraph[] = [];

    // Title page
    docSections.push(
      new Paragraph({
        text: "FPT SOFTWARE",
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      }),
      new Paragraph({
        text: "PROPOSAL",
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      }),
      new Paragraph({
        text: proposal.rfpFilename.replace(/\.[^.]+$/, ""),
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
        children: [
          new TextRun({
            text: proposal.rfpFilename.replace(/\.[^.]+$/, ""),
            size: 28,
            color: "444444",
          }),
        ],
      }),
      new Paragraph({ children: [new PageBreak()] })
    );

    // Sections
    for (const section of approvedSections) {
      const content = section.currentContent ?? "";

      // Section heading
      docSections.push(
        new Paragraph({
          text: `Section ${section.sectionNumber}: ${section.sectionName}`,
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 },
        })
      );

      // Parse markdown-ish content into paragraphs
      const lines = content.split("\n");
      for (const line of lines) {
        if (line.startsWith("## ")) {
          docSections.push(
            new Paragraph({
              text: line.replace("## ", ""),
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 200, after: 100 },
            })
          );
        } else if (line.startsWith("### ")) {
          docSections.push(
            new Paragraph({
              text: line.replace("### ", ""),
              heading: HeadingLevel.HEADING_3,
              spacing: { before: 160, after: 80 },
            })
          );
        } else if (line.startsWith("- ") || line.startsWith("* ")) {
          docSections.push(
            new Paragraph({
              text: line.replace(/^[-*] /, ""),
              bullet: { level: 0 },
              spacing: { after: 80 },
            })
          );
        } else if (line.trim()) {
          // Strip basic markdown bold
          const cleaned = line.replace(/\*\*(.*?)\*\*/g, "$1");
          docSections.push(
            new Paragraph({
              text: cleaned,
              spacing: { after: 120 },
            })
          );
        }
      }

      // Page break between sections (except last)
      if (section.sectionNumber < approvedSections.length) {
        docSections.push(new Paragraph({ children: [new PageBreak()] }));
      }
    }

    const doc = new Document({
      sections: [{ properties: {}, children: docSections }],
      creator: "FPT Proposal AI",
      title: `FPT Proposal — ${proposal.rfpFilename}`,
    });

    const buffer = await Packer.toBuffer(doc);
    const filename = `FPT_Proposal_${Date.now()}.docx`;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("[export]", error);
    return NextResponse.json(
      { error: "Export failed. Please try again." },
      { status: 500 }
    );
  }
}
