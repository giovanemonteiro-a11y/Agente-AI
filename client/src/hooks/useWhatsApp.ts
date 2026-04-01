import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface ExtractedDemand {
  description: string;
  urgency: 'high' | 'medium' | 'low';
  type: string;
}

export interface WhatsAppMessage {
  id: string;
  client_id: string;
  message_text: string;
  sender: string | null;
  sent_at: string;
  extracted_demands_json: ExtractedDemand[] | null;
  created_at: string;
}

// ── Query keys ─────────────────────────────────────────────────────────────────

export const whatsappKeys = {
  messages: (clientId: string) => ['whatsapp', 'messages', clientId] as const,
  demands: (clientId: string) => ['whatsapp', 'demands', clientId] as const,
};

// ── useWhatsAppMessages — GET /api/whatsapp/:clientId/messages ─────────────────

export function useWhatsAppMessages(clientId: string | undefined, limit: number = 20) {
  return useQuery<WhatsAppMessage[]>({
    queryKey: whatsappKeys.messages(clientId ?? ''),
    queryFn: async () => {
      const { data } = await api.get(`/whatsapp/${clientId}/messages?limit=${limit}`);
      return (data.data as WhatsAppMessage[]) ?? [];
    },
    enabled: !!clientId,
  });
}

// ── useExtractDemands — POST /api/whatsapp/:clientId/extract-demands ───────────

export function useExtractDemands(clientId: string | undefined) {
  const qc = useQueryClient();
  return useMutation<ExtractedDemand[]>({
    mutationFn: async () => {
      const { data } = await api.post(`/whatsapp/${clientId}/extract-demands`);
      return (data.data as ExtractedDemand[]) ?? [];
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: whatsappKeys.messages(clientId ?? '') });
    },
  });
}
