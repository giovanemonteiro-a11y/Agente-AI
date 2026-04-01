import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Cohort, CohortsListResponse, EmpathyMap, StrategicSystemRow } from '@/types/cohort';

// ── Query keys ────────────────────────────────────────────────────────────────

export const cohortKeys = {
  list: (clientId: string) => ['cohorts', clientId] as const,
  empathyMap: (clientId: string, cohortId: string) =>
    ['cohorts', clientId, cohortId, 'empathy-map'] as const,
};

// ── useCohorts ────────────────────────────────────────────────────────────────

export function useCohorts(clientId: string | undefined) {
  return useQuery<CohortsListResponse>({
    queryKey: cohortKeys.list(clientId ?? ''),
    queryFn: async () => {
      const { data } = await api.get(`/cohorts/${clientId}`);
      return data as CohortsListResponse;
    },
    enabled: !!clientId,
  });
}

// ── useGenerateCohorts ────────────────────────────────────────────────────────

export function useGenerateCohorts(clientId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/cohorts/${clientId}/generate`);
      return data.data as Cohort[];
    },
    onSuccess: (data) => {
      qc.setQueryData(cohortKeys.list(clientId ?? ''), {
        data,
        scopeNotApplicable: false,
      } satisfies CohortsListResponse);
    },
  });
}

// ── useUpdateCohort ───────────────────────────────────────────────────────────

export function useUpdateCohort(clientId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      cohortId,
      payload,
    }: {
      cohortId: string;
      payload: Partial<Omit<Cohort, 'id' | 'client_id' | 'created_at' | 'updated_at' | 'empathy_map'>>;
    }) => {
      const { data } = await api.patch(`/cohorts/${clientId}/${cohortId}`, payload);
      return data.data as Cohort;
    },
    onSuccess: (_data, vars) => {
      // Optimistically update the list
      qc.setQueryData<CohortsListResponse>(
        cohortKeys.list(clientId ?? ''),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((c) => (c.id === vars.cohortId ? { ...c, ..._data } : c)),
          };
        }
      );
    },
  });
}

// ── useEmpathyMap ─────────────────────────────────────────────────────────────

export function useEmpathyMap(clientId: string | undefined, cohortId: string | undefined) {
  return useQuery<StrategicSystemRow | null>({
    queryKey: cohortKeys.empathyMap(clientId ?? '', cohortId ?? ''),
    queryFn: async () => {
      const { data } = await api.get(`/cohorts/${clientId}/${cohortId}/empathy-map`);
      return (data.data as StrategicSystemRow) ?? null;
    },
    enabled: !!clientId && !!cohortId,
  });
}

// ── useGenerateEmpathyMap ─────────────────────────────────────────────────────

export function useGenerateEmpathyMap(clientId: string | undefined, cohortId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post(
        `/cohorts/${clientId}/${cohortId}/empathy-map/generate`
      );
      return data.data as StrategicSystemRow;
    },
    onSuccess: (data) => {
      // Update empathy map cache
      qc.setQueryData(cohortKeys.empathyMap(clientId ?? '', cohortId ?? ''), data);

      // Also update the cohort list so empathy_map is reflected inline
      qc.setQueryData<CohortsListResponse>(
        cohortKeys.list(clientId ?? ''),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((c) =>
              c.id === cohortId
                ? { ...c, empathy_map: data.content_json as EmpathyMap }
                : c
            ),
          };
        }
      );
    },
  });
}
