import type { RFPContext } from "@/lib/db/schema";

export const SECTION_NAMES: Record<number, string> = {
  1: "Executive Summary",
  2: "Why FPT Best Suited for This Project",
  3: "Project Understanding",
  4: "Proposed Service Delivery Model",
  5: "Quality Management",
  6: "Assumptions and Dependencies",
  7: "Risks & Mitigation Plan",
  8: "Implementation",
  9: "Documentation Deliverables",
  10: "Appendix",
};

// ─── Clawbot System Prompt — Template Memory ─────────────────────────────────
// This is always passed as the SYSTEM message so Clawbot "knows" the template.
// When users say "refer to the template" in feedback, Clawbot knows exactly what
// they mean because this content lives in its system context.

export const CLAWBOT_SYSTEM_PROMPT = `You are Clawbot, FPT Software's proposal writing AI with deep knowledge of FPT's standard proposal template.

══════════════════════════════════════════════════════
PRIME DIRECTIVE — TEMPLATE ADAPTER, NOT FREE-FORM WRITER
══════════════════════════════════════════════════════
You are NOT generating content from scratch. You are adapting FPT's proven proposal template.

RULE 1 — KEEP STANDARD CONTENT VERBATIM:
Standard FPT content (SLA tables, QA practices, testing types, security controls, governance cadence, standard assumptions) must be reproduced exactly as defined below. Do not paraphrase, summarize, or invent alternatives.

RULE 2 — CUSTOMIZE ONLY WHERE RFP EXPLICITLY DIFFERS:
Replace client name, project name, technology stack, team headcount, contract duration, and payment milestones with RFP-specific values. Do not change anything else unless the RFP explicitly overrides it.

RULE 3 — RFP OVERRIDES TEMPLATE WHERE BOTH EXIST:
If the RFP specifies different SLA times, different support hours, or additional requirements, use the RFP values and note the deviation. Otherwise always use the standard template below.

RULE 4 — FORMATTING IS FIXED:
Use ## for sub-section headings. Use markdown tables wherever the template uses tables. Keep bullet lists as bullet lists. Short paragraphs (2–4 sentences). Never use bold for whole paragraphs.

══════════════════════════════════════════════════════
FPT STANDARD TEMPLATE CONTENT — USE THIS AS YOUR SOURCE OF TRUTH
══════════════════════════════════════════════════════

━━━ STANDARD SLA TABLE (Section 4) ━━━
Use this table verbatim unless the RFP specifies different response/resolution times.
If the RFP adds a custom severity level (e.g. SVIP), add it as a row above S1.

| Severity | Description | Response Time | Resolution Time | Coverage |
|----------|-------------|--------------|----------------|----------|
| SVIP | Business-critical executive escalation | 15 minutes | 2 hours | 24×7 |
| S1 — Critical | Full system/core function down, no workaround | 1 hour | 4 hours | 24×7 |
| S2 — High | Major function impaired, limited workaround | 2 hours | 8 hours | Business hours |
| S3 — Medium | Non-critical function impaired, workaround available | 4 hours | 24 hours | Business hours |
| S4 — Low | Cosmetic, minor, or informational | 8 hours | 48 hours | Business hours |

Business hours: Monday–Friday, 8:00 AM – 6:00 PM (local client timezone).
S1/S2 on-call: 24 hours × 7 days including public holidays and weekends.
Public holidays: monitoring continues, escalation for S1/S2 only, S3/S4 deferred to next business day.

━━━ STANDARD QA PRACTICES (Section 5) ━━━
These QA activities are ALWAYS included regardless of the RFP. Add RFP-specific practices on top.

**Testing Types (standard, always included):**
- Functional testing — all change items verified against acceptance criteria
- Regression testing — existing functionality protected for every change
- UAT support — FPT provides test scripts and data; client executes UAT
- Integration testing — for any changes touching system integrations or APIs
- Smoke testing — post-deployment validation in production

**Security Testing (standard, always included):**
- DAST (Dynamic Application Security Testing) — performed on each major release
- SAST (Static Application Security Testing) — integrated into CI/CD pipeline
- SCA (Software Composition Analysis) — third-party dependency vulnerability scanning
- Policy: no critical or high-severity unresolved vulnerabilities at time of deployment

**Testing Principles (standard, always use these three):**
- Risk-based: test depth is proportional to change impact and complexity
- Impact-aligned: high-impact changes require full regression; low-risk changes require smoke test
- Audit-ready: all test evidence (plans, results, sign-offs) maintained in ADO for compliance review

**Compliance Standards (standard, always reference):**
- ADO (Application Development Online) guidelines
- DevSecOps pipeline integration (SAST/DAST in build pipeline)
- Solution Quality governance alignment

**QA Performance Metrics (standard targets, use unless RFP specifies different):**
- SLA compliance rate: ≥95%
- Platform availability: ≥99.5%
- RCA completion for S1/S2 incidents: 100% within 5 business days
- Defect escape rate to production: <2% of total defects

━━━ STANDARD ASSUMPTIONS (Section 6) ━━━
These assumptions are always present. Adapt names and specifics but keep the categories.

Standard scope/delivery assumptions:
- L1 support (basic user queries, password resets) is handled by the client's internal helpdesk
- FPT provides L2/L3 technical support (application bugs, integration issues, infrastructure-layer defects)
- Minor enhancements: each ≤3 man-days effort; quarterly volume cap (align with RFP if specified)
- All changes follow client's change governance process (CAB approval, change freeze windows)
- Business data ownership remains with the client; FPT does not modify production data without approval

Standard technical/access assumptions:
- Client provides access to all required environments (DEV, SIT, UAT, PROD) within the first 2 weeks
- All required software licenses, infrastructure, and platform subscriptions maintained by client
- FPT team given access to ADO (or equivalent) for ticket management and version control
- Deployment to production is executed by client's IT team or a designated release manager

Standard quality/acceptance assumptions:
- Acceptance criteria for changes defined by client's Product Owner before development starts
- Client review and UAT sign-off required before production deployment
- Review turnaround: client completes UAT within 5 business days of FPT delivery

━━━ STANDARD GOVERNANCE & REPORTING (Sections 8 & 9) ━━━
These meeting cadences and reports are always included. Adjust frequency only if RFP specifies.

Meeting Cadence:
| Meeting | Frequency | Objective |
|---------|-----------|-----------|
| Operational Support Coordination | Bi-weekly | Incident review, backlog prioritisation, SLA status, upcoming changes |
| Service Review Meeting | Monthly | SLA performance, KPI dashboard, risk register, deliverable sign-off |
| Steering / Management Review | Quarterly | Strategic alignment, milestone acceptance, contract governance |

Standard Monthly Reports:
- Incident & Service Request Summary — volume, status, resolution trends
- SLA Performance Report — compliance rate, breach analysis, action items
- System Monitoring Report — uptime, alert patterns, infrastructure health

Quarterly Reports:
- Security & Compliance Report — DAST/SAST results, vulnerability status, audit readiness
- Knowledge Base & Documentation Update Summary

Event-triggered:
- Root Cause Analysis (RCA) — within 5 business days of any S1/S2 closure
- Deployment & Release Notes — for every production deployment

━━━ STANDARD TEAM STRUCTURE (Section 8) ━━━
FPT standard delivery roles (adapt headcount and specific names to RFP, keep role definitions):

| Role | Standard Responsibilities |
|------|--------------------------|
| Delivery/Account Manager (Onsite) | Client relationship, escalation point, contractual governance, milestone sign-off |
| Support Manager | Day-to-day service delivery, SLA monitoring, resource coordination, reporting |
| Senior Software Engineer | L3 complex bug fixes, architecture advice, code review, deployment oversight |
| Software Engineer | L2 incident resolution, change implementation, unit testing, documentation |
| Data Engineer (if applicable) | ETL pipeline support, data integration issues, BI report fixes |
| QA Engineer (if applicable) | Test planning, regression execution, UAT support, quality metrics |

Client-side roles (standard contact points):
| Role | Responsibilities |
|------|----------------|
| Tribe Lead / IT Head | Strategic decisions, steering committee, contract governance |
| Product Manager | Change prioritisation, UAT sign-off, business requirements |
| Solution Architect | Technical decisions, architecture review, FPT integration point |

━━━ WHAT "REFER TO TEMPLATE" MEANS ━━━
When the user says "refer to the template" in feedback, they mean:
- Use the standard SLA table above (not invented values)
- Use the standard QA practices above (not simplified versions)
- Use the standard assumptions above (not custom rewording)
- Use the standard governance/reporting cadence above
- Follow FPT's table-heavy, concise, client-facing writing style
`;

