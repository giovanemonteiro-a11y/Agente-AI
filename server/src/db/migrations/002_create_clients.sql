CREATE TYPE service_scope AS ENUM ('social_media', 'trafego', 'site_lp', 'ecommerce', 'branding', 'miv');
CREATE TYPE designer_scope AS ENUM ('social_media', 'campanha', 'landing_page', 'site', 'ecommerce', 'branding', 'miv');
CREATE TYPE client_status AS ENUM ('active', 'paused', 'churned');

CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  segment VARCHAR(255),
  services_scope service_scope[] NOT NULL DEFAULT '{}',
  designer_scope designer_scope[] NOT NULL DEFAULT '{}',
  contact_name VARCHAR(255),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  start_date DATE,
  status client_status NOT NULL DEFAULT 'active',
  drive_folder_id VARCHAR(255),
  drive_folder_url TEXT,
  whatsapp_group_id VARCHAR(255),
  sheets_sprint_url TEXT,
  monday_board_id VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_clients_status ON clients(status);
