import { MeetingType } from '../types/index';

export interface CreateMeetingPayload {
  client_id: string;
  type: MeetingType;
  recorded_at: string;
  participants?: string[];
}

export async function listMeetings(_clientId?: string): Promise<unknown[]> {
  throw new Error('Not implemented');
}

export async function createMeeting(_payload: CreateMeetingPayload): Promise<unknown> {
  throw new Error('Not implemented');
}

export async function getMeetingById(_id: string): Promise<unknown> {
  throw new Error('Not implemented');
}

export async function updateMeetingProcessingStatus(
  _id: string,
  _status: string
): Promise<void> {
  throw new Error('Not implemented');
}

export async function updateMeetingTranscript(
  _id: string,
  _transcriptText: string,
  _driveFileId?: string
): Promise<void> {
  throw new Error('Not implemented');
}
