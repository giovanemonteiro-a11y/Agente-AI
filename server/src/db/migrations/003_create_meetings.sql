CREATE TYPE meeting_type AS ENUM ('kickoff', 'checkin');

CREATE TABLE meetings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id),
  type meeting_type NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL,
  recording_url TEXT,
  transcript_text TEXT,
  participants TEXT[],
  drive_file_id VARCHAR(255),
  processing_status VARCHAR(50) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Append-only: no DELETE, no UPDATE on transcript_text after set

CREATE INDEX idx_meetings_client_id ON meetings(client_id);
CREATE INDEX idx_meetings_type ON meetings(type);
CREATE INDEX idx_meetings_recorded_at ON meetings(recorded_at);
