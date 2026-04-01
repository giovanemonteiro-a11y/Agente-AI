-- Monetization records: proposals and closed deals registered by Bruna

CREATE TYPE proposal_temperature AS ENUM ('quente', 'morno', 'frio');
CREATE TYPE monetization_status AS ENUM ('proposta', 'fechada', 'perdida');

CREATE TABLE commercial_monetizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_name VARCHAR(255) NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  account_user_id UUID NOT NULL REFERENCES users(id),
  monetization_type monetization_type NOT NULL,
  product_service VARCHAR(255) NOT NULL,
  value DECIMAL(12,2) NOT NULL,
  temperature proposal_temperature NOT NULL DEFAULT 'frio',
  status monetization_status NOT NULL DEFAULT 'proposta',
  reference_month DATE NOT NULL,
  notes TEXT,
  closed_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_monetization_value CHECK (value >= 0)
);

CREATE INDEX idx_monetizations_account ON commercial_monetizations(account_user_id);
CREATE INDEX idx_monetizations_month ON commercial_monetizations(reference_month);
CREATE INDEX idx_monetizations_status ON commercial_monetizations(status);
CREATE INDEX idx_monetizations_type ON commercial_monetizations(monetization_type);
CREATE INDEX idx_monetizations_temperature ON commercial_monetizations(temperature);
