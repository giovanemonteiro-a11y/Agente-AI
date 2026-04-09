-- Migration 034: Demand detections table
-- Stores demands detected from WhatsApp, meetings, and other sources

CREATE TYPE demand_urgency AS ENUM ('critical', 'high', 'medium', 'low');
CREATE TYPE demand_status AS ENUM ('detected', 'briefing_created', 'assigned', 'completed', 'dismissed');

CREATE TABLE demand_detections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  source VARCHAR(50) NOT NULL DEFAULT 'whatsapp',  -- whatsapp, checkin, kickoff, strategy
  source_id UUID,  -- FK to source record (whatsapp_message, meeting, etc)
  description TEXT NOT NULL,
  urgency demand_urgency NOT NULL DEFAULT 'medium',
  demand_type VARCHAR(100),  -- design_request, campaign_change, content_need, copy_revision, etc
  context_json JSONB DEFAULT '{}'::jsonb,
  briefing_id UUID REFERENCES briefings(id),
  status demand_status NOT NULL DEFAULT 'detected',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_demands_client ON demand_detections(client_id);
CREATE INDEX idx_demands_status ON demand_detections(status);
CREATE INDEX idx_demands_urgency ON demand_detections(urgency);

-- Also add a field to whatsapp_messages to track the WhatsApp group name for multi-group support
ALTER TABLE whatsapp_messages ADD COLUMN IF NOT EXISTS group_name VARCHAR(255);
ALTER TABLE whatsapp_messages ADD COLUMN IF NOT EXISTS group_id VARCHAR(255);
