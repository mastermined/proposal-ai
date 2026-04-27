import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  real,
  timestamp,
  pgEnum,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const userRoleEnum = pgEnum("user_role", ["admin", "user"]);

export const proposalStatusEnum = pgEnum("proposal_status", [
  "uploading",
  "analyzing",
  "generating",
  "reviewing",
  "done",
]);

export const proposalTypeEnum = pgEnum("proposal_type", [
  "r_and_m",
  "enhancement",
  "hybrid",
]);

export const sectionStatusEnum = pgEnum("section_status", [
  "pending",
  "draft",
  "in_review",
  "approved",
]);

export const llmProviderEnum = pgEnum("llm_provider", [
  "anthropic",
  "openai",
  "ollama",
  "grok",
  "groq",
  "openai_compatible",
]);

// ─── Tables ───────────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull().default("user"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: uuid("created_by"),                           // admin who created them
});

export const llmProviders = pgTable("llm_providers", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  provider: llmProviderEnum("provider").notNull(),
  baseUrl: text("base_url"),
  model: text("model").notNull(),
  apiKeyEncrypted: text("api_key_encrypted"),
  isActive: boolean("is_active").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const proposals = pgTable(
  "proposals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    name: text("name"),                                   // user-defined project name
    status: proposalStatusEnum("status").notNull().default("uploading"),
    proposalType: proposalTypeEnum("proposal_type"),
    rfpFilename: text("rfp_filename").notNull(),          // first uploaded file name
    rfpFiles: jsonb("rfp_files"),                         // array of { name, size, type } for all uploads
    rfpText: text("rfp_text").notNull(),                  // combined text of all uploaded docs
    contextJson: jsonb("context_json"),
    userId: uuid("user_id").references(() => users.id),   // owner (null = legacy/admin)
    activeSection: integer("active_section").notNull().default(1),
    llmProviderId: uuid("llm_provider_id").references(() => llmProviders.id),
  },
  (t) => [index("proposals_status_idx").on(t.status)]
);

export const sections = pgTable(
  "sections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    proposalId: uuid("proposal_id")
      .notNull()
      .references(() => proposals.id, { onDelete: "cascade" }),
    sectionNumber: integer("section_number").notNull(),
    sectionName: text("section_name").notNull(),
    aiDraft: text("ai_draft"),
    currentContent: text("current_content"),
    status: sectionStatusEnum("status").notNull().default("pending"),
    revisionCount: integer("revision_count").notNull().default(0),
    approvedAt: timestamp("approved_at"),
  },
  (t) => [
    index("sections_proposal_idx").on(t.proposalId),
    index("sections_status_idx").on(t.status),
  ]
);

export const feedback = pgTable(
  "feedback",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sectionId: uuid("section_id")
      .notNull()
      .references(() => sections.id, { onDelete: "cascade" }),
    feedbackText: text("feedback_text").notNull(),
    diffBefore: text("diff_before"),
    diffAfter: text("diff_after"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("feedback_section_idx").on(t.sectionId)]
);

export const promptVersions = pgTable(
  "prompt_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sectionNumber: integer("section_number").notNull(),
    proposalType: proposalTypeEnum("proposal_type").notNull(),
    promptText: text("prompt_text").notNull(),
    performanceScore: real("performance_score"),
    isActive: boolean("is_active").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("prompt_section_type_idx").on(t.sectionNumber, t.proposalType),
    index("prompt_active_idx").on(t.isActive),
  ]
);

export const learningLogs = pgTable(
  "learning_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    proposalId: uuid("proposal_id").references(() => proposals.id),
    sectionId: uuid("section_id").references(() => sections.id),
    insight: text("insight").notNull(),
    appliedTo: integer("applied_to").array(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("learning_proposal_idx").on(t.proposalId)]
);

// ─── Relations ────────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  proposals: many(proposals),
}));

export const proposalsRelations = relations(proposals, ({ many, one }) => ({
  sections: many(sections),
  learningLogs: many(learningLogs),
  llmProvider: one(llmProviders, {
    fields: [proposals.llmProviderId],
    references: [llmProviders.id],
  }),
  user: one(users, {
    fields: [proposals.userId],
    references: [users.id],
  }),
}));

export const sectionsRelations = relations(sections, ({ one, many }) => ({
  proposal: one(proposals, {
    fields: [sections.proposalId],
    references: [proposals.id],
  }),
  feedback: many(feedback),
}));

export const feedbackRelations = relations(feedback, ({ one }) => ({
  section: one(sections, {
    fields: [feedback.sectionId],
    references: [sections.id],
  }),
}));

// ─── Types ────────────────────────────────────────────────────────────────────

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Proposal = typeof proposals.$inferSelect;
export type NewProposal = typeof proposals.$inferInsert;
export type Section = typeof sections.$inferSelect;
export type NewSection = typeof sections.$inferInsert;
export type Feedback = typeof feedback.$inferSelect;
export type PromptVersion = typeof promptVersions.$inferSelect;
export type LLMProviderRow = typeof llmProviders.$inferSelect;

export type RFPFile = {
  name: string;
  size: number;   // bytes
  type: "pdf" | "docx";
};

export type RFPContext = {
  type: "r_and_m" | "enhancement" | "hybrid";
  duration: string;
  sla: {
    responseTime?: string;
    uptime?: string;
    escalation?: string;
  };
  team: Array<{ role: string; count: number }>;
  deliverables: string[];
  risks: string[];
  paymentMilestones: string[];
  timeline: {
    start?: string;
    end?: string;
    phases?: string[];
  };
  clientName?: string;
  projectName?: string;
  budget?: string;
};
