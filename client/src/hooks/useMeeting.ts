import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Meeting } from '@/types/meeting';

// ─── Query keys ───────────────────────────────────────────────────────────────

export const meetingKeys = {
  all: ['meetings'] as const,
  byClient: (clientId: string) => ['meetings', 'client', clientId] as const,
  byId: (id: string) => ['meetings', id] as const,
};

// ─── useMeetings ─────────────────────────────────────────────────────────────
// GET /api/meetings/:clientId/meetings

export function useMeetings(clientId: string | undefined) {
  // Determine whether any meeting is still processing so the caller can
  // enable polling.
  const query = useQuery<Meeting[]>({
    queryKey: meetingKeys.byClient(clientId ?? ''),
    queryFn: async () => {
      const { data } = await api.get<{ data: Meeting[] }>(`/meetings/${clientId}/meetings`);
      return data.data;
    },
    enabled: !!clientId,
    // Refetch every 10 seconds when there are processing meetings (set by caller
    // via refetchInterval — we return the raw query so the component decides).
    refetchInterval: (query) => {
      const meetings = query.state.data;
      if (!meetings) return false;
      const hasProcessing = meetings.some(
        (m) => !m.transcript_text && m.processing_status !== 'failed'
      );
      return hasProcessing ? 10_000 : false;
    },
  });

  return query;
}

// ─── useMeetingById ───────────────────────────────────────────────────────────

export function useMeetingById(meetingId: string | undefined) {
  return useQuery<Meeting>({
    queryKey: meetingKeys.byId(meetingId ?? ''),
    queryFn: async () => {
      const { data } = await api.get<{ data: Meeting }>(`/meetings/${meetingId}`);
      return data.data;
    },
    enabled: !!meetingId,
  });
}

// ─── useUploadMeeting ─────────────────────────────────────────────────────────
// POST /api/meetings/:clientId  (multipart/form-data)

export interface UploadMeetingPayload {
  file: File;
  type: 'kickoff' | 'checkin';
  recorded_at?: string;
  participants?: string[];
}

export function useUploadMeeting(clientId: string | undefined) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UploadMeetingPayload) => {
      const formData = new FormData();
      formData.append('recording', payload.file);
      formData.append('type', payload.type);
      formData.append('recorded_at', payload.recorded_at ?? new Date().toISOString());
      if (payload.participants?.length) {
        formData.append('participants', JSON.stringify(payload.participants));
      }

      const { data } = await api.post<{ data: Meeting }>(`/meetings/${clientId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      return data.data;
    },
    onSuccess: () => {
      if (clientId) {
        qc.invalidateQueries({ queryKey: meetingKeys.byClient(clientId) });
      }
    },
  });
}
