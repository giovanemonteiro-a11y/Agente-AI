CREATE TYPE strategic_system_type AS ENUM (
  'empathy_map', 'content_arch', 'format_proportion', 'theme_proportion',
  'campaign_structure', 'creatives_per_phase', 'lead_funnel', 'mql_funnel',
  'editorial_calendar', 'copy_manual', 'storytelling_storydoing', 'graphic_approach'
);

CREATE TABLE strategic_systems (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id),
  type strategic_system_type NOT NULL,
  scope VARCHAR(100),
  content_json JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(client_id, type)
);

CREATE INDEX idx_strategic_systems_client_id ON strategic_systems(client_id);