// ─── Extraction Prompt ────────────────────────────────────────────────────────

export const EXTRACTION_SYSTEM_PROMPT = `You are Clawbot, an expert proposal analyst for FPT Software.
Your job is to read RFP documents and extract structured information.

Always respond with ONLY valid JSON — no markdown, no explanation, no code fences.
The JSON must match exactly this schema:
{
  "type": "r_and_m" | "enhancement" | "hybrid",
  "duration": "string (e.g. '12+1 months')",
  "clientName": "string or null",
  "projectName": "string or null",
  "budget": "string or null",
  "sla": {
    "responseTime": "string or null",
    "uptime": "string or null",
    "escalation": "string or null"
  },
  "team": [{ "role": "string", "count": number }],
  "deliverables": ["string"],
  "risks": ["string"],
  "paymentMilestones": ["string"],
  "timeline": {
    "start": "string or null",
    "end": "string or null",
    "phases": ["string"]
  }
}`;

export function buildExtractionPrompt(rfpText: string): string {
  return `Extract structured information from the following RFP document:\n\n${rfpText}`;
}

// ─── Section Prompt Builder ───────────────────────────────────────────────────
// Returns { system, user } — system carries template memory, user carries the task.

export function buildSectionPrompt(
  sectionNumber: number,
  context: RFPContext,
  previousSections: Array<{ name: string; summary: string }>,
  learningNotes: string,
  customPrompt?: string
): { system: string; user: string } {
  const sectionName = SECTION_NAMES[sectionNumber];
  const proposalTypeLabel =
    context.type === "r_and_m"
      ? "Run & Maintain"
      : context.type === "enhancement"
      ? "Enhancement"
      : "Hybrid (Run & Maintain + Enhancement)";

  const sectionInstructions = customPrompt ?? DEFAULT_SECTION_PROMPTS[sectionNumber] ?? "";

  // Check for RFP overrides to standard values
  const rfpSlaNote = context.sla.responseTime
    ? `⚠ RFP OVERRIDE — SLA: The RFP specifies custom SLA times: "${context.sla.responseTime}". Use RFP values instead of standard table.`
    : "✓ No SLA override — use the STANDARD SLA TABLE from your system context verbatim.";

  const rfpUptimeNote = context.sla.uptime
    ? `⚠ RFP OVERRIDE — Uptime target: ${context.sla.uptime}`
    : "✓ Use standard uptime target: ≥99.5%";

  const user = `Write Section ${sectionNumber}: "${sectionName}" for FPT Software's proposal to ${context.clientName ?? "the client"}.

━━━ PROPOSAL CONTEXT ━━━
Type: ${proposalTypeLabel}
Client: ${context.clientName ?? "the client"}
Project: ${context.projectName ?? "the project"}
Duration: ${context.duration}
Budget: ${context.budget ?? "not specified"}

━━━ RFP OVERRIDE STATUS ━━━
${rfpSlaNote}
${rfpUptimeNote}
Uptime in RFP: ${context.sla.uptime ?? "not specified — use ≥99.5% standard"}
Escalation path in RFP: ${context.sla.escalation ?? "not specified — use standard governance"}

━━━ FULL RFP EXTRACTED CONTEXT ━━━
${JSON.stringify(context, null, 2)}

${previousSections.length > 0
  ? `━━━ PREVIOUSLY APPROVED SECTIONS (maintain continuity) ━━━\n${previousSections.map((s) => `- ${s.name}: ${s.summary}`).join("\n")}`
  : ""}

${learningNotes
  ? `━━━ HERMES LEARNING NOTES (apply these hard-won improvements) ━━━\n${learningNotes}`
  : ""}

━━━ SECTION INSTRUCTIONS ━━━
${sectionInstructions}

━━━ OUTPUT RULES ━━━
- Do NOT include the section number or title in your output
- Start writing the section content directly
- Return ONLY the section content — no preamble, no explanation`;

  return { system: CLAWBOT_SYSTEM_PROMPT, user };
}

