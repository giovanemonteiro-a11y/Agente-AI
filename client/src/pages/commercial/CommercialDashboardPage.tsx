import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp, Target, Users, DollarSign, ArrowRight,
  Thermometer, BarChart3, Award
} from 'lucide-react';
import { MonthSelector } from '@/components/commercial/MonthSelector';
import { TemperatureOverview } from '@/components/commercial/TemperatureOverview';
import { GoalProgressBar } from '@/components/commercial/GoalProgressBar';
import { useCommercialDashboard } from '@/hooks/useCommercial';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);
}

function currentMonthStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
}

export function CommercialDashboardPage() {
  const [month, setMonth] = useState(currentMonthStr);
  const { data, isLoading } = useCommercialDashboard(month);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const d = data!;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Gestão Comercial</h1>
          <p className="text-sm text-text-muted mt-0.5">Visão geral de metas, monetizações e comissões</p>
        </div>
        <MonthSelector value={month} onChange={setMonth} />
      </div>

      {/* Meta geral — KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-4 space-y-1">
          <div className="flex items-center gap-2 text-text-muted text-xs uppercase tracking-wide">
            <Target size={13} />
            Meta Mensal
          </div>
          <p className="text-xl font-bold text-text-primary">{formatCurrency(d.monthly_goal)}</p>
          {d.goal && (
            <p className="text-xs text-text-muted">{d.goal.title}</p>
          )}
        </div>
        <div className="glass-card p-4 space-y-1">
          <div className="flex items-center gap-2 text-text-muted text-xs uppercase tracking-wide">
            <TrendingUp size={13} />
            Realizado
          </div>
          <p className="text-xl font-bold text-text-primary">{formatCurrency(d.total_achieved)}</p>
          <p className="text-xs text-galaxy-blue-light">{d.achievement_pct.toFixed(1)}% da meta</p>
        </div>
        <div className="glass-card p-4 space-y-1">
          <div className="flex items-center gap-2 text-text-muted text-xs uppercase tracking-wide">
            <Users size={13} />
            Meta / Account
          </div>
          <p className="text-xl font-bold text-text-primary">{formatCurrency(d.per_account_goal)}</p>
        </div>
        <div className="glass-card p-4 space-y-1">
          <div className="flex items-center gap-2 text-text-muted text-xs uppercase tracking-wide">
            <Award size={13} />
            Comissões Totais
          </div>
          <p className="text-xl font-bold text-text-primary">{formatCurrency(d.total_commission_value)}</p>
          <p className="text-xs text-text-muted">Coord: {formatCurrency(d.total_coordinator_value)}</p>
        </div>
      </div>

      {/* Progresso geral + Termômetro */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 glass-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <BarChart3 size={16} className="text-galaxy-blue" />
              Progresso por Account
            </h2>
            <Link to="/commercial/monetizations" className="text-xs text-galaxy-blue-light hover:underline flex items-center gap-1">
              Ver tudo <ArrowRight size={12} />
            </Link>
          </div>
          {d.by_account.length === 0 ? (
            <p className="text-sm text-text-muted py-4 text-center">Nenhuma monetização registrada neste mês</p>
          ) : (
            <div className="space-y-4">
              <GoalProgressBar
                label="Meta Geral"
                achieved={d.total_achieved}
                goal={d.monthly_goal}
                pct={d.achievement_pct}
                size="lg"
              />
              <div className="border-t border-glass-border pt-4 space-y-3">
                {d.by_account.map((acc) => (
                  <GoalProgressBar
                    key={acc.account_user_id}
                    label={acc.account_name}
                    achieved={acc.achieved}
                    goal={acc.individual_goal}
                    pct={acc.achievement_pct}
                    size="sm"
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="glass-card p-5 space-y-4">
          <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <Thermometer size={16} className="text-galaxy-pink" />
            Termômetro Geral
          </h2>
          <TemperatureOverview
            quente={d.temperature_summary.quente}
            morno={d.temperature_summary.morno}
            frio={d.temperature_summary.frio}
          />
          <p className="text-xs text-text-muted pt-1">
            Total: {d.temperature_summary.quente + d.temperature_summary.morno + d.temperature_summary.frio} propostas
          </p>
        </div>
      </div>

      {/* Monetizações recentes */}
      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <DollarSign size={16} className="text-galaxy-blue" />
            Resumo por Account
          </h2>
          <Link to="/commercial/monetizations" className="text-xs text-galaxy-blue-light hover:underline flex items-center gap-1">
            Gerenciar <ArrowRight size={12} />
          </Link>
        </div>
        {d.overview.length === 0 ? (
          <p className="text-sm text-text-muted py-4 text-center">Nenhum dado neste mês</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-text-muted border-b border-glass-border">
                  <th className="pb-2 font-medium">Account</th>
                  <th className="pb-2 font-medium text-right">Propostas</th>
                  <th className="pb-2 font-medium text-right">Fechadas</th>
                  <th className="pb-2 font-medium text-right">Valor</th>
                  <th className="pb-2 font-medium text-right">Comissão</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-glass-border">
                {d.overview.map((row, i) => {
                  const commission = d.commission_summary.find(c => c.account_user_id === row.account_user_id);
                  return (
                    <tr key={i} className="text-text-secondary hover:text-text-primary transition-colors">
                      <td className="py-2.5 font-medium">{row.account_name}</td>
                      <td className="py-2.5 text-right">{row.total_raised}</td>
                      <td className="py-2.5 text-right text-green-400">{row.total_closed}</td>
                      <td className="py-2.5 text-right font-semibold text-text-primary">
                        {formatCurrency(parseFloat(row.total_value_closed))}
                      </td>
                      <td className="py-2.5 text-right text-galaxy-blue-light font-semibold">
                        {commission ? formatCurrency(parseFloat(commission.total_commissions)) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { to: '/commercial/monetizations', label: 'Monetizações', icon: DollarSign, desc: 'Registrar e gerenciar vendas' },
          { to: '/commercial/commissions', label: 'Comissões', icon: Award, desc: 'Calcular e aprovar comissões' },
          { to: '/commercial/goals', label: 'Metas', icon: Target, desc: 'Configurar metas do período' },
        ].map(({ to, label, icon: Icon, desc }) => (
          <Link
            key={to}
            to={to}
            className="glass-card p-4 flex items-center gap-3 hover:bg-white/[0.04] transition-all group"
          >
            <div className="w-9 h-9 rounded-lg bg-galaxy-blue/10 flex items-center justify-center">
              <Icon size={16} className="text-galaxy-blue" />
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary group-hover:text-galaxy-blue-light transition-colors">{label}</p>
              <p className="text-xs text-text-muted">{desc}</p>
            </div>
            <ArrowRight size={14} className="ml-auto text-text-muted group-hover:text-galaxy-blue transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  );
}
