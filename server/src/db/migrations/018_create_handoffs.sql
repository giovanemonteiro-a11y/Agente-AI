-- 018_create_handoffs.sql
-- Handoff system for the acquisition → leadership → coordinator → trio workflow

CREATE TYPE handoff_status AS ENUM (
  'draft',
  'sent_to_leadership',
  'approved_partial',
  'approved_all',
  'forwarded_to_coordinator',
  'assigned_to_trio',
  'completed'
);

CREATE TABLE handoffs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_by UUID NOT NULL REFERENCES users(id),

  -- Step 1: Transcrição
  transcript TEXT,
  recording_url TEXT,

  -- Step 2: Projeto
  company_name VARCHAR(255),
  razao_social VARCHAR(255),
  stakeholders TEXT[] DEFAULT '{}',
  project_start_date DATE,
  project_scope JSONB,
  contract_url TEXT,
  whatsapp_group_id VARCHAR(255),

  -- Step 3: Análise (SPICED)
  spiced_report JSONB,
  analyst_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  analyst_confirmed_at TIMESTAMPTZ,

  -- Step 4: Relatório
  observation TEXT,

  -- Workflow state
  status handoff_status NOT NULL DEFAULT 'draft',
  current_step INTEGER NOT NULL DEFAULT 1,
  send_attempts INTEGER NOT NULL DEFAULT 0,
  pdf_downloaded BOOLEAN NOT NULL DEFAULT FALSE,

  -- Leadership approvals (JSONB array of {userId, name, approvedAt})
  approvals JSONB NOT NULL DEFAULT '[]',

  -- Forwarding
  forwarded_to_coordinator UUID REFERENCES users(id),
  forwarded_by UUID REFERENCES users(id),
  forwarded_at TIMESTAMPTZ,

  -- Trio assignment
  assigned_trio_id UUID REFERENCES trios(id),
  assigned_at TIMESTAMPTZ,

  -- Client link (set after handoff is processed)
  client_id UUID REFERENCES clients(id),

  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_handoffs_status ON handoffs(status);
CREATE INDEX idx_handoffs_created_by ON handoffs(created_by);
CREATE INDEX idx_handoffs_client_id ON handoffs(client_id);
CREATE INDEX idx_handoffs_forwarded_to ON handoffs(forwarded_to_coordinator);
CREATE INDEX idx_handoffs_trio ON handoffs(assigned_trio_id);
