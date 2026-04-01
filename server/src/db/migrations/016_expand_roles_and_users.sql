-- Expand user_role enum with new roles
-- Note: ALTER TYPE ADD VALUE cannot run inside a transaction in PostgreSQL
-- So this migration must be run outside a transaction or each ADD VALUE separately

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'super_admin';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'lideranca';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'aquisicao';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'coordenador';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'tech_crm';

-- Add must_reset_password column for forced password reset on first login
ALTER TABLE users ADD COLUMN IF NOT EXISTS must_reset_password BOOLEAN NOT NULL DEFAULT FALSE;
