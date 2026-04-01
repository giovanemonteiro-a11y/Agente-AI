import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef } from 'react';
import { api } from '@/lib/api';
import type { Summary, SummaryJSON, BrandProfileJSON } from '@/types/summary';

// ── Query keys ────────────────────────────────────────────────────────────────

export const summaryKeys = {
  detail: (clientId: string) => ['summary', clientId] as const,
  diff: (clientId: string) => ['summary', clientId, 'diff'] as const,
};

// ── useSummary ────────────────────────────────────────────────────────────────

export function useSummary(clientId: string | undefined) {
  return useQuery<Summary | null>({
    queryKey: summaryKeys.detail(clientId ?? ''),
    queryFn: async () => {
      const { data } = await api.get(`/summary/${clientId}`);
      return (data.data as Summary) ?? null;
    },
    enabled: !!clientId,
    retry: (failureCount, error) => {
      // Don't retry on 403 (role gate)
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 403) return false;
      return failureCount < 2;
    },
  });
}

// ── useGenerateSummary ────────────────────────────────────────────────────────

export function useGenerateSummary(clientId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/summary/${clientId}/generate`);
      return data.data as Summary;
    },
    onSuccess: (data) => {
      qc.setQueryData(summaryKeys.detail(clientId ?? ''), data);
    },
  });
}

// ── useUpdateSummary (debounced inline edit) ──────────────────────────────────

export function useUpdateSummary(clientId: string | undefined) {
  const qc = useQueryClient();
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mutation = useMutation({
    mutationFn: async (payload: {
      summary_json?: Partial<SummaryJSON>;
      brand_profile_json?: Partial<BrandProfileJSON>;
    }) => {
      const { data } = await api.patch(`/summary/${clientId}`, payload);
      return data.data as Summary;
    },
    onSuccess: (data) => {
      qc.setQueryData(summaryKeys.detail(clientId ?? ''), data);
    },
  });

  const debouncedUpdate = useCallback(
    (payload: {
      summary_json?: Partial<SummaryJSON>;
      brand_profile_json?: Partial<BrandProfileJSON>;
    }) => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        mutation.mutate(payload);
      }, 800);
    },
    [mutation]
  );

  return { ...mutation, debouncedUpdate };
}

// ── useApproveSummary ─────────────────────────────────────────────────────────

export function useApproveSummary(clientId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/summary/${clientId}/approve`);
      return data.data as Summary;
    },
    onSuccess: (data) => {
      qc.setQueryData(summaryKeys.detail(clientId ?? ''), data);
    },
  });
}

// ── useSummaryDiff ────────────────────────────────────────────────────────────

export function useSummaryDiff(clientId: string | undefined, enabled: boolean = false) {
  return useQuery({
    queryKey: summaryKeys.diff(clientId ?? ''),
    queryFn: async () => {
      const { data } = await api.get(`/summary/${clientId}/diff`);
      return data.data as {
        previous_summary_json: SummaryJSON | null;
        previous_brand_profile_json: BrandProfileJSON | null;
        current_summary_json: SummaryJSON;
        current_brand_profile_json: BrandProfileJSON;
        auto_refreshed_at: string | null;
      };
    },
    enabled: !!clientId && enabled,
  });
}
