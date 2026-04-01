import { motion } from 'framer-motion';
import {
  BarChart3,
  Sparkles,
  Loader2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  DollarSign,
  Activity,
} from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { GradientButton } from '@/components/shared/GradientButton';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useAuth } from '@/hooks/useAuth';
import { useGlobalBI, useGenerateGlobalBI } from '@/hooks/useBI';
import type { KPIPerformance, BIRecommendation } from '@/types/bi';
import { cn } from '@/lib/utils';

// ── Helpers ───────────────────────────────────────────────────────────────────

function TrendArrow({ trend }: { trend: KPIPerformance['trend'] }) {
  if (trend === 'up') return <TrendingUp size={14} className="text-emerald-400" />;
  if (trend === 'down') return <TrendingDown size={14} className="text-red-400" />;
  return <Minus size={14} className="text-text-muted" />;
}

const STATUS_VARIANT: Record<KPIPerformance['status'], { variant: 'success' | 'info' | 'error'; label: string }> = {
  achieved: { variant: 'success', label: 'Atingido' },
  on_track: { variant: 'info', label: 'No caminho' },
  behind: { variant: 'error', label: 'Abaixo' },
};

const PRIORITY_VARIANT: Record<
  BIRecommendation['priority'],
  { variant: 'error' | 'warning' | 'neutral'; label: string }
> = {
  high: { variant: 'error', label: 'Alta' },
  medium: { variant: 'warning', label: 'Média' },
  low: { variant: 'neutral', label: 'Baixa' },
};

// ── Page entrance animation ──────────────────────────────────────────────────

const pageVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  color = 'blue',
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color?: 'blue' | 'emerald' | 'amber';
}) {
  const colorMap = {
    blue: 'text-galaxy-blue-light bg-galaxy-blue/10',
    emerald: 'text-emerald-400 bg-emerald-500/10',
    amber: 'text-amber-400 bg-amber-500/10',
  };

  return (
    <GlassCard className="p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={cn('p-2 rounded-lg', colorMap[color])}>{icon}</div>
        <p className="text-text-muted text-sm">{label}</p>
      </div>
      <p className="text-2xl font-bold text-text-primary">{value}</p>
    </GlassCard>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function GlobalBIPage() {
  const { isSuperAdmin, isAccount, isLideranca, isCoordenador } = useAuth();
  const canView = isSuperAdmin || isAccount || isLideranca || isCoordenador;
  const canGenerate = isSuperAdmin || isCoordenador;

  const { data: bi, isLoading, error } = useGlobalBI();
  const generateMutation = useGenerateGlobalBI();

  const handleGenerate = () => {
    generateMutation.mutate();
  };

  const d = bi?.data_json;

  // Aggregate stats derived from period_summary or data_json
  const totalClients = d?.kpi_performance?.length
    ? `${d.kpi_performance.length} KPIs`
    : '—';

  const totalSpend = (() => {
    if (!d) return '—';
    // Try to find spend-related KPI
    const spendKPI = d.kpi_performance?.find(
      (k) => k.kpi.toLowerCase().includes('invest') || k.kpi.toLowerCase().includes('spend')
    );
    return spendKPI?.actual ?? '—';
  })();

  const avgROAS = (() => {
    if (!d) return '—';
    const roasKPI = d.kpi_performance?.find((k) => k.kpi.toLowerCase().includes('roas'));
    return roasKPI?.actual ?? '—';
  })();

  if (!canView) {
    return (
      <motion.div
        className="space-y-6"
        variants={pageVariants}
        initial="hidden"
        animate="visible"
      >
        <PageHeader title="BI Global" />
        <GlassCard className="flex flex-col items-center justify-center py-20 text-center">
          <AlertTriangle size={40} className="text-text-muted mb-4" />
          <p className="text-text-secondary text-sm">
            Acesso restrito. Apenas administradores e accounts podem visualizar o BI Global.
          </p>
        </GlassCard>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="space-y-6"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <PageHeader
        title="BI Global"
        subtitle="Business intelligence consolidado de toda a agência"
        actions={
          canGenerate ? (
            <GradientButton
              leftIcon={!generateMutation.isPending ? <Sparkles size={14} /> : undefined}
              isLoading={generateMutation.isPending}
              onClick={handleGenerate}
            >
              Gerar BI Global
            </GradientButton>
          ) : undefined
        }
      />

      {/* Error from generate */}
      {generateMutation.error && (
        <GlassCard className="p-4 border-red-500/20 bg-red-500/[0.05]">
          <p className="text-red-400 text-sm">Erro ao gerar BI global. Tente novamente.</p>
        </GlassCard>
      )}

      {/* Loading */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-text-muted" />
        </div>
      ) : error ? (
        <GlassCard className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-text-secondary text-sm">Erro ao carregar BI global.</p>
        </GlassCard>
      ) : !bi || !d || (!d.kpi_performance?.length && !d.campaign_insights && !d.period_summary) ? (
        // Empty state
        <GlassCard className="flex flex-col items-center justify-center py-20 text-center">
          <BarChart3 size={40} className="text-text-muted mb-4" />
          <h2 className="text-lg font-semibold text-text-primary mb-2">
            BI Global não gerado
          </h2>
          <p className="text-text-secondary text-sm max-w-sm mb-4">
            {canGenerate
              ? 'Gere o BI global para obter uma visão consolidada de performance de todos os clientes da agência.'
              : 'O BI global ainda não foi gerado. Peça ao administrador para gerá-lo.'}
          </p>
          {canGenerate && (
            <GradientButton
              leftIcon={!generateMutation.isPending ? <Sparkles size={14} /> : undefined}
              isLoading={generateMutation.isPending}
              onClick={handleGenerate}
            >
              Gerar BI Global
            </GradientButton>
          )}
        </GlassCard>
      ) : (
        <div className="space-y-6">
          {/* Aggregate stats */}
          <div className="grid grid-cols-3 gap-4">
            <StatCard
              icon={<Users size={18} />}
              label="KPIs monitorados"
              value={totalClients}
              color="blue"
            />
            <StatCard
              icon={<DollarSign size={18} />}
              label="Investimento total"
              value={totalSpend}
              color="emerald"
            />
            <StatCard
              icon={<Activity size={18} />}
              label="ROAS médio"
              value={avgROAS}
              color="amber"
            />
          </div>

          {/* Period summary */}
          {d.period_summary && (
            <GlassCard className="p-4">
              <p className="text-xs text-text-muted uppercase tracking-wide mb-2">
                Resumo global do período
              </p>
              <p className="text-text-secondary text-sm leading-relaxed">{d.period_summary}</p>
            </GlassCard>
          )}

          {/* KPI Performance table */}
          {d.kpi_performance && d.kpi_performance.length > 0 && (
            <GlassCard className="p-4">
              <p className="text-xs text-text-muted uppercase tracking-wide mb-3">
                Performance de KPIs — Visão Global
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.05]">
                      <th className="text-left py-2 pr-4 text-text-muted font-medium text-xs">KPI</th>
                      <th className="text-left py-2 pr-4 text-text-muted font-medium text-xs">Meta</th>
                      <th className="text-left py-2 pr-4 text-text-muted font-medium text-xs">Real</th>
                      <th className="text-left py-2 pr-4 text-text-muted font-medium text-xs">Status</th>
                      <th className="text-left py-2 text-text-muted font-medium text-xs">Tendência</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.kpi_performance.map((kpi, i) => {
                      const s = STATUS_VARIANT[kpi.status] ?? STATUS_VARIANT.on_track;
                      return (
                        <tr key={i} className="border-b border-white/[0.05] last:border-0">
                          <td className="py-2.5 pr-4 text-text-primary font-medium">{kpi.kpi}</td>
                          <td className="py-2.5 pr-4 text-text-secondary">{kpi.target}</td>
                          <td className="py-2.5 pr-4 text-text-secondary">{kpi.actual}</td>
                          <td className="py-2.5 pr-4">
                            <StatusBadge variant={s.variant} label={s.label} dot={false} />
                          </td>
                          <td className="py-2.5">
                            <TrendArrow trend={kpi.trend} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          )}

          {/* Campaign insights */}
          {d.campaign_insights && (
            <GlassCard className="p-4">
              <p className="text-xs text-text-muted uppercase tracking-wide mb-2">
                Análise das campanhas
              </p>
              <p className="text-text-secondary text-sm leading-relaxed">{d.campaign_insights}</p>
            </GlassCard>
          )}

          {/* Content performance notes */}
          {d.content_performance_notes && (
            <GlassCard className="p-4">
              <p className="text-xs text-text-muted uppercase tracking-wide mb-2">
                Performance de conteúdo
              </p>
              <p className="text-text-secondary text-sm leading-relaxed">
                {d.content_performance_notes}
              </p>
            </GlassCard>
          )}

          {/* Global recommendations */}
          {d.recommendations && d.recommendations.length > 0 && (
            <GlassCard className="p-4">
              <p className="text-xs text-text-muted uppercase tracking-wide mb-3">
                Recomendações globais
              </p>
              <div className="space-y-3">
                {d.recommendations.map((rec, i) => {
                  const p = PRIORITY_VARIANT[rec.priority] ?? PRIORITY_VARIANT.medium;
                  return (
                    <div key={i} className="flex items-start gap-3">
                      <StatusBadge
                        variant={p.variant}
                        label={p.label}
                        dot={false}
                        className="shrink-0 mt-0.5"
                      />
                      <div>
                        <p className="text-text-primary text-sm font-medium">{rec.recommendation}</p>
                        {rec.rationale && (
                          <p className="text-text-muted text-xs mt-0.5">{rec.rationale}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </GlassCard>
          )}

          {/* Risk flags */}
          {d.risk_flags && d.risk_flags.length > 0 && (
            <GlassCard className="p-4 border-red-500/20 bg-red-500/[0.03]">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={14} className="text-red-400" />
                <p className="text-xs text-red-400 uppercase tracking-wide font-medium">
                  Alertas globais de risco
                </p>
              </div>
              <ul className="space-y-2">
                {d.risk_flags.map((flag, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-red-400 mt-0.5 shrink-0">•</span>
                    <p className="text-text-secondary text-sm">{flag}</p>
                  </li>
                ))}
              </ul>
            </GlassCard>
          )}

          {/* Generated at */}
          {bi.updated_at && (
            <p className="text-text-muted text-xs text-right">
              Análise gerada em {new Date(bi.updated_at).toLocaleString('pt-BR')}
            </p>
          )}
        </div>
      )}
    </motion.div>
  );
}
