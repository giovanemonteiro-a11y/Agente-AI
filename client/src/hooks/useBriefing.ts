import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Briefing, BriefingType, GenerateBriefingPayload } from '@/types/briefing';

// ── Query keys ────────────────────────────────────────────────────────────────

export const briefingKeys = {
  list: (clientId: string, type?: BriefingType) =>
    ['briefings', clientId, type ?? 'all'] as const,
  detail: (clientId: string, briefingId: string) =>
    ['briefings', clientId, briefingId] as const,
};

// ── useBriefings — list briefings, optionally filtered by type ────────────────

export function useBriefings(clientId: string | undefined, type?: BriefingType) {
  return useQuery<Briefing[]>({
    queryKey: briefingKeys.list(clientId ?? '', type),
    queryFn: async () => {
      const params = type ? `?type=${type}` : '';
      const { data } = await api.get(`/briefings/${clientId}${params}`);
      return (data.data as Briefing[]) ?? [];
    },
    enabled: !!clientId,
  });
}

// ── useBriefing — single briefing ─────────────────────────────────────────────

export function useBriefing(clientId: string | undefined, briefingId: string | undefined) {
  return useQuery<Briefing>({
    queryKey: briefingKeys.detail(clientId ?? '', briefingId ?? ''),
    queryFn: async () => {
      const { data } = await api.get(`/briefings/${clientId}/${briefingId}`);
      return data.data as Briefing;
    },
    enabled: !!clientId && !!briefingId,
  });
}

// ── useGenerateBriefing — POST generate ──────────────────────────────────────

export function useGenerateBriefing(clientId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: GenerateBriefingPayload) => {
      const { data } = await api.post(`/briefings/${clientId}/generate`, payload);
      return data.data as Briefing;
    },
    onSuccess: () => {
      // Invalidate all type variants for this client
      qc.invalidateQueries({ queryKey: ['briefings', clientId ?? ''] });
    },
  });
}

// ── useSendBriefing — POST send ───────────────────────────────────────────────

export function useSendBriefing(clientId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (briefingId: string) => {
      const { data } = await api.post(`/briefings/${clientId}/${briefingId}/send`);
      return data.data as Briefing;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['briefings', clientId ?? ''] });
    },
  });
}

// ── usePushToMonday — POST push-monday ────────────────────────────────────────

export function usePushToMonday(clientId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      briefingId,
      boardId,
      groupId,
    }: {
      briefingId: string;
      boardId?: string;
      groupId?: string;
    }) => {
      const { data } = await api.post(
        `/briefings/${clientId}/${briefingId}/push-monday`,
        { boardId, groupId }
      );
      return data as { data: Briefing; monday_task_id: string };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['briefings', clientId ?? ''] });
    },
  });
}
