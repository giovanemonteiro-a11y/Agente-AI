import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import {
  findMeetingsByClientId,
  findMeetingById,
  insertMeeting,
  updateMeetingStatus,
} from '../repositories/meetings.repository';
import { enqueueTranscription } from '../jobs/transcription.job';
import { logger } from '../utils/logger';
import path from 'path';

// ─── GET /api/meetings?clientId=xxx  (legacy query-param form)
//     GET /api/clients/:clientId/meetings  (routed via meetings.routes as /:clientId/meetings)
// ─────────────────────────────────────────────────────────────────────────────
export const listMeetings = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const clientId = req.params.clientId ?? (req.query.clientId as string);

  if (!clientId) {
    res.status(400).json({ error: 'clientId is required' });
    return;
  }

  const meetings = await findMeetingsByClientId(clientId);
  res.json({ data: meetings });
});

// ─── POST /api/meetings/:clientId  — upload recording + create meeting record
// ─────────────────────────────────────────────────────────────────────────────
export const createMeeting = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const clientId = req.params.clientId ?? req.body.client_id;

  if (!clientId) {
    res.status(400).json({ error: 'clientId is required' });
    return;
  }

  const {
    type = 'checkin',
    recorded_at,
    participants,
  } = req.body as {
    type?: 'kickoff' | 'checkin';
    recorded_at?: string;
    participants?: string | string[];
  };

  // Normalise participants: may arrive as comma-separated string or JSON array
  let participantsList: string[] = [];
  if (Array.isArray(participants)) {
    participantsList = participants;
  } else if (typeof participants === 'string' && participants.trim()) {
    try {
      const parsed = JSON.parse(participants);
      participantsList = Array.isArray(parsed) ? parsed : [participants];
    } catch {
      participantsList = participants.split(',').map((p) => p.trim()).filter(Boolean);
    }
  }

  const recordedAt = recorded_at ?? new Date().toISOString();

  // Resolve file path from multer (if a file was uploaded)
  const uploadedFile = req.file as Express.Multer.File | undefined;
  const recordingUrl = uploadedFile
    ? `/uploads/${path.basename(uploadedFile.path)}`
    : null;

  const meeting = await insertMeeting({
    client_id: clientId,
    type: type as 'kickoff' | 'checkin',
    recorded_at: recordedAt,
    recording_url: recordingUrl,
    participants: participantsList,
    processing_status: uploadedFile ? 'pending' : 'pending',
  });

  const created = meeting as {
    id: string;
    client_id: string;
    type: string;
    recorded_at: string;
    recording_url: string | null;
    processing_status: string;
  };

  // If a file was uploaded, enqueue transcription immediately
  if (uploadedFile) {
    try {
      await updateMeetingStatus(created.id, 'pending');
      await enqueueTranscription({
        meetingId: created.id,
        filePath: uploadedFile.path,
        clientId,
      });
      logger.info(`Transcription job queued for meeting ${created.id}`);
    } catch (err) {
      logger.error(`Failed to enqueue transcription for meeting ${created.id}:`, err);
      // Don't fail the request — the record was created, transcription can be retried
    }
  }

  res.status(201).json({ data: created });
});

// ─── GET /api/meetings/:id  — single meeting
// ─────────────────────────────────────────────────────────────────────────────
export const getMeetingById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const meeting = await findMeetingById(id);

  if (!meeting) {
    res.status(404).json({ error: 'Meeting not found' });
    return;
  }

  res.json({ data: meeting });
});

// ─── POST /api/meetings/:id/upload  — upload recording to an existing meeting
// ─────────────────────────────────────────────────────────────────────────────
export const uploadRecording = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const uploadedFile = req.file as Express.Multer.File | undefined;

  if (!uploadedFile) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }

  const meeting = await findMeetingById(id);
  if (!meeting) {
    res.status(404).json({ error: 'Meeting not found' });
    return;
  }

  const m = meeting as { id: string; client_id: string };

  // Enqueue transcription
  await enqueueTranscription({
    meetingId: m.id,
    filePath: uploadedFile.path,
    clientId: m.client_id,
  });

  res.json({ data: { meetingId: m.id, status: 'queued' } });
});

// ─── POST /api/meetings/:id/transcribe  — manually trigger transcription
// ─────────────────────────────────────────────────────────────────────────────
export const triggerTranscription = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const meeting = await findMeetingById(id);

  if (!meeting) {
    res.status(404).json({ error: 'Meeting not found' });
    return;
  }

  const m = meeting as { id: string; client_id: string; recording_url?: string };

  if (!m.recording_url) {
    res.status(422).json({ error: 'Meeting has no recording — upload a file first' });
    return;
  }

  await enqueueTranscription({
    meetingId: m.id,
    filePath: m.recording_url,
    clientId: m.client_id,
  });

  res.json({ data: { meetingId: m.id, status: 'queued' } });
});

// ─── GET /api/meetings/:id/transcript  — return transcript text
// ─────────────────────────────────────────────────────────────────────────────
export const getTranscript = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const meeting = await findMeetingById(id);

  if (!meeting) {
    res.status(404).json({ error: 'Meeting not found' });
    return;
  }

  const m = meeting as { transcript_text?: string | null };

  if (!m.transcript_text) {
    res.status(404).json({ error: 'Transcript not yet available' });
    return;
  }

  res.json({ data: { transcript: m.transcript_text } });
});

// ─── GET /api/meetings/:id/highlights  — stub (Phase 3)
// ─────────────────────────────────────────────────────────────────────────────
export const getHighlights = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  res.status(501).json({ error: 'Not Implemented — available in Phase 3' });
});
