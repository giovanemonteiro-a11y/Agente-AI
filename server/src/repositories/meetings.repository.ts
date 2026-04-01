import { query } from '../config/database';

export interface CreateMeetingData {
  client_id: string;
  type: 'kickoff' | 'checkin';
  recorded_at: string;
  recording_url?: string | null;
  participants?: string[];
  drive_file_id?: string | null;
  processing_status?: string;
}

export async function findMeetingsByClientId(clientId: string): Promise<unknown[]> {
  const result = await query(
    'SELECT * FROM meetings WHERE client_id = $1 ORDER BY recorded_at DESC',
    [clientId]
  );
  return result.rows;
}

export async function findMeetingById(id: string): Promise<unknown> {
  const result = await query('SELECT * FROM meetings WHERE id = $1', [id]);
  return result.rows[0] ?? null;
}

export async function insertMeeting(data: Record<string, unknown>): Promise<unknown> {
  const fields = Object.keys(data);
  const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');
  const result = await query(
    `INSERT INTO meetings (${fields.join(', ')}) VALUES (${placeholders}) RETURNING *`,
    Object.values(data)
  );
  return result.rows[0];
}

/**
 * Find the first meeting whose recording_url matches the given URL.
 * Used by Drive sync to detect already-imported files.
 */
export async function findMeetingsByRecordingUrl(recordingUrl: string): Promise<unknown | null> {
  const result = await query(
    'SELECT id FROM meetings WHERE recording_url = $1 LIMIT 1',
    [recordingUrl]
  );
  return result.rows[0] ?? null;
}

export async function updateMeetingStatus(id: string, status: string): Promise<void> {
  await query(
    'UPDATE meetings SET processing_status = $1 WHERE id = $2',
    [status, id]
  );
}

export async function updateMeetingTranscript(
  id: string,
  transcriptText: string,
  driveFileId?: string
): Promise<void> {
  await query(
    'UPDATE meetings SET transcript_text = $1, drive_file_id = $2, processing_status = $3 WHERE id = $4',
    [transcriptText, driveFileId ?? null, 'completed', id]
  );
}
