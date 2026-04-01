import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  CommercialGoal, GoalProgress, CommissionRule, Monetization,
  MonetizationOverview, Commission, CommissionSummary, DashboardData,
  CreateGoalPayload, CreateMonetizationPayload, UpdateMonetizationPayload,
} from '@/types/commercial';

// ─── Account Users (for select dropdowns) ────────────────────────────────────

export interface AccountUser {
  id: string;
  name: string;
  email: string;
}

export function useAccountUsers() {
  return useQuery({
    queryKey: ['commercial', 'accounts'],
    queryFn: async () => {
      const { data } = await api.get<AccountUser[]>('/commercial/accounts');
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const commercialKeys = {
  all: ['commercial'] as const,
  goals: () => [...commercialKeys.all, 'goals'] as const,
  goal: (id: string) => [...commercialKeys.goals(), id] as const,
  goalProgress: (id: string, month: string) => [...commercialKeys.goal(id), 'progress', month] as const,
  commissionRules: () => [...commercialKeys.all, 'commission-rules'] as const,
  monetizations: (filters: Record<string, string | undefined>) => [...commercialKeys.all, 'monetizations', filters] as const,
  monetization: (id: string) => [...commercialKeys.all, 'monetizations', id] as const,
  monetizationOverview: (month: string) => [...commercialKeys.all, 'overview', month] as const,
  commissions: (filters: Record<string, string | undefined>) => [...commercialKeys.all, 'commissions', filters] as const,
  commissionSummary: (month: string) => [...commercialKeys.all, 'commissions', 'summary', month] as const,
  dashboard: (month: string) => [...commercialKeys.all, 'dashboard', month] as const,
};

// ─── Goals ────────────────────────────────────────────────────────────────────

export function useGoals() {
  return useQuery({
    queryKey: commercialKeys.goals(),
    queryFn: async () => {
      const { data } = await api.get<CommercialGoal[]>('/commercial/goals');
      return data;
    },
  });
}

export function useGoal(id: string) {
  return useQuery({
    queryKey: commercialKeys.goal(id),
    queryFn: async () => {
      const { data } = await api.get<CommercialGoal>(`/commercial/goals/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useGoalProgress(id: string, month: string) {
  return useQuery({
    queryKey: commercialKeys.goalProgress(id, month),
    queryFn: async () => {
      const { data } = await api.get<GoalProgress>(`/commercial/goals/${id}/progress`, { params: { month } });
      return data;
    },
    enabled: !!id && !!month,
  });
}

export function useCreateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateGoalPayload) => {
      const { data } = await api.post<CommercialGoal>('/commercial/goals', payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: commercialKeys.goals() });
    },
  });
}

export function useUpdateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<CreateGoalPayload> & { id: string }) => {
      const { data } = await api.patch<CommercialGoal>(`/commercial/goals/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: commercialKeys.goals() });
    },
  });
}

export function useDeleteGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/commercial/goals/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: commercialKeys.goals() });
    },
  });
}

// ─── Commission Rules ──────────────────────────────────────────────────────────

export function useCommissionRules() {
  return useQuery({
    queryKey: commercialKeys.commissionRules(),
    queryFn: async () => {
      const { data } = await api.get<CommissionRule[]>('/commercial/commission-rules');
      return data;
    },
  });
}

export function useUpdateCommissionRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Record<string, unknown> & { id: string }) => {
      const { data } = await api.patch<CommissionRule>(`/commercial/commission-rules/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: commercialKeys.commissionRules() });
    },
  });
}

// ─── Monetizations ────────────────────────────────────────────────────────────

export function useMonetizations(filters: { month?: string; type?: string; account_user_id?: string; status?: string } = {}) {
  return useQuery({
    queryKey: commercialKeys.monetizations(filters as Record<string, string | undefined>),
    queryFn: async () => {
      const { data } = await api.get<Monetization[]>('/commercial/monetizations', { params: filters });
      return data;
    },
  });
}

export function useMonetizationOverview(month: string) {
  return useQuery({
    queryKey: commercialKeys.monetizationOverview(month),
    queryFn: async () => {
      const { data } = await api.get<MonetizationOverview[]>('/commercial/monetizations/overview', { params: { month } });
      return data;
    },
    enabled: !!month,
  });
}

export function useCreateMonetization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateMonetizationPayload) => {
      const { data } = await api.post<Monetization>('/commercial/monetizations', payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: commercialKeys.all });
    },
  });
}

export function useUpdateMonetization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: UpdateMonetizationPayload & { id: string }) => {
      const { data } = await api.patch<Monetization>(`/commercial/monetizations/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: commercialKeys.all });
    },
  });
}

// ─── Commissions ──────────────────────────────────────────────────────────────

export function useCommissions(filters: { month?: string; account_user_id?: string; status?: string } = {}) {
  return useQuery({
    queryKey: commercialKeys.commissions(filters as Record<string, string | undefined>),
    queryFn: async () => {
      const { data } = await api.get<Commission[]>('/commercial/commissions', { params: filters });
      return data;
    },
  });
}

export function useCommissionSummary(month: string) {
  return useQuery({
    queryKey: commercialKeys.commissionSummary(month),
    queryFn: async () => {
      const { data } = await api.get<CommissionSummary[]>('/commercial/commissions/summary', { params: { month } });
      return data;
    },
    enabled: !!month,
  });
}

export function useCalculateCommissions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (reference_month: string) => {
      const { data } = await api.post('/commercial/commissions/calculate', { reference_month });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: commercialKeys.all });
    },
  });
}

export function useApproveCommission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'approved' | 'paid' }) => {
      const { data } = await api.patch<Commission>(`/commercial/commissions/${id}/approve`, { status });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: commercialKeys.all });
    },
  });
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export function useCommercialDashboard(month: string) {
  return useQuery({
    queryKey: commercialKeys.dashboard(month),
    queryFn: async () => {
      const { data } = await api.get<DashboardData>('/commercial/dashboard', { params: { month } });
      return data;
    },
    enabled: !!month,
  });
}
