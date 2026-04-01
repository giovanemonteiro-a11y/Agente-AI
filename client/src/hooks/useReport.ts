import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { CampaignReport } from '@/types/report';

// ── Query keys ─────────────────────────────────────────────────────────────────

export const reportKeys = {
  list: (clientId: string) => ['reports', clientId] as const,
  detail: (clientId: string, reportId: string) => ['reports', clientId, reportId] as const,
};

// ── useReports — GET /api/reports/:clientId ────────────────────────────────────

export function useReports(clientId: string | undefined) {
  return useQuery<CampaignReport[]>({
    queryKey: reportKeys.list(clientId ?? ''),
    queryFn: async () => {
      const { data } = await api.get(`/reports/${clientId}`);
      return (data.data as CampaignReport[]) ?? [];
    },
    enabled: !!clientId,
  });
}

// ── useCreateReport — POST /api/reports/:clientId ─────────────────────────────

export interface CreateReportPayload {
  campaign_name: string;
  period_start: string;
  period_end: string;
  roi?: number | null;
  roas?: number | null;
  cpa?: number | null;
  ctr?: number | null;
  cpm?: number | null;
  impressions?: number | null;
  conversions?: number | null;
  spend?: number | null;
  extra_metrics_json?: Record<string, number | string> | null;
}

export function useCreateReport(clientId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateReportPayload) => {
      const { data } = await api.post(`/reports/${clientId}`, payload);
      return data.data as CampaignReport;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: reportKeys.list(clientId ?? '') });
    },
  });
}
