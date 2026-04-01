CREATE TYPE sprint_source AS ENUM ('monday', 'sheets');

CREATE TABLE sprint_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id),
  source sprint_source NOT NULL,
  source_url TEXT,
  board_id VARCHAR(255),
  data_json JSONB NOT NULL DEFAULT '[]',
  last_synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
