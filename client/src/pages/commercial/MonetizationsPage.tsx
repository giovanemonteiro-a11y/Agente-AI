import { useState } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import { MonthSelector } from '@/components/commercial/MonthSelector';
import { TemperatureIndicator } from '@/components/commercial/TemperatureIndicator';
import { useMonetizations, useCreateMonetization, useUpdateMonetization, useAccountUsers } from '@/hooks/useCommercial';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import type { Monetization, MonetizationType, ProposalTemperature, MonetizationStatus, CreateMonetizationPayload } from '@/types/commercial';

function formatCurrency(value: string): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(parseFloat(value));
}

function currentMonthStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
}

const typeLabels: Record<MonetizationType, string> = {
  expansao: 'Expansão',
  drx: 'DR-X (Base)',
  ativacao: 'Ativação Inativo',
  indicacao: 'Indicação',
};

const statusLabels: Record<MonetizationStatus, { label: string; className: string }> = {
  proposta: { label: 'Proposta', className: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
  fechada: { label: 'Fechada', className: 'text-green-400 bg-green-500/10 border-green-500/20' },
  perdida: { label: 'Perdida', className: 'text-red-400 bg-red-500/10 border-red-500/20' },
};

// ─── Form Modal ───────────────────────────────────────────────────────────────

interface FormModalProps {
  onClose: () => void;
  editing?: Monetization | null;
  month: string;
}

function FormModal({ onClose, editing, month }: FormModalProps) {
  const createMut = useCreateMonetization();
  const updateMut = useUpdateMonetization();
  const { data: accounts = [] } = useAccountUsers();

  const [form, setForm] = useState({
    client_name: editing?.client_name ?? '',
    account_user_id: editing?.account_user_id ?? '',
    monetization_type: (editing?.monetization_type ?? 'expansao') as MonetizationType,
    product_service: editing?.product_service ?? '',
    value: editing ? parseFloat(editing.value) : 0,
    temperature: (editing?.temperature ?? 'frio') as ProposalTemperature,
    status: (editing?.status ?? 'proposta') as MonetizationStatus,
    notes: editing?.notes ?? '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) {
      await updateMut.mutateAsync({ id: editing.id, ...form });
    } else {
      const payload: CreateMonetizationPayload = { ...form, reference_month: month };
      await createMut.mutateAsync(payload);
    }
    onClose();
  }

  const isPending = createMut.isPending || updateMut.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass-card w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold text-text-primary">
          {editing ? 'Editar Monetização' : 'Nova Monetização'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs text-text-muted mb-1 block">Nome do Cliente *</label>
              <input
                className="glass-input w-full"
                value={form.client_name}
                onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))}
                required
                placeholder="Ex: Empresa XYZ"
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-text-muted mb-1 block">Account Responsável *</label>
              <select
                className="glass-input w-full"
                value={form.account_user_id}
                onChange={e => setForm(f => ({ ...f, account_user_id: e.target.value }))}
                required
              >
                <option value="">Selecione um account...</option>
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1 block">Tipo *</label>
              <select
                className="glass-input w-full"
                value={form.monetization_type}
                onChange={e => setForm(f => ({ ...f, monetization_type: e.target.value as MonetizationType }))}
              >
                {Object.entries(typeLabels).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1 block">Valor (R$) *</label>
              <input
                type="number"
                min={0}
                step={0.01}
                className="glass-input w-full"
                value={form.value}
                onChange={e => setForm(f => ({ ...f, value: parseFloat(e.target.value) || 0 }))}
                required
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-text-muted mb-1 block">Produto / Serviço *</label>
              <input
                className="glass-input w-full"
                value={form.product_service}
                onChange={e => setForm(f => ({ ...f, product_service: e.target.value }))}
                required
                placeholder="Ex: Gestão de Tráfego - Pacote Pro"
              />
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1 block">Temperatura</label>
              <select
                className="glass-input w-full"
                value={form.temperature}
                onChange={e => setForm(f => ({ ...f, temperature: e.target.value as ProposalTemperature }))}
              >
                <option value="quente">🔥 Quente</option>
                <option value="morno">💧 Morno</option>
                <option value="frio">❄️ Frio</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1 block">Status</label>
              <select
                className="glass-input w-full"
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value as MonetizationStatus }))}
              >
                <option value="proposta">Proposta</option>
                <option value="fechada">Fechada</option>
                <option value="perdida">Perdida</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-xs text-text-muted mb-1 block">Observações</label>
              <textarea
                className="glass-input w-full resize-none"
                rows={2}
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Informações adicionais..."
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 text-sm rounded-xl border border-glass-border text-text-muted hover:text-text-primary transition-colors">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 gradient-button text-sm py-2 disabled:opacity-50"
            >
              {isPending ? 'Salvando...' : editing ? 'Salvar' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function MonetizationsPage() {
  const [month, setMonth] = useState(currentMonthStr);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Monetization | null>(null);

  const { data: items = [], isLoading } = useMonetizations({ month });

  const filtered = items.filter(m => {
    const matchSearch = !search || m.client_name.toLowerCase().includes(search.toLowerCase()) ||
      (m.account_name ?? '').toLowerCase().includes(search.toLowerCase());
    const matchType = !filterType || m.monetization_type === filterType;
    const matchStatus = !filterStatus || m.status === filterStatus;
    return matchSearch && matchType && matchStatus;
  });

  function openCreate() { setEditing(null); setShowModal(true); }
  function openEdit(m: Monetization) { setEditing(m); setShowModal(true); }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Monetizações</h1>
          <p className="text-sm text-text-muted mt-0.5">Propostas e vendas registradas</p>
        </div>
        <div className="flex items-center gap-3">
          <MonthSelector value={month} onChange={setMonth} />
          <button onClick={openCreate} className="gradient-button flex items-center gap-2 text-sm px-4 py-2">
            <Plus size={16} />
            Nova
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            className="glass-input pl-9 w-full text-sm"
            placeholder="Buscar cliente ou account..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="glass-input text-sm"
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
        >
          <option value="">Todos os tipos</option>
          {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select
          className="glass-input text-sm"
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
        >
          <option value="">Todos os status</option>
          <option value="proposta">Proposta</option>
          <option value="fechada">Fechada</option>
          <option value="perdida">Perdida</option>
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-12"><LoadingSpinner /></div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-12 text-center text-text-muted">
          <Filter size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nenhuma monetização encontrada</p>
          <button onClick={openCreate} className="mt-4 text-sm text-galaxy-blue-light hover:underline">
            Registrar primeira monetização
          </button>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-text-muted border-b border-glass-border bg-white/[0.02]">
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Account</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Produto/Serviço</th>
                <th className="px-4 py-3 font-medium text-right">Valor</th>
                <th className="px-4 py-3 font-medium">Temp.</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-glass-border">
              {filtered.map(m => {
                const { label, className } = statusLabels[m.status];
                return (
                  <tr key={m.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 font-medium text-text-primary">{m.client_name}</td>
                    <td className="px-4 py-3 text-text-secondary">{m.account_name ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-text-muted">{typeLabels[m.monetization_type]}</span>
                    </td>
                    <td className="px-4 py-3 text-text-secondary max-w-[180px] truncate">{m.product_service}</td>
                    <td className="px-4 py-3 text-right font-semibold text-text-primary">{formatCurrency(m.value)}</td>
                    <td className="px-4 py-3">
                      <TemperatureIndicator value={m.temperature} />
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${className}`}>
                        {label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openEdit(m)}
                        className="text-xs text-text-muted hover:text-galaxy-blue-light transition-colors"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <FormModal
          onClose={() => setShowModal(false)}
          editing={editing}
          month={month}
        />
      )}
    </div>
  );
}
