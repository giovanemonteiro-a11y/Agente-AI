import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Table2, Save, Bell, Calendar, CheckCircle2, XCircle, AlertTriangle,
  Loader2, X, Clock,
} from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { GradientButton } from '@/components/shared/GradientButton';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import type { Client } from '@/types/client';

// ─── Types ──────────────────────────────────────────────────────────────────

interface BoardRow {
  clientId: string;
  clientName: string;
  mrr: number;
  mediaInvestment: number;
  accountManager: string;
  entryDate: string;
  ltDays: number;
  step: string;
  roiAbove1: boolean;
  metaBatida: boolean;
  csatDesignAbove4: boolean;
  csatDesignScore: number;
  npsPromotor: boolean;
  npsScore: number;
  stakeholderUpdated: boolean;
  planningUpToDate: boolean;
  feePaymentUpToDate: boolean;
  churnProbability: string;
}

const CHURN_COLORS: Record<string, string> = {
  baixa: 'text-emerald-400 bg-emerald-500/10',
  media: 'text-amber-400 bg-amber-500/10',
  alta: 'text-orange-400 bg-orange-500/10',
  critica: 'text-red-400 bg-red-500/10',
};

const DAYS = ['Segunda', 'Terça', 'Quarta', 'Quinta'];
const HOURS = ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];

function BoolBadge({ value, label }: { value: boolean; label?: string }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 text-2xs font-medium px-1.5 py-0.5 rounded',
      value ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'
    )}>
      {value ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
      {label ?? (value ? 'Sim' : 'Não')}
    </span>
  );
}

function formatLT(days: number): string {
  if (days < 30) return `${days}d`;
  return `${Math.floor(days / 30)}m`;
}

// ═══════════════════════════════════════════════════════════════════════════════