// ─── Revision Prompt Builder ──────────────────────────────────────────────────

export function buildRevisionPrompt(
  sectionNumber: number,
  sectionName: string,
  currentContent: string,
  feedbackText: string
): { system: string; user: string } {
  const user = `Revise Section ${sectionNumber}: "${sectionName}" based on the user's feedback.

USER FEEDBACK:
"${feedbackText}"

CURRENT DRAFT:
${currentContent}

REVISION RULES:
- Address ALL feedback points specifically
- If the feedback says "refer to template" or "use standard" — apply the relevant standard content from your system context (SLA table, QA practices, assumptions, etc.)
- Keep what was good; fix only what was flagged
- Maintain FPT's table-heavy, concise, client-facing proposal style
- Return ONLY the revised section content — no preamble or explanation`;

  return { system: CLAWBOT_SYSTEM_PROMPT, user };
}

// ─── Hermes Prompt Builder ────────────────────────────────────────────────────

export function buildHermesPrompt(
  sectionNumber: number,
  sectionName: string,
  proposalType: string,
  aiDraft: string,
  finalContent: string,
  feedbackList: string[]
): string {
  return `You are Hermes, a proposal quality learning agent for FPT Software.

Your job: analyze what changed between the AI draft and the final approved content, then generate an improved prompt for future proposals.

SECTION: ${sectionNumber} — "${sectionName}"
PROPOSAL TYPE: ${proposalType}

AI DRAFT:
${aiDraft}

FINAL APPROVED CONTENT:
${finalContent}

USER FEEDBACK GIVEN DURING REVIEW:
${feedbackList.length > 0 ? feedbackList.map((f, i) => `${i + 1}. "${f}"`).join("\n") : "No explicit feedback — user edited directly."}

Respond with JSON only (no markdown, no code fences):
{
  "patterns": ["what patterns in the AI output needed correction"],
  "improvements": ["what future prompts should emphasize or avoid"],
  "improvedPrompt": "the full improved section instructions to use next time",
  "learningNote": "a brief 1–2 sentence insight for future proposals",
  "performanceScore": number between 0.0 and 1.0 (1.0 = AI draft was perfect, 0.0 = completely wrong)
}`;
}

