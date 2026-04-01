CREATE TYPE briefing_type AS ENUM ('designer', 'traffic', 'account', 'site');

CREATE TABLE briefings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id),
  type briefing_type NOT NULL,
  content_json JSONB NOT NULL DEFAULT '{}',
  source_sprints JSONB,
  source_whatsapp JSONB,
  assigned_to_user_id UUID REFERENCES users(id),
  monday_item_id VARCHAR(255),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_briefings_client_id ON briefings(client_id);
CREATE INDEX idx_briefings_assigned_to ON briefings(assigned_to_user_id);
