import { create } from 'zustand';
import type { Client } from '@/types/client';

interface ClientState {
  selectedClient: Client | null;
  selectedClientId: string | null;
  setSelectedClient: (client: Client | null) => void;
  setSelectedClientId: (id: string | null) => void;
  clearSelectedClient: () => void;
}

export const useClientStore = create<ClientState>()((set) => ({
  selectedClient: null,
  selectedClientId: null,

  setSelectedClient: (client: Client | null) => {
    set({
      selectedClient: client,
      selectedClientId: client?.id ?? null,
    });
  },

  setSelectedClientId: (id: string | null) => {
    set({ selectedClientId: id });
  },

  clearSelectedClient: () => {
    set({ selectedClient: null, selectedClientId: null });
  },
}));
