-- Migration 032: Knowledge Documents table
-- Stores all AI-generated knowledge artifacts for the vault (Obsidian brain)

CREATE TYPE knowledge_doc_type AS ENUM (
  'one_page_summary',
  'cohort_analysis',
  'empathy_map',
  'business_canvas',
  'traffic_report',
  'copy_manual',
  'persona',
  'archetype',
  'benchmarking',
  'market_analysis',
  'competitive_scenario',
  'client_health',
  'portfolio_bi',
  'hypothesis_report',
  'meeting_digest',
  'whatsapp_digest',
  'strategy_digest',
  'handoff_digest',
  'kickoff_digest',
  'checkin_digest'
);

CREATE TABLE knowledge_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,  -- NULL for global docs (_Portfolio)
  doc_type knowledge_doc_type NOT NULL,
  title VARCHAR(500) NOT NULL,
  content_md TEXT,                    -- Rendered markdown (for vault files)
  content_json JSONB DEFAULT '{}'::jsonb,  -- Structured data backing the markdown
  source_ids JSONB DEFAULT '[]'::jsonb,    -- References to source record IDs
  drive_file_id VARCHAR(255),        -- Google Drive file ID after sync
  vault_path VARCHAR(1000),          -- Relative path within vault (e.g. "ClientName/01-Foundation/summary.md")
  version INT DEFAULT 1,
  generated_by VARCHAR(50) DEFAULT 'groq',  -- 'groq' or 'gemini'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_knowledge_client ON knowledge_documents(client_id);
CREATE INDEX idx_knowledge_doc_type ON knowledge_documents(doc_type);
CREATE UNIQUE INDEX idx_knowledge_client_doctype ON knowledge_documents(client_id, doc_type) WHERE client_id IS NOT NULL;
