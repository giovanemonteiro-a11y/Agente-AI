-- 020_create_sprint_system.sql
-- Sprint system: tasks, backlog, weekly sprints

CREATE TYPE sprint_task_status AS ENUM ('pendente', 'em_andamento', 'concluida', 'bloqueada', 'cancelada');
CREATE TYPE sprint_task_priority AS ENUM ('urgente', 'alta', 'media', 'baixa');
CREATE TYPE sprint_task_type AS ENUM (
  'criativo_campanha', 'criativo_social_media', 'branding_book', 'miv',
  'site', 'ecommerce', 'landing_page', 'patrocinado', 'setup',
  'configuracao', 'personalizado'
);

-- Sprint weeks
CREATE TABLE sprints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coordinator_id UUID NOT NULL REFERENCES users(id),
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  is_current BOOLEAN DEFAULT FALSE,
  is_backlog BOOLEAN DEFAULT FALSE,
  status VARCHAR(20) DEFAULT 'planejando', -- planejando, ativa, concluida
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(coordinator_id, week_start, is_backlog)
);

-- Sprint tasks (demandas)
CREATE TABLE sprint_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sprint_id UUID NOT NULL REFERENCES sprints(id) ON DELETE CASCADE,
  coordinator_id UUID NOT NULL REFERENCES users(id),

  -- Demand info
  client_id UUID REFERENCES clients(id),
  client_name VARCHAR(255) NOT NULL,
  task_type sprint_task_type NOT NULL DEFAULT 'personalizado',
  task_type_custom VARCHAR(255), -- when type is 'personalizado'
  description TEXT NOT NULL,

  -- Assignment
  executor_id UUID REFERENCES users(id),
  executor_name VARCHAR(255) NOT NULL,

  -- Time
  estimated_hours DECIMAL(5,2) NOT NULL DEFAULT 1,
  actual_hours DECIMAL(5,2),

  -- Priority & scheduling
  priority sprint_task_priority NOT NULL DEFAULT 'media',
  priority_date DATE, -- data da semana de prioridade
  status sprint_task_status NOT NULL DEFAULT 'pendente',

  -- Metadata
  is_planned BOOLEAN DEFAULT TRUE, -- planejada ou entrou de última hora
  is_refracao BOOLEAN DEFAULT FALSE, -- é uma refração
  refracao_reason TEXT,

  -- Source
  from_backlog BOOLEAN DEFAULT FALSE,

  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sprints_coordinator ON sprints(coordinator_id);
CREATE INDEX idx_sprints_week ON sprints(week_start);
CREATE INDEX idx_sprint_tasks_sprint ON sprint_tasks(sprint_id);
CREATE INDEX idx_sprint_tasks_executor ON sprint_tasks(executor_id);
CREATE INDEX idx_sprint_tasks_client ON sprint_tasks(client_id);
CREATE INDEX idx_sprint_tasks_status ON sprint_tasks(status);
