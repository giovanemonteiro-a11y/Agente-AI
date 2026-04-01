-- Commercial goals: quarterly/monthly targets for monetization

CREATE TYPE commercial_period_type AS ENUM ('monthly', 'quarterly');

CREATE TABLE commercial_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(100) NOT NULL,
  period_type commercial_period_type NOT NULL DEFAULT 'quarterly',
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_goal DECIMAL(12,2) NOT NULL DEFAULT 0,
  expansion_goal DECIMAL(12,2) NOT NULL DEFAULT 0,
  drx_goal DECIMAL(12,2) NOT NULL DEFAULT 0,
  activation_goal DECIMAL(12,2) NOT NULL DEFAULT 0,
  referral_goal DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_goal_dates CHECK (period_end > period_start),
  CONSTRAINT chk_goal_values CHECK (total_goal >= 0 AND expansion_goal >= 0 AND drx_goal >= 0 AND activation_goal >= 0 AND referral_goal >= 0)
);

CREATE INDEX idx_commercial_goals_period ON commercial_goals(period_start, period_end);
