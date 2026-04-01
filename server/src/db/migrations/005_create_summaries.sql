CREATE TABLE summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id),
  strategy_id UUID REFERENCES strategies(id),
  summary_json JSONB NOT NULL DEFAULT '{}',
  brand_profile_json JSONB NOT NULL DEFAULT '{}',
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_summaries_client_id ON summaries(client_id);
