import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { useClientStore } from '@/store/clientStore';
import type { Client, CreateClientPayload, UpdateClientPayload } from '@/types/client';

// ──────────────────────────────────────────────
// Store-based hook (used by existing layout/sidebar code)
// ──────────────────────────────────────────────
export function useClient() {
  const { selectedClient, selectedClientId, setSelectedClient, setSelectedClientId, clearSelectedClient } =
    useClientStore();

  const params = useParams<{ clientId?: string }>();
  const activeClientId = params.clientId ?? selectedClientId;

  return {
    selectedClient,
    selectedClientId: activeClientId,
    setSelectedClient,
    setSelectedClientId,
    clearSelectedClient,
  };
}

// ──────────────────────────────────────────────
// React Query hooks
// ──────────────────────────────────────────────
export function useClients() {
  return useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data } = await api.get('/clients');
      return data.data as Client[];
    },
  });
}

export function useClientById(id: string | undefined) {
  // Skip API call for mock/demo IDs that don't exist in the database
  const isMockId = id?.startsWith('mock-');
  return useQuery<Client>({
    queryKey: ['clients', id],
    queryFn: async () => {
      const { data } = await api.get(`/clients/${id}`);
      return data.data as Client;
    },
    enabled: !!id && !isMockId,
    retry: isMockId ? false : 3,
  });
}

export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateClientPayload) => {
      const { data } = await api.post('/clients', payload);
      return data.data as Client;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients'] });
    },
  });
}

export function useUpdateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: UpdateClientPayload }) => {
      const { data } = await api.patch(`/clients/${id}`, payload);
      return data.data as Client;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['clients'] });
      qc.invalidateQueries({ queryKey: ['clients', vars.id] });
    },
  });
}

export function useSelectClient() {
  const { setSelectedClient } = useClientStore();
  return setSelectedClient;
}
