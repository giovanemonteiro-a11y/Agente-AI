-- Commission rules per monetization type + progressive tiers for expansion

CREATE TYPE monetization_type AS ENUM ('expansao', 'drx', 'ativacao', 'indicacao');
CREATE TYPE commission_rule_type AS ENUM ('percentage', 'fixed_value', 'progressive');

CREATE TABLE commercial_commission_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  monetization_type monetization_type NOT NULL,
  rule_type commission_rule_type NOT NULL,
  fixed_pct DECIMAL(5,2),
  fixed_value DECIMAL(12,2),
  coordinator_pct DECIMAL(5,2) NOT NULL DEFAULT 5.00,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_rule_values CHECK (
    (rule_type = 'percentage' AND fixed_pct IS NOT NULL) OR
    (rule_type = 'fixed_value' AND fixed_value IS NOT NULL) OR
    (rule_type = 'progressive')
  )
);

CREATE TABLE commercial_commission_tiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rule_id UUID NOT NULL REFERENCES commercial_commission_rules(id) ON DELETE CASCADE,
  tier_name VARCHAR(50) NOT NULL,
  min_pct DECIMAL(5,2) NOT NULL,
  max_pct DECIMAL(5,2),
  commission_pct DECIMAL(5,2) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT chk_tier_pcts CHECK (commission_pct >= 0 AND commission_pct <= 100 AND min_pct >= 0)
);

CREATE INDEX idx_commission_rules_type ON commercial_commission_rules(monetization_type) WHERE is_active = TRUE;
CREATE INDEX idx_commission_tiers_rule ON commercial_commission_tiers(rule_id);

-- Seed default commission rules
INSERT INTO commercial_commission_rules (id, monetization_type, rule_type, fixed_pct, fixed_value, coordinator_pct) VALUES
  (uuid_generate_v4(), 'expansao', 'progressive', NULL, NULL, 5.00),
  (uuid_generate_v4(), 'drx', 'percentage', 10.00, NULL, 5.00),
  (uuid_generate_v4(), 'ativacao', 'percentage', 10.00, NULL, 5.00),
  (uuid_generate_v4(), 'indicacao', 'fixed_value', NULL, 700.00, 5.00);

-- Seed expansion tiers (linked to the expansion rule)
INSERT INTO commercial_commission_tiers (rule_id, tier_name, min_pct, max_pct, commission_pct, sort_order)
SELECT id, 'Faixa 1', 0, 70, 3.00, 1 FROM commercial_commission_rules WHERE monetization_type = 'expansao' AND is_active = TRUE
UNION ALL
SELECT id, 'Faixa 2', 70.01, 99.99, 5.00, 2 FROM commercial_commission_rules WHERE monetization_type = 'expansao' AND is_active = TRUE
UNION ALL
SELECT id, 'Super Meta', 100, 150, 8.00, 3 FROM commercial_commission_rules WHERE monetization_type = 'expansao' AND is_active = TRUE
UNION ALL
SELECT id, 'Extra Meta', 150.01, NULL, 12.00, 4 FROM commercial_commission_rules WHERE monetization_type = 'expansao' AND is_active = TRUE;
