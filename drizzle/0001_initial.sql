-- FPT Proposal AI — Initial Schema
-- Run via: npm run db:push  (or paste into Neon SQL editor)

CREATE TYPE proposal_status AS ENUM ('uploading','analyzing','generating','reviewing','done');
CREATE TYPE proposal_type   AS ENUM ('r_and_m','enhancement','hybrid');
CREATE TYPE section_status  AS ENUM ('pending','draft','in_review','approved');
CREATE TYPE llm_provider    AS ENUM ('anthropic','openai','ollama','grok','openai_compatible');

CREATE TABLE IF NOT EXISTS llm_providers (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  provider          llm_provider NOT NULL,
  base_url          TEXT,
  model             TEXT NOT NULL,
  api_key_encrypted TEXT,
  is_active         BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS proposals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status          proposal_status NOT NULL DEFAULT 'uploading',
  proposal_type   proposal_type,
  rfp_filename    TEXT NOT NULL,
  rfp_text        TEXT NOT NULL,
  context_json    JSONB,
  active_section  INTEGER NOT NULL DEFAULT 1,
  llm_provider_id UUID REFERENCES llm_providers(id)
);
CREATE INDEX IF NOT EXISTS proposals_status_idx ON proposals(status);

CREATE TABLE IF NOT EXISTS sections (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id     UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  section_number  INTEGER NOT NULL,
  section_name    TEXT NOT NULL,
  ai_draft        TEXT,
  current_content TEXT,
  status          section_status NOT NULL DEFAULT 'pending',
  revision_count  INTEGER NOT NULL DEFAULT 0,
  approved_at     TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS sections_proposal_idx ON sections(proposal_id);
CREATE INDEX IF NOT EXISTS sections_status_idx   ON sections(status);

CREATE TABLE IF NOT EXISTS feedback (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id    UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  feedback_text TEXT NOT NULL,
  diff_before   TEXT,
  diff_after    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS feedback_section_idx ON feedback(section_id);

CREATE TABLE IF NOT EXISTS prompt_versions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_number    INTEGER NOT NULL,
  proposal_type     proposal_type NOT NULL,
  prompt_text       TEXT NOT NULL,
  performance_score REAL,
  is_active         BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS prompt_section_type_idx ON prompt_versions(section_number, proposal_type);
CREATE INDEX IF NOT EXISTS prompt_active_idx        ON prompt_versions(is_active);

CREATE TABLE IF NOT EXISTS learning_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID REFERENCES proposals(id),
  section_id  UUID REFERENCES sections(id),
  insight     TEXT NOT NULL,
  applied_to  INTEGER[],
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS learning_proposal_idx ON learning_logs(proposal_id);