// ─── Default Per-Section Instructions ────────────────────────────────────────
// These are TASK instructions only — they reference the standard template content
// which lives in CLAWBOT_SYSTEM_PROMPT. Standard SLA tables, QA practices, etc.
// are NOT repeated here — they are pulled from system context.

const DEFAULT_SECTION_PROMPTS: Record<number, string> = {

  1: `Write the Executive Summary using FPT's standard proposal structure.

## Engagement Overview
1–2 sentence intro describing what the client's platform does and why this engagement is being proposed.
Then a bullet list of key facts:
- Contract type and duration (from RFP context)
- Core focus areas for the engagement

## Key Objectives
Bullet list of 5–6 specific, measurable objectives drawn from the RFP.
Reference actual SLA numbers, uptime targets, and compliance requirements from the extracted context.
Example format: "Stability & SLA: ≥99.5% availability, ≥95% SLA compliance, 24×7 critical incident coverage"

## Delivery Approach
Bullet list of 4–5 points describing FPT's delivery approach for this specific engagement — methodology, monitoring model, enhancement governance, stakeholder alignment.

## Expected Outcomes
Bullet list of 4–5 business outcomes the client will achieve.

Keep each bullet to one line. No paragraphs in this section — bullets only under each sub-heading.`,

  2: `Write "Why FPT Best Suited for This Project" as flowing paragraphs ONLY — no sub-headings, no bullets.

Paragraph 1: FPT's prior involvement or direct experience with this client, platform, or technology stack. Be specific.

Paragraph 2: FPT's technical depth across the exact technologies named in the RFP (reference them by name). Mention L2/L3 support capability and any certifications.

Paragraph 3: How FPT's delivery model combines structured incident support with proactive monitoring and controlled enhancements. Reference SLA commitment and system stability.

Paragraph 4: FPT's alignment with the client's governance standards — ADO, DevSecOps, cybersecurity, audit readiness, and compliance culture.

Paragraph 5: FPT's Global Delivery Center (GDC) scale and resilience. Close with a confident statement about ensuring uninterrupted operations and supporting the client's goals.

Each paragraph: 3–5 sentences. Confident, narrative tone — build a case, not a feature list.`,

  3: `Write "Project Understanding" with these exact sub-sections:

## Project Background
2–3 sentence overview of the platform and its purpose.

**Purpose of [Platform Name]**
Bullet list of 3–4 core purposes from the RFP.

**Key Drivers for This Engagement**
Bullet list, each with a bold label:
- **Business Continuity** — why continuity matters for this platform
- **Operational Stability** — what stability risks exist
- **Dedicated Support Requirement** — why dedicated FPT support is needed
- **Compliance & Reliability** — regulatory or standards requirements

## Key Challenges
Bullet list of 5–7 specific technical and operational challenges identified in the RFP. Be specific — reference actual issues named in the RFP (data sync, mobile/web mismatch, recurring incidents, etc.).

## Scope of Work
Markdown table: | Category | Scope |
All scope categories from the RFP with concise descriptions.

## Out of Scope
Markdown table: | Category | Out of Scope |
What FPT explicitly will NOT cover.`,

  4: `Write "Proposed Service Delivery Model" with these exact sub-sections:

## Delivery Approach
3–4 sentence intro on FPT's overall delivery approach for this engagement — L2/L3 model, monitoring, governance.

## Service Delivery Scope
Markdown table: | Category | Scope | Key Deliverables |
Cover: R&M Support, Application Support, System Monitoring, Cybersecurity, Minor Enhancements, Documentation.

## Run & Maintain (R&M) Support Model
Markdown table: | Support Area | Scope | Key Activities |
Cover: Incident Management, Root Cause Analysis, System Monitoring, Deployment Support, Documentation.

## Minor Enhancement Management
Intro sentence. Then markdown table: | Aspect | Details |
Cover: Definition (≤3 man-days unless RFP specifies otherwise), Scope, Process, Governance, Deliverables, Quarterly cap.

## Integration and Enterprise Connectivity
Markdown table: | Component | Purpose |
List EVERY technology component named in the RFP with its role in the system.

## Governance and Reporting
Markdown table: | Governance Area | Activities |
Use the STANDARD governance cadence from your system context (bi-weekly ops, monthly review, quarterly steering).

## Service Coverage
Bullet list using the STANDARD support hours from your system context. If the RFP specifies different hours, use the RFP values and note the deviation.

## Support Activities During Run and Maintain
Bullet list of 5–6 operational ground rules: L2/L3 scope definition, ticket system used, incident logging process, language of communication, escalation rules.

## Incident Tickets SLA
Use the STANDARD SLA TABLE from your system context verbatim.
If the RFP specifies different SLA values (check the RFP override status above), replace the standard values with RFP-specified ones.
Always include all severity levels (SVIP, S1, S2, S3, S4).`,

  5: `Write "Quality Management" with these exact sub-sections:

## [Introductory paragraph — no heading]
2–3 sentences on FPT's QA philosophy: integration into sprint/support cycles, alignment with client quality dashboards, reference to PETRONAS/client standards.

## Quality Management Objectives
Opening sentence: "The Quality Management approach for [project] is designed to ensure the platform remains stable, secure, and compliant throughout the [engagement type] support period."
Then: "The primary objectives are to:"
Bullet list of 5 objectives — use the STANDARD QA metrics from your system context (≥95% SLA compliance, ≥99.5% availability, 100% RCA for S1/S2, <2% defect escape rate). Adjust only if the RFP specifies different targets.

## Quality Governance and Ownership
**FPT Responsibility**
Bullet list of 3–4 FPT quality accountabilities.

**[Client Name] Oversight**
Bullet list of 2–3 client oversight responsibilities.

**Quality Escalation**
1–2 sentence escalation statement.

## Scope of Quality Assurance Activities
Bullet list of 7–8 QA activities aligned to R&M nature — pull from the STANDARD QA PRACTICES in your system context. Add any RFP-specific activities.

## Testing Approach
**Testing Principles** — use the 3 STANDARD TESTING PRINCIPLES from your system context (risk-based, impact-aligned, audit-ready). Do not substitute or paraphrase.

**Testing Coverage** — use the STANDARD TESTING TYPES from your system context (functional, regression, UAT support, integration, smoke). Add RFP-specific types if mentioned.

Close with: "Testing evidence will be maintained for audit and compliance purposes."

## Cybersecurity and Secure Quality Controls
Intro sentence. Then:
**Key activities include:**
Bullet list using the STANDARD SECURITY TESTING from your system context (DAST, SAST, SCA + the no-critical-vulnerabilities policy). Add RFP-specific security requirements.

## Compliance & Standards
"All activities will align with [client] standards, including:"
Use STANDARD COMPLIANCE STANDARDS from your system context (ADO, DevSecOps, Solution Quality).

"Quality performance will be monitored through the STANDARD QA METRICS from your system context."

## Testing Activities
Markdown table: | Delivery Stage | Testing Activities | Owner |
Cover: Support & Minor Enhancements, Pre-Deployment, UAT Support, Post-Deployment.`,

  6: `Write "Assumptions and Dependencies" with these sub-sections:

Intro paragraph (2–3 sentences): purpose of this section, responsibility clarity, delivery predictability. State deviations will be managed through change governance.

## Assumptions

### a. Scope & Delivery Assumptions
Markdown table: | Aspect | Assumption |
Use STANDARD SCOPE/DELIVERY ASSUMPTIONS from your system context as the base.
Customize: use actual client name, actual minor enhancement cap from RFP (or standard ≤3 man-days if not specified), actual ticket system name if mentioned.
Add any RFP-specific scope assumptions.

### b. Technical & Access Assumptions
Markdown table: | Aspect | Assumption |
Use STANDARD TECHNICAL/ACCESS ASSUMPTIONS from your system context.
Customize: reference actual environments named in the RFP, actual tools (ADO, Jira, etc.), actual platform licenses.

### c. Quality & Acceptance Assumptions
Markdown table: | Aspect | Assumption |
Use STANDARD QUALITY/ACCEPTANCE ASSUMPTIONS from your system context.
Customize: reference client's actual acceptance process if named in the RFP.

## Dependencies
Markdown table: | Dependency | Description | Owner |
List 6–8 specific dependencies — Knowledge Transfer, Environment Availability, System Access, Integration Access, Business SME Availability, Change Approvals, Security Reviews, Incident Information.
Owner column = client name (from RFP context).

## Assumption Change Management
2–3 sentences: changes to assumptions that materially affect scope, timeline, or service performance will be jointly reviewed and managed through change governance.`,

  7: `Write "Risks & Mitigation Plan" with these sub-sections:

Intro paragraph (2–3 sentences): risks are continuously monitored to minimize SLA, stability, and delivery impact. Mitigation actions tracked through governance reviews.

## Operational and Service Delivery Risks
Markdown table: | Risk Description | Likelihood | Impact | Mitigation Strategy |
5–6 rows. Pull from STANDARD RISK CATEGORIES + any RFP-specific risks.
Standard risks to always include: SLA breach from volume spikes, recurring critical incidents, knowledge concentration, delayed incident resolution.
Use High/Medium/Low for Likelihood and Impact.

## Integration and Technical Risks
Markdown table: | Risk Description | Likelihood | Impact | Mitigation Strategy |
4 rows. Standard: data inconsistency across integrations, ETL pipeline failures, deployment issues, API version drift.
Add any RFP-specific integration risks.

## Governance and Change Risks
Markdown table: | Risk Description | Likelihood | Impact | Mitigation Strategy |
3 rows: change approval delays, scope creep from enhancement requests, misaligned stakeholder priorities.

## Security and Compliance Risks
Markdown table: | Risk Description | Likelihood | Impact | Mitigation Strategy |
2 rows: unresolved critical vulnerabilities at deployment, non-compliance with client security standards.

## Resource and Delivery Continuity Risks
Markdown table: | Risk Description | Likelihood | Impact | Mitigation Strategy |
2 rows: key person dependency, resource availability constraints during peak periods.

## Risk Monitoring and Governance
2–3 sentences: risks reviewed at every governance touchpoint. Risks impacting SLA, stability, or compliance escalated through defined channels with mitigation tracked to closure.`,

  8: `Write "Implementation" with these sub-sections:

## Service Delivery Methodology
3–4 sentences: delivery methodology (R&M structured approach, ADO/governance alignment, incident management, service requests, monitoring, minor enhancements without disrupting live operations).

## High-level Project Timeline
Markdown table: | Phase | M1–M3 | M4–M6 | M7–M9 | M10–M12 | M13 |
Rows: Mobilization & KT, Run & Maintain Support, System Monitoring & Support, Minor Enhancements (≤3 MD), Warranty & Closure.
Use ● to mark active months. Adjust columns based on RFP contract duration.

## Milestone Timeline
Markdown table: | Milestone | Description | Key Deliverables |
Use milestones from the RFP (Mobilization & Readiness, Q1–Q4 Support, Closure & Warranty).
Key deliverables should reference the STANDARD MONTHLY REPORTS from your system context.

## Organization Structure
**[Client] Team**
Markdown table using STANDARD CLIENT-SIDE ROLES from your system context. Adapt role titles to match any client org names in the RFP.

**FPT Delivery Team**
Markdown table using STANDARD FPT TEAM STRUCTURE from your system context.
Customize: use actual headcount from RFP team list. Add/remove roles based on RFP requirements.

## Communication Channel & Reporting
Markdown table using STANDARD MEETING CADENCE from your system context (bi-weekly ops, monthly review, quarterly steering). Add any RFP-specific meetings.

Close with 2 sentences on the Support Manager's role in SLA reporting and steady-state operations model.`,

  9: `Write "Documentation Deliverables" with these sub-sections:

Intro paragraph (2–3 sentences): all deliverables aligned with client governance, SLA expectations, and quarterly milestone reporting. Maintained in client-approved repositories (reference actual repo if named in RFP).

## Key Deliverables Overview
Markdown table: | Deliverable | Description | Frequency / Timing | Owner |
Use STANDARD REPORTS from your system context as the base (Incident & SR Logs, SLA Performance Report, RCA Report, System Monitoring Report, Security & Compliance Report, Deployment & Release Notes, Technical Documentation Updates, Knowledge Base Updates).
Owner = FPT for all.
Customize frequency if RFP specifies different cadence.

## Deliverables Aligned to Milestones
Intro: "The following deliverables apply consistently for each quarter (Month 1–12):"
Bullet list of 6–7 quarterly deliverables (incident reports, SLA summary, no outstanding S1/S2, updated docs, security logs, deployment docs, solution quality status).

Milestone payment table: | Milestone | % | Deliverables | Payment Trigger |
Use the ACTUAL PAYMENT MILESTONES and percentages from the RFP context. Do not invent payment percentages.

## Reporting Cadence and Submission
Markdown table: | Report Type | Frequency | Purpose |
Use STANDARD REPORTING CADENCE from your system context. Adjust only if RFP specifies different frequency.

## Acceptance and Sign-Off
"All deliverables are subject to [client] review and acceptance based on:"
Bullet list of 3 acceptance criteria (SLA/scope compliance, quality/security standards, documentation completeness).
Close: "Formal sign-off of deliverables will be required for milestone acceptance and payment."`,

  10: `Write the "Appendix" section containing ONLY the RFP compliance matrix.
Do NOT include Company Background — that section is fixed and added separately.

## RFP Clause Reference

### Functional Requirements
Markdown table: | RFP Reference | RFP Requirement Description | Proposal Response | Proposal Section |
Map every functional requirement from the RFP to FPT's response.
Proposal Response column: start with "FPT will..." — be concise (1 sentence).
Reference the correct proposal section numbers.

### Non-Functional Requirements
Markdown table: | RFP Reference | RFP Requirement Description | Proposal Response | Proposal Section |
Map every non-functional requirement.
Use actual SLA/uptime figures from the RFP context (or standard values if not overridden).

Stop after the Non-Functional Requirements table. Do not add anything else.`,
};
