export type MeetingType = 'kickoff' | 'checkin';
export type ProcessingStatus = 'pending' | 'uploading' | 'transcribing' | 'completed' | 'failed';

export interface Meeting {
  id: string;
  client_id: string;
  type: MeetingType;
  recorded_at: string;
  recording_url?: string;
  transcript_text?: string;
  participants?: string[];
  drive_file_id?: string;
  processing_status: ProcessingStatus;
  created_at: string;
}

export interface CreateMeetingPayload {
  client_id: string;
  type: MeetingType;
  recorded_at: string;
  participants?: string[];
}
