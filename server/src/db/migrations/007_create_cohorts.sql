CREATE TABLE cohorts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id),
  characteristic_phrase TEXT NOT NULL,
  anthropological_description TEXT,
  demographic_profile_json JSONB NOT NULL DEFAULT '{}',
  behavior_lifestyle TEXT,
  audience_size VARCHAR(100),
  reach_potential VARCHAR(100),
  triggers TEXT[],
  alternative_solutions TEXT[],
  indicators TEXT[],
  editorial_lines TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cohorts_client_id ON cohorts(client_id);
