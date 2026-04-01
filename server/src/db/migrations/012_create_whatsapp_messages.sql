CREATE TABLE whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id),
  message_text TEXT NOT NULL,
  sender VARCHAR(255),
  sent_at TIMESTAMPTZ NOT NULL,
  extracted_demands_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_whatsapp_messages_client_id ON whatsapp_messages(client_id);
