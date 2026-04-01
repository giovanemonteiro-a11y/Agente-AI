import { useState } from 'react';
import { Award, Play, CheckCircle, Loader2 } from 'lucide-react';
import { MonthSelector } from '@/components/commercial/MonthSelector';
import { CommissionTierBadge } from '@/components/commercial/CommissionTierBadge';
import { useCommissions, useCommissionSummary, useCalculateCommissions, useApproveCommission } from '@/hooks/useCommercial';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

function formatCurrency(value: string | number): string {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(n);
}

function currentMonthStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
}

const statusLabels = {
  pending:  { label: 'Pendente', className: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
  approved: { label: 'Aprovada', className: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  paid:     { label: 'Paga',     className: 'text-green-400 bg-green-500/10 border-green-500/20' },
};

const typeLabels: Record<string, string> = {
  expansao: 'Expansão', drx: 'DR-X', ativacao: 'Ativação', indicacao: 'Indicação',
};

export function CommissionsPage() {
  const [month, setMonth] = useState(currentMonthStr);

  const { data: commissions = [], isLoading } = useCommissions({ month });
  const { data: summary = [] } = useCommissionSummary(month);
  const calculateMut = useCalculateCommissions();
  const approveMut = useApproveCommission();

  const totalComm = summary.reduce((s, r) => s + parseFloat(r.total_commissions), 0);
  const totalCoord = summary.reduce((s, r) => s + parseFloat(r.total_coordinator), 0);

  async function handleCalculate() {
    await calculateMut.mutateAsync(month);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Comissões</h1>
          <p className="text-sm text-text-muted mt-0.5">Cálculo e aprovação de comissões</p>
        </div>
        <div className="flex items-center gap-3">
          <MonthSelector value={month} onChange={setMonth} />
          <button
            onClick={handleCalculate}
            disabled={calculateMut.isPending}
            className="gradient-button flex items-center gap-2 text-sm px-4 py-2 disabled:opacity-50"
          >
            {calculateMut.isPending ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
            Calcular Comissões
          </button>
        </div>
      </div>

      {/* Summary cards */}
      {summary.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card p-4 col-span-2">
            <p className="text-xs text-text-muted uppercase tracking-wide mb-1 flex items-center gap-1">
              <Award size={12} /> Total Comissões Consultores
            </p>
            <p className="text-2xl font-bold gradient-text">{formatCurrency(totalComm)}</p>
          </div>
          <div className="glass-card p-4 col-span-2">
            <p className="text-xs text-text-muted uppercase tracking-wide mb-1">Total Coordenador</p>
            <p className="text-2xl font-bold text-text-primary">{formatCurrency(totalCoord)}</p>
          </div>
          {summary.map(s => (
            <div key={s.account_user_id} className="glass-card p-4">
              <p className="text-xs text-text-muted truncate mb-1">{s.account_name}</p>
              <p className="text-lg font-bold text-text-primary">{formatCurrency(s.total_commissions)}</p>
              <p className="text-xs text-text-muted">{s.count} deal(s)</p>
            </div>
          ))}
        </div>
      )}

      {/* Commission table */}
      {isLoading ? (
        <div className="flex justify-center py-12"><LoadingSpinner /></div>
      ) : commissions.length === 0 ? (
        <div className="glass-card p-12 text-center text-text-muted">
          <Award size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nenhuma comissão calculada neste mês</p>
          <p className="text-xs mt-1">Clique em "Calcular Comissões" para processar</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-text-muted border-b border-glass-border bg-white/[0.02]">
                <th className="px-4 py-3 font-medium">Account</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium text-right">Valor Venda</th>
                <th className="px-4 py-3 font-medium">Comissão</th>
                <th className="px-4 py-3 font-medium text-right">Coord.</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-glass-border">
              {commissions.map(c => {
                const { label, className } = statusLabels[c.status];
                return (
                  <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 font-medium text-text-primary">{c.account_name ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-text-muted">
                      {/* monetization type via join would be ideal; showing tier */}
                      {c.tier_name ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">{formatCurrency(c.deal_value)}</td>
                    <td className="px-4 py-3">
                      <CommissionTierBadge
                        tierName={c.tier_name}
                        commissionPct={c.commission_pct}
                        commissionValue={c.commission_value}
                      />
                    </td>
                    <td className="px-4 py-3 text-right text-text-secondary">{formatCurrency(c.coordinator_value)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${className}`}>
                        {label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {c.status === 'pending' && (
                        <button
                          onClick={() => approveMut.mutate({ id: c.id, status: 'approved' })}
                          disabled={approveMut.isPending}
                          className="flex items-center gap-1 text-xs text-galaxy-blue-light hover:underline disabled:opacity-50"
                        >
                          <CheckCircle size={12} />
                          Aprovar
                        </button>
                      )}
                      {c.status === 'approved' && (
                        <button
                          onClick={() => approveMut.mutate({ id: c.id, status: 'paid' })}
                          disabled={approveMut.isPending}
                          className="flex items-center gap-1 text-xs text-green-400 hover:underline disabled:opacity-50"
                        >
                          <CheckCircle size={12} />
                          Marcar Pago
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
