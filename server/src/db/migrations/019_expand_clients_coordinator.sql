-- 019_expand_clients_coordinator.sql
-- Expand clients table for coordinator management: base clients, churn system, financials

-- Add coordinator ownership
ALTER TABLE clients ADD COLUMN IF NOT EXISTS coordinator_id UUID REFERENCES users(id);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS trio_id UUID REFERENCES trios(id);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'handoff'; -- 'handoff', 'base', 'portfolio'

-- Extended company info
ALTER TABLE clients ADD COLUMN IF NOT EXISTS razao_social VARCHAR(255);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS cnpj VARCHAR(20);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS stakeholder_name VARCHAR(255); -- primary
ALTER TABLE clients ADD COLUMN IF NOT EXISTS stakeholders TEXT[] DEFAULT '{}'; -- all stakeholders
ALTER TABLE clients ADD COLUMN IF NOT EXISTS niche VARCHAR(255); -- nicho do cliente

-- Project info
ALTER TABLE clients ADD COLUMN IF NOT EXISTS contract_url TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS recording_url TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS lt_days INTEGER DEFAULT 0;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS lt_start_date DATE; -- when LT counting started
ALTER TABLE clients ADD COLUMN IF NOT EXISTS is_new BOOLEAN DEFAULT TRUE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS new_until DATE; -- 15 days after creation

-- Financial info
ALTER TABLE clients ADD COLUMN IF NOT EXISTS client_type VARCHAR(20) DEFAULT 'recorrente'; -- 'recorrente' | 'one_time'
ALTER TABLE clients ADD COLUMN IF NOT EXISTS fee_value DECIMAL(12,2);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS media_investment DECIMAL(12,2);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS expected_margin DECIMAL(5,2);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS contract_period VARCHAR(100);

-- Client goals & KPIs
ALTER TABLE clients ADD COLUMN IF NOT EXISTS client_goals JSONB DEFAULT '[]'; -- [{goal, achieved, metric}]
ALTER TABLE clients ADD COLUMN IF NOT EXISTS roi_target DECIMAL(8,2);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS roi_achieved DECIMAL(8,2);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS roi_achieved_flag BOOLEAN DEFAULT FALSE;

-- Stakeholder updates
ALTER TABLE clients ADD COLUMN IF NOT EXISTS stakeholder_updated BOOLEAN DEFAULT FALSE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS planning_up_to_date BOOLEAN DEFAULT TRUE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS fee_payment_up_to_date BOOLEAN DEFAULT TRUE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS churn_probability VARCHAR(20) DEFAULT 'baixa'; -- baixa, media, alta, critica

-- Team allocation
ALTER TABLE clients ADD COLUMN IF NOT EXISTS team_allocation JSONB DEFAULT '{}';
-- e.g. {"account": {"included": true, "dedication": 50}, "designer": {"included": true, "dedication": 30}, "gestor_trafego": {"included": false, "dedication": 0}}

-- Decision maker
ALTER TABLE clients ADD COLUMN IF NOT EXISTS decision_maker VARCHAR(255);

-- History
ALTER TABLE clients ADD COLUMN IF NOT EXISTS monetization_history JSONB DEFAULT '[]'; -- [{type: 'upsell'|'crosssell'|'downsell', description, date, value}]
ALTER TABLE clients ADD COLUMN IF NOT EXISTS project_costs JSONB DEFAULT '[]'; -- [{type: 'viagem'|'materiais'|'divulgacao'|'eventos'|..., description, value}]

-- Churn system
ALTER TABLE clients ADD COLUMN IF NOT EXISTS churned_at TIMESTAMPTZ;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS churn_reason TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS churn_severity VARCHAR(20); -- 'leve', 'moderado', 'severo', 'preocupante'
ALTER TABLE clients ADD COLUMN IF NOT EXISTS churn_detail TEXT;

-- Tratativa system
ALTER TABLE clients ADD COLUMN IF NOT EXISTS in_tratativa BOOLEAN DEFAULT FALSE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS tratativa_reason TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS tratativa_deadline TIMESTAMPTZ;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS tratativa_started_at TIMESTAMPTZ;

-- Handoff link
ALTER TABLE clients ADD COLUMN IF NOT EXISTS handoff_id UUID REFERENCES handoffs(id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_clients_coordinator ON clients(coordinator_id);
CREATE INDEX IF NOT EXISTS idx_clients_trio ON clients(trio_id);
CREATE INDEX IF NOT EXISTS idx_clients_source ON clients(source);
CREATE INDEX IF NOT EXISTS idx_clients_client_type ON clients(client_type);
CREATE INDEX IF NOT EXISTS idx_clients_in_tratativa ON clients(in_tratativa);
