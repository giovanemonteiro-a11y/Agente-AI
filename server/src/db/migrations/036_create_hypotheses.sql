-- Migration 036: Hypotheses table for performance improvement suggestions

CREATE TYPE hypothesis_category AS ENUM (
  'creative_design',
  'copy_messaging',
  'ad_targeting',
  'account_strategy',
  'content_strategy',
  'funnel_optimization',
  'audience_expansion',
  'budget_allocation'
);

CREATE TYPE hypothesis_status AS ENUM (
  'proposed',
  'accepted',
  'testing',
  'validated',
  'rejected'
);

CREATE TABLE hypotheses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  category hypothesis_category NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  rationale TEXT,
  expected_impact VARCHAR(500),
  confidence NUMERIC(3,2) DEFAULT 0.50,  -- 0.00 to 1.00
  source_documents JSONB DEFAULT '[]'::jsonb,
  action_items JSONB DEFAULT '[]'::jsonb,
  status hypothesis_status NOT NULL DEFAULT 'proposed',
  test_results JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_hypotheses_client ON hypotheses(client_id);
CREATE INDEX idx_hypotheses_status ON hypotheses(status);
CREATE INDEX idx_hypotheses_category ON hypotheses(category);
