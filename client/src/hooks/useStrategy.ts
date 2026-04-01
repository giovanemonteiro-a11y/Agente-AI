import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Strategy, CreateStrategyPayload, GapItem, HighlightItem } from '@/types/strategy';

// ── Query keys ────────────────────────────────────────────────────────────────

export const strategyKeys = {
  latest: (clientId: string) => ['strategy', clientId, 'latest'] as const,
  history: (clientId: string) => ['strategy', clientId, 'history'] as const,
  highlights: (clientId: string, fieldName: string) =>
    ['strategy', clientId, 'highlights', fieldName] as const,
};

// ── useStrategy — latest version ──────────────────────────────────────────────

export function useStrategy(clientId: string | undefined) {
  return useQuery<Strategy | null>({
    queryKey: strategyKeys.latest(clientId ?? ''),
    queryFn: async () => {
      const { data } = await api.get(`/strategy/${clientId}`);
      return (data.data as Strategy) ?? null;
    },
    enabled: !!clientId,
  });
}

// ── useStrategyHistory — all versions ────────────────────────────────────────

export function useStrategyHistory(clientId: string | undefined) {
  return useQuery<Strategy[]>({
    queryKey: strategyKeys.history(clientId ?? ''),
    queryFn: async () => {
      const { data } = await api.get(`/strategy/${clientId}/history`);
      return data.data as Strategy[];
    },
    enabled: !!clientId,
  });
}

// ── useSaveStrategy — create new immutable version ───────────────────────────

export function useSaveStrategy(clientId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateStrategyPayload) => {
      const { data } = await api.post(`/strategy/${clientId}`, payload);
      return data.data as Strategy;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: strategyKeys.latest(clientId ?? '') });
      qc.invalidateQueries({ queryKey: strategyKeys.history(clientId ?? '') });
    },
  });
}

// ── useDetectGaps — AI gap detection ─────────────────────────────────────────

export function useDetectGaps(clientId: string | undefined) {
  return useMutation({
    mutationFn: async (fields?: Partial<CreateStrategyPayload>) => {
      const { data } = await api.post(`/strategy/${clientId}/gaps`, fields ?? {});
      return data.data as GapItem[];
    },
  });
}

// ── useHighlights — transcript highlights for a field ────────────────────────

export function useHighlights(clientId: string | undefined, fieldName: string) {
  return useQuery<HighlightItem[]>({
    queryKey: strategyKeys.highlights(clientId ?? '', fieldName),
    queryFn: async () => {
      const { data } = await api.post(`/strategy/${clientId}/highlights`, { fieldName });
      return data.data as HighlightItem[];
    },
    enabled: false, // only fetch when explicitly called via refetch()
  });
}
