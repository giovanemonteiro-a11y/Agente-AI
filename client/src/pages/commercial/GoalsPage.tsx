import { useState } from 'react';
import { Plus, Target, Pencil, Trash2 } from 'lucide-react';
import { useGoals, useCreateGoal, useUpdateGoal, useDeleteGoal } from '@/hooks/useCommercial';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import type { CommercialGoal, CreateGoalPayload } from '@/types/commercial';

function formatCurrency(value: string): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(parseFloat(value));
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
}

// ─── Form Modal ───────────────────────────────────────────────────────────────

interface FormModalProps {
  onClose: () => void;
  editing?: CommercialGoal | null;
}

const defaultForm: Omit<CreateGoalPayload, 'created_by'> = {
  title: '',
  period_type: 'quarterly',
  period_start: '',
  period_end: '',
  total_goal: 0,
  expansion_goal: 0,
  drx_goal: 0,
  activation_goal: 0,
  referral_goal: 0,
};

function FormModal({ onClose, editing }: FormModalProps) {
  const createMut = useCreateGoal();
  const updateMut = useUpdateGoal();

  const [form, setForm] = useState<Omit<CreateGoalPayload, 'created_by'>>({
    title: editing?.title ?? '',
    period_type: editing?.period_type ?? 'quarterly',
    period_start: editing?.period_start?.slice(0, 10) ?? '',
    period_end: editing?.period_end?.slice(0, 10) ?? '',
    total_goal: editing ? parseFloat(editing.total_goal) : 0,
    expansion_goal: editing ? parseFloat(editing.expansion_goal) : 0,
    drx_goal: editing ? parseFloat(editing.drx_goal) : 0,
    activation_goal: editing ? parseFloat(editing.activation_goal) : 0,
    referral_goal: editing ? parseFloat(editing.referral_goal) : 0,
  });

  const isPending = createMut.isPending || updateMut.isPending;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) {
      await updateMut.mutateAsync({ id: editing.id, ...form });
    } else {
      await createMut.mutateAsync(form as CreateGoalPayload);
    }
    onClose();
  }

  function field(key: keyof typeof form, label: string, type: 'text' | 'date' | 'number' | 'select' = 'text') {
    if (type === 'select') {
      return (
        <div key={key}>
          <label className="text-xs text-text-muted mb-1 block">{label}</label>
          <select
            className="glass-input w-full"
            value={form[key] as string}
            onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          >
            <option value="quarterly">Trimestral</option>
            <option value="monthly">Mensal</option>
          </select>
        </div>
      );
    }
    return (
      <div key={key}>
        <label className="text-xs text-text-muted mb-1 block">{label}</label>
        <input
          type={type}
          className="glass-input w-full"
          value={form[key] as string | number}
          min={type === 'number' ? 0 : undefined}
          step={type === 'number' ? 0.01 : undefined}
          onChange={e => setForm(f => ({
            ...f,
            [key]: type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value,
          }))}
          required={key === 'title' || key === 'period_start' || key === 'period_end'}
        />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass-card w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold text-text-primary">
          {editing ? 'Editar Meta' : 'Nova Meta'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          {field('title', 'Título *')}
          {field('period_type', 'Tipo de Período', 'select')}
          <div className="grid grid-cols-2 gap-3">
            {field('period_start', 'Início *', 'date')}
            {field('period_end', 'Fim *', 'date')}
          </div>
          <div className="border-t border-glass-border pt-3">
            <p className="text-xs text-text-muted mb-3 uppercase tracking-wide">Metas por Categoria (R$)</p>
            <div className="grid grid-cols-2 gap-3">
              {field('total_goal', 'Meta Total', 'number')}
              {field('expansion_goal', 'Expansão', 'number')}
              {field('drx_goal', 'DR-X (Base)', 'number')}
              {field('activation_goal', 'Ativação Inativo', 'number')}
              {field('referral_goal', 'Indicação', 'number')}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 text-sm rounded-xl border border-glass-border text-text-muted hover:text-text-primary transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={isPending} className="flex-1 gradient-button text-sm py-2 disabled:opacity-50">
              {isPending ? 'Salvando...' : editing ? 'Salvar' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function GoalsPage() {
  const { data: goals = [], isLoading } = useGoals();
  const deleteMut = useDeleteGoal();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<CommercialGoal | null>(null);

  function openCreate() { setEditing(null); setShowModal(true); }
  function openEdit(g: CommercialGoal) { setEditing(g); setShowModal(true); }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Metas</h1>
          <p className="text-sm text-text-muted mt-0.5">Configuração de metas comerciais</p>
        </div>
        <button onClick={openCreate} className="gradient-button flex items-center gap-2 text-sm px-4 py-2">
          <Plus size={16} />
          Nova Meta
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><LoadingSpinner /></div>
      ) : goals.length === 0 ? (
        <div className="glass-card p-12 text-center text-text-muted">
          <Target size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nenhuma meta cadastrada</p>
          <button onClick={openCreate} className="mt-4 text-sm text-galaxy-blue-light hover:underline">
            Criar primeira meta
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {goals.map(g => (
            <div key={g.id} className="glass-card p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-text-primary">{g.title}</h3>
                  <p className="text-xs text-text-muted mt-0.5">
                    {formatDate(g.period_start)} → {formatDate(g.period_end)} ·{' '}
                    {g.period_type === 'quarterly' ? 'Trimestral' : 'Mensal'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => openEdit(g)} className="p-1.5 text-text-muted hover:text-galaxy-blue-light transition-colors">
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => { if (confirm('Excluir esta meta?')) deleteMut.mutate(g.id); }}
                    className="p-1.5 text-text-muted hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                  { label: 'Total', value: g.total_goal },
                  { label: 'Expansão', value: g.expansion_goal },
                  { label: 'DR-X', value: g.drx_goal },
                  { label: 'Ativação', value: g.activation_goal },
                  { label: 'Indicação', value: g.referral_goal },
                ].map(({ label, value }) => (
                  <div key={label} className="text-center p-3 bg-white/[0.03] rounded-xl border border-glass-border">
                    <p className="text-xs text-text-muted mb-1">{label}</p>
                    <p className="text-sm font-bold text-text-primary">{formatCurrency(value)}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <FormModal onClose={() => setShowModal(false)} editing={editing} />
      )}
    </div>
  );
}
