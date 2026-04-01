-- Calculated commissions per monetization deal

CREATE TYPE commission_status AS ENUM ('pending', 'approved', 'paid');

CREATE TABLE commercial_commissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  monetization_id UUID NOT NULL REFERENCES commercial_monetizations(id) ON DELETE CASCADE,
  account_user_id UUID NOT NULL REFERENCES users(id),
  reference_month DATE NOT NULL,
  deal_value DECIMAL(12,2) NOT NULL,
  commission_pct DECIMAL(5,2),
  commission_value DECIMAL(12,2) NOT NULL,
  coordinator_pct DECIMAL(5,2) NOT NULL,
  coordinator_value DECIMAL(12,2) NOT NULL,
  tier_name VARCHAR(50),
  status commission_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_commissions_monetization ON commercial_commissions(monetization_id);
CREATE INDEX idx_commissions_account ON commercial_commissions(account_user_id);
CREATE INDEX idx_commissions_month ON commercial_commissions(reference_month);
CREATE INDEX idx_commissions_status ON commercial_commissions(status);
