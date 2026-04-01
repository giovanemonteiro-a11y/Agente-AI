import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { BIData } from '@/types/bi';

// ── Query keys ─────────────────────────────────────────────────────────────────

export const biKeys = {
  client: (clientId: string) => ['bi', 'client', clientId] as const,
  global: () => ['bi', 'global'] as const,
};

// ── useBI — GET /api/bi/:clientId ─────────────────────────────────────────────

export function useBI(clientId: string | undefined) {
  return useQuery<BIData | null>({
    queryKey: biKeys.client(clientId ?? ''),
    queryFn: async () => {
      try {
        const { data } = await api.get(`/bi/${clientId}`);
        return data.data as BIData;
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 404) return null;
        throw err;
      }
    },
    enabled: !!clientId,
  });
}

// ── useGenerateBI — POST /api/bi/:clientId/generate ───────────────────────────

export function useGenerateBI(clientId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/bi/${clientId}/generate`);
      return data.data as BIData;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: biKeys.client(clientId ?? '') });
    },
  });
}

// ── useGlobalBI — GET /api/bi/global ─────────────────────────────────────────

export function useGlobalBI() {
  return useQuery<BIData | null>({
    queryKey: biKeys.global(),
    queryFn: async () => {
      try {
        const { data } = await api.get('/bi/global');
        return data.data as BIData;
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 404) return null;
        throw err;
      }
    },
  });
}

// ── useGenerateGlobalBI — POST /api/bi/global/generate ───────────────────────

export function useGenerateGlobalBI() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/bi/global/generate');
      return data.data as BIData;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: biKeys.global() });
    },
  });
}
