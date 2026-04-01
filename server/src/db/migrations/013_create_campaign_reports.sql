CREATE TABLE campaign_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id),
  campaign_name VARCHAR(255) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  roi NUMERIC(10,4),
  roas NUMERIC(10,4),
  cpa NUMERIC(10,2),
  ctr NUMERIC(10,4),
  cpm NUMERIC(10,2),
  impressions BIGINT,
  conversions BIGINT,
  spend NUMERIC(12,2),
  extra_metrics_json JSONB DEFAULT '{}',
  reported_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_campaign_reports_client_id ON campaign_reports(client_id);