export function BoardOfHeadPage() {
  const { user } = useAuth();
  const isCoordinator = user?.role === 'coordenador' || user?.role === 'super_admin';
  const [clients, setClients] = useState<Client[]>([]);
  const [rows, setRows] = useState<BoardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderDay, setReminderDay] = useState('Segunda');
  const [reminderHour, setReminderHour] = useState('09:00');
  const [reminderSet, setReminderSet] = useState(false);

  // Fetch
  useEffect(() => {
    async function fetch() {
      try {
        const endpoint = isCoordinator ? '/coordinator/clients' : '/clients';
        const res = await api.get<{ data: Client[] }>(endpoint);
        const data = (res.data.data ?? []).filter(c => c.status === 'active');
        setClients(data);

        setRows(data.map(c => ({
          clientId: c.id,
          clientName: c.name,
          mrr: c.fee_value ?? 0,
          mediaInvestment: c.media_investment ?? 0,
          accountManager: c.stakeholder_name ?? '—',
          entryDate: c.start_date ?? c.created_at?.split('T')[0] ?? '',
          ltDays: c.lt_days ?? 0,
          step: c.source === 'handoff' ? 'Onboarding' : 'Operação',
          roiAbove1: (c.roi_achieved ?? 0) > 1,
          metaBatida: c.roi_achieved_flag ?? false,
          csatDesignAbove4: false,
          csatDesignScore: 0,
          npsPromotor: false,
          npsScore: 0,
          stakeholderUpdated: c.stakeholder_updated ?? false,
          planningUpToDate: c.planning_up_to_date ?? true,
          feePaymentUpToDate: c.fee_payment_up_to_date ?? true,
          churnProbability: c.churn_probability ?? 'baixa',
        })));
      } catch { /* ignore */ }
      finally { setLoading(false); }
    }
    fetch();
  }, [isCoordinator]);

  // Update row
  const updateRow = useCallback((clientId: string, field: keyof BoardRow, value: unknown) => {
    if (!isCoordinator) return;
    setRows(prev => prev.map(r => r.clientId === clientId ? { ...r, [field]: value } : r));
    setSaved(false);
  }, [isCoordinator]);

  // Save all
  async function handleSave() {
    setSaving(true);
    try {
      for (const row of rows) {
        await api.patch(`/coordinator/clients/${row.clientId}`, {
          fee_value: row.mrr,
          media_investment: row.mediaInvestment,
          stakeholder_updated: row.stakeholderUpdated,
          planning_up_to_date: row.planningUpToDate,
          fee_payment_up_to_date: row.feePaymentUpToDate,
          churn_probability: row.churnProbability,
          roi_achieved_flag: row.metaBatida,
        });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch { /* ignore */ }
    finally { setSaving(false); }
  }

  function handleSetReminder() {
    // In production, this would create a Google Calendar invite
    setReminderSet(true);
    setShowReminderModal(false);
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-galaxy-blue-light" /></div>;
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-3">
            <Table2 className="text-galaxy-blue-light" size={24} />
            Board Of Head
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            {isCoordinator ? 'Visão completa da carteira — edite para manter atualizado' : 'Visão da carteira do seu coordenador (somente leitura)'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Reminder */}
          <button
            onClick={() => setShowReminderModal(true)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium border transition-all',
              reminderSet
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
            )}
          >
            {reminderSet ? <CheckCircle2 size={14} /> : <Bell size={14} />}
            {reminderSet ? `Lembrete: ${reminderDay} ${reminderHour}` : 'Agendar Lembrete'}
          </button>

          {isCoordinator && (
            <GradientButton leftIcon={saved ? <CheckCircle2 size={14} /> : <Save size={14} />} loading={saving} onClick={handleSave}>
              {saved ? 'Salvo!' : 'Salvar Alterações'}
            </GradientButton>
          )}
        </div>
      </div>

      {/* Table */}
      <GlassCard padding="sm" className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-glass-border">
              {[
                'Empresa', 'MRR (R$)', 'Mídia (R$)', 'Account', 'Entrada', 'LT',
                'Step', 'ROI>1', 'Meta', 'CSAT Design', 'NPS', 'Stakeholder', 'Planej.',
                'Fee', 'Churn',
              ].map(h => (
                <th key={h} className="text-left px-3 py-3 text-text-muted font-semibold uppercase tracking-wider whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <motion.tr
                key={row.clientId}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02 }}
                className="border-b border-glass-border/50 hover:bg-white/[0.02] transition-colors"
              >
                <td className="px-3 py-3 font-medium text-text-primary whitespace-nowrap">{row.clientName}</td>
                <td className="px-3 py-3">
                  {isCoordinator ? (
                    <input type="number" value={row.mrr} onChange={e => updateRow(row.clientId, 'mrr', parseFloat(e.target.value) || 0)} className="w-20 bg-white/[0.03] border border-glass-border rounded px-2 py-1 text-xs text-text-primary focus:border-galaxy-blue/40 focus:outline-none" />
                  ) : (
                    <span className="text-text-secondary">{row.mrr.toLocaleString('pt-BR')}</span>
                  )}
                </td>
                <td className="px-3 py-3">
                  {isCoordinator ? (
                    <input type="number" value={row.mediaInvestment} onChange={e => updateRow(row.clientId, 'mediaInvestment', parseFloat(e.target.value) || 0)} className="w-20 bg-white/[0.03] border border-glass-border rounded px-2 py-1 text-xs text-text-primary focus:border-galaxy-blue/40 focus:outline-none" />
                  ) : (
                    <span className="text-text-secondary">{row.mediaInvestment.toLocaleString('pt-BR')}</span>
                  )}
                </td>
                <td className="px-3 py-3 text-text-secondary whitespace-nowrap">{row.accountManager}</td>
                <td className="px-3 py-3 text-text-muted whitespace-nowrap">{row.entryDate}</td>
                <td className="px-3 py-3 text-text-secondary">{formatLT(row.ltDays)}</td>
                <td className="px-3 py-3">
                  {isCoordinator ? (
                    <select value={row.step} onChange={e => updateRow(row.clientId, 'step', e.target.value)} className="bg-[#1a1a2e] border border-glass-border rounded px-1 py-1 text-xs text-text-primary focus:outline-none [&>option]:bg-[#1a1a2e] [&>option]:text-white">
                      <option value="Onboarding">Onboarding</option>
                      <option value="Operação">Operação</option>
                      <option value="Crescimento">Crescimento</option>
                      <option value="Maturidade">Maturidade</option>
                    </select>
                  ) : (
                    <span className="text-text-secondary">{row.step}</span>
                  )}
                </td>
                <td className="px-3 py-3">
                  {isCoordinator ? (
                    <input type="checkbox" checked={row.roiAbove1} onChange={e => updateRow(row.clientId, 'roiAbove1', e.target.checked)} className="accent-galaxy-blue" />
                  ) : <BoolBadge value={row.roiAbove1} />}
                </td>
                <td className="px-3 py-3">
                  {isCoordinator ? (
                    <input type="checkbox" checked={row.metaBatida} onChange={e => updateRow(row.clientId, 'metaBatida', e.target.checked)} className="accent-galaxy-blue" />
                  ) : <BoolBadge value={row.metaBatida} />}
                </td>
                <td className="px-3 py-3">
                  {isCoordinator ? (
                    <div className="flex items-center gap-1">
                      <input type="number" min={0} max={5} step={0.1} value={row.csatDesignScore} onChange={e => {
                        const v = parseFloat(e.target.value) || 0;
                        updateRow(row.clientId, 'csatDesignScore', v);
                        updateRow(row.clientId, 'csatDesignAbove4', v > 4);
                      }} className="w-12 bg-white/[0.03] border border-glass-border rounded px-1 py-1 text-xs text-text-primary focus:outline-none" />
                      <BoolBadge value={row.csatDesignAbove4} label={row.csatDesignScore > 4 ? '>4' : '≤4'} />
                    </div>
                  ) : <BoolBadge value={row.csatDesignAbove4} label={`${row.csatDesignScore}`} />}
                </td>
                <td className="px-3 py-3">
                  {isCoordinator ? (
                    <div className="flex items-center gap-1">
                      <input type="number" min={0} max={10} value={row.npsScore} onChange={e => {
                        const v = parseInt(e.target.value) || 0;
                        updateRow(row.clientId, 'npsScore', v);
                        updateRow(row.clientId, 'npsPromotor', v >= 9);
                      }} className="w-10 bg-white/[0.03] border border-glass-border rounded px-1 py-1 text-xs text-text-primary focus:outline-none" />
                      <BoolBadge value={row.npsPromotor} label={row.npsScore >= 9 ? 'P' : 'D'} />
                    </div>
                  ) : <BoolBadge value={row.npsPromotor} label={`${row.npsScore}`} />}
                </td>
                <td className="px-3 py-3">
                  {isCoordinator ? (
                    <input type="checkbox" checked={row.stakeholderUpdated} onChange={e => updateRow(row.clientId, 'stakeholderUpdated', e.target.checked)} className="accent-galaxy-blue" />
                  ) : <BoolBadge value={row.stakeholderUpdated} />}
                </td>
                <td className="px-3 py-3">
                  {isCoordinator ? (
                    <input type="checkbox" checked={row.planningUpToDate} onChange={e => updateRow(row.clientId, 'planningUpToDate', e.target.checked)} className="accent-galaxy-blue" />
                  ) : <BoolBadge value={row.planningUpToDate} />}
                </td>
                <td className="px-3 py-3">
                  {isCoordinator ? (
                    <input type="checkbox" checked={row.feePaymentUpToDate} onChange={e => updateRow(row.clientId, 'feePaymentUpToDate', e.target.checked)} className="accent-galaxy-blue" />
                  ) : <BoolBadge value={row.feePaymentUpToDate} />}
                </td>
                <td className="px-3 py-3">
                  {isCoordinator ? (
                    <select value={row.churnProbability} onChange={e => updateRow(row.clientId, 'churnProbability', e.target.value)} className="bg-[#1a1a2e] border border-glass-border rounded px-1 py-1 text-xs text-text-primary focus:outline-none [&>option]:bg-[#1a1a2e] [&>option]:text-white">
                      <option value="baixa">Baixa</option>
                      <option value="media">Média</option>
                      <option value="alta">Alta</option>
                      <option value="critica">Crítica</option>
                    </select>
                  ) : (
                    <span className={cn('text-2xs px-1.5 py-0.5 rounded font-medium', CHURN_COLORS[row.churnProbability])}>
                      {row.churnProbability}
                    </span>
                  )}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>

        {rows.length === 0 && (
          <div className="text-center py-10">
            <Table2 size={32} className="mx-auto text-text-muted mb-3 opacity-40" />
            <p className="text-sm text-text-muted">Nenhum cliente ativo na carteira</p>
          </div>
        )}
      </GlassCard>

      {/* Reminder Modal */}
      {createPortal(
        <AnimatePresence>
          {showReminderModal && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={e => e.target === e.currentTarget && setShowReminderModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                className="w-full max-w-sm glass-card-strong rounded-3xl overflow-hidden"
              >
                <div className="flex items-center justify-between px-6 py-4 border-b border-glass-border">
                  <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
                    <Calendar size={16} className="text-amber-400" />
                    Agendar Lembrete Semanal
                  </h2>
                  <button onClick={() => setShowReminderModal(false)} className="p-2 rounded-xl hover:bg-white/5 text-text-muted"><X size={16} /></button>
                </div>

                <div className="px-6 py-5 space-y-4">
                  <p className="text-xs text-text-secondary">
                    Escolha o dia e horário para ser lembrado de atualizar a Board Of Head.
                    <span className="text-red-400 font-medium"> Sexta-feira não é permitida.</span>
                  </p>

                  <div>
                    <label className="text-xs font-semibold text-text-secondary uppercase mb-1.5 block">Dia da Semana</label>
                    <div className="grid grid-cols-2 gap-2">
                      {DAYS.map(d => (
                        <button
                          key={d}
                          onClick={() => setReminderDay(d)}
                          className={cn(
                            'px-3 py-2 rounded-xl text-xs font-medium border transition-all',
                            reminderDay === d ? 'bg-galaxy-blue/15 text-galaxy-blue-light border-galaxy-blue/30' : 'bg-white/[0.02] text-text-muted border-glass-border'
                          )}
                        >{d}</button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-text-secondary uppercase mb-1.5 block">Horário</label>
                    <div className="grid grid-cols-4 gap-2">
                      {HOURS.map(h => (
                        <button
                          key={h}
                          onClick={() => setReminderHour(h)}
                          className={cn(
                            'px-2 py-2 rounded-xl text-xs font-medium border transition-all',
                            reminderHour === h ? 'bg-galaxy-blue/15 text-galaxy-blue-light border-galaxy-blue/30' : 'bg-white/[0.02] text-text-muted border-glass-border'
                          )}
                        >{h}</button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4 border-t border-glass-border">
                  <GradientButton className="w-full" leftIcon={<Bell size={14} />} onClick={handleSetReminder}>
                    Agendar {reminderDay} às {reminderHour}
                  </GradientButton>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
