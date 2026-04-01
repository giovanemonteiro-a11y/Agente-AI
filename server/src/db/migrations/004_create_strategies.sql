CREATE TABLE strategies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id),
  version INTEGER NOT NULL DEFAULT 1,
  objectives TEXT,
  positioning TEXT,
  differentials TEXT,
  tone TEXT,
  products TEXT,
  expected_results TEXT,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(client_id, version)
);

CREATE INDEX idx_strategies_client_id ON strategies(client_id);
