-- Migration 033: Add vault and health fields to clients table

ALTER TABLE clients ADD COLUMN IF NOT EXISTS vault_folder_id VARCHAR(255);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS vault_last_synced_at TIMESTAMPTZ;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS health_score NUMERIC(5,2);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS health_updated_at TIMESTAMPTZ;
