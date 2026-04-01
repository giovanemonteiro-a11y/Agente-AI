import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { SystemMetaItem, StrategicSystemType, StrategicSystem } from '@/types/strategicSystem';

// ── Query keys ────────────────────────────────────────────────────────────────

export const systemKeys = {
  all: (clientId: string) => ['systems', clientId] as const,
  single: (clientId: string, type: StrategicSystemType) =>
    ['systems', clientId, type] as const,
};

// ── useStrategicSystems ───────────────────────────────────────────────────────

/**
 * Fetches all strategic systems (with meta) for a client.
 * Returns an array of SystemMetaItem (one per type).
 */
export function useStrategicSystems(clientId: string | undefined) {
  return useQuery<SystemMetaItem[]>({
    queryKey: systemKeys.all(clientId ?? ''),
    queryFn: async () => {
      const { data } = await api.get(`/systems/${clientId}`);
      return (data as { data: SystemMetaItem[] }).data;
    },
    enabled: !!clientId,
  });
}

// ── useStrategicSystem ────────────────────────────────────────────────────────

/**
 * Fetches a single strategic system by type.
 */
export function useStrategicSystem(
  clientId: string | undefined,
  type: StrategicSystemType | undefined
) {
  return useQuery<StrategicSystem | null>({
    queryKey: systemKeys.single(clientId ?? '', type ?? 'content_arch'),
    queryFn: async () => {
      const { data } = await api.get(`/systems/${clientId}/${type}`);
      return (data as { data: StrategicSystem | null }).data;
    },
    enabled: !!clientId && !!type,
  });
}

// ── useGenerateSystem ─────────────────────────────────────────────────────────

/**
 * Mutation to generate a single strategic system type.
 */
export function useGenerateSystem(clientId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (type: StrategicSystemType) => {
      const { data } = await api.post(`/systems/${clientId}/${type}/generate`);
      return (data as { data: StrategicSystem }).data;
    },
    onSuccess: (savedSystem, type) => {
      // Update the single system cache
      qc.setQueryData(systemKeys.single(clientId ?? '', type), savedSystem);

      // Update the list cache: mark this type as generated
      qc.setQueryData<SystemMetaItem[]>(systemKeys.all(clientId ?? ''), (old) => {
        if (!old) return old;
        return old.map((item) =>
          item.type === type
            ? { ...item, generated: true, system: savedSystem }
            : item
        );
      });
    },
  });
}

// ── useUpdateSystem ───────────────────────────────────────────────────────────

/**
 * Mutation to manually update the content_json of a strategic system.
 */
export function useUpdateSystem(clientId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      type,
      content_json,
    }: {
      type: StrategicSystemType;
      content_json: unknown;
    }) => {
      const { data } = await api.patch(`/systems/${clientId}/${type}`, { content_json });
      return (data as { data: StrategicSystem }).data;
    },
    onSuccess: (savedSystem, { type }) => {
      qc.setQueryData(systemKeys.single(clientId ?? '', type), savedSystem);
      qc.setQueryData<SystemMetaItem[]>(systemKeys.all(clientId ?? ''), (old) => {
        if (!old) return old;
        return old.map((item) =>
          item.type === type
            ? { ...item, generated: true, system: savedSystem }
            : item
        );
      });
    },
  });
}

// ── useGenerateAllSystems ─────────────────────────────────────────────────────

export interface GenerateAllResult {
  type: string;
  status: 'success' | 'error';
  system?: StrategicSystem;
  error?: string;
}

export interface GenerateAllResponse {
  data: GenerateAllResult[];
  summary: {
    total: number;
    success: number;
    error: number;
    skipped: number;
  };
}

/**
 * Mutation to generate ALL applicable strategic systems for a client sequentially.
 */
export function useGenerateAllSystems(clientId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/systems/${clientId}/generate-all`);
      return data as GenerateAllResponse;
    },
    onSuccess: () => {
      // Invalidate the full systems list to force a refetch
      void qc.invalidateQueries({ queryKey: systemKeys.all(clientId ?? '') });
    },
  });
}
