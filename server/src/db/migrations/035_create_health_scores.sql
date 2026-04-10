-- Migration 035: Health Scores + Portfolio Snapshots for BI dashboards

CREATE TABLE health_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  overall_score NUMERIC(5,2) NOT NULL DEFAULT 0,  -- 0 to 100
  dimension_scores JSONB DEFAULT '{}'::jsonb,      -- {engagement, performance, satisfaction, risk}
  signals JSONB DEFAULT '[]'::jsonb,               -- array of signal observations
  recommendations JSONB DEFAULT '[]'::jsonb,       -- AI-generated recommendations
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_health_client ON health_scores(client_id);
CREATE INDEX idx_health_calculated ON health_scores(calculated_at DESC);

CREATE TABLE portfolio_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date DATE NOT NULL UNIQUE,
  total_clients INT DEFAULT 0,
  avg_health_score NUMERIC(5,2) DEFAULT 0,
  health_distribution JSONB DEFAULT '{}'::jsonb,   -- {critical, at_risk, healthy, thriving}
  top_risks JSONB DEFAULT '[]'::jsonb,             -- clients at risk with reasons
  top_performers JSONB DEFAULT '[]'::jsonb,        -- best performing clients
  revenue_metrics JSONB DEFAULT '{}'::jsonb,       -- revenue/monetization data
  data_json JSONB DEFAULT '{}'::jsonb,             -- additional analytics
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_portfolio_date ON portfolio_snapshots(snapshot_date DESC);
