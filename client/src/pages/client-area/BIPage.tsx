import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BarChart2,
  Sparkles,
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { GradientButton } from '@/components/shared/GradientButton';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useAuth } from '@/hooks/useAuth';
import { useBI, useGenerateBI } from '@/hooks/useBI';
import type { KPIPerformance, BIRecommendation } from '@/types/bi';
import { cn } from '@/lib/utils';

// -- KPI status config --------------------------------------------------------

const STATUS_CONFIG: Record<
  KPIPerformance['status'],
  { label: string; variant: 'success' | 'info' | 'error'; icon: React.ReactNode }
> = {
  achieved: {
    label: 'Atingido',
    variant: 'success',
    icon: <CheckCircle size={11} />,
  },
  on_track: {
    label: 'No caminho',
    variant: 'info',
    icon: <Clock size={11} />,
  },
  behind: {
    label: 'Abaixo',
    variant: 'error',
    icon: <AlertTriangle size={11} />,
  },
};

// -- Trend arrow --------------------------------------------------------------

function TrendArrow({ trend }: { trend: KPIPerformance['trend'] }) {
  if (trend === 'up') return <TrendingUp size={14} className="text-emerald-400" />;
  if (trend === 'down') return <TrendingDown size={14} className="text-red-400" />;
  return <Minus size={14} className="text-text-muted" />;
}

// -- Recommendation priority config -------------------------------------------

const PRIORITY_CONFIG: Record<
  BIRecommendation['priority'],
  { label: string; variant: 'error' | 'warning' | 'neutral' }
> = {
  high: { label: 'Alta', variant: 'error' },
  medium: { label: 'M\u00e9dia', variant: 'warning' },
  low: { label: 'Baixa', variant: 'neutral' },
};

// -- Main page ----------------------------------------------------------------

export function BIPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const { isSuperAdmin, isAccount, isCoordenador } = useAuth();
  const canGenerate = isSuperAdmin || isAccount || isCoordenador;

  const { data: bi, isLoading, error } = useBI(clientId);
  const generateMutation = useGenerateBI(clientId);

  const handleGenerate = () => {
    generateMutation.mutate();
  };

  const d = bi?.data_json;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <PageHeader
        title="BI do Cliente"
        subtitle="Business intelligence individual gerado por IA"
        actions={
          canGenerate ? (
            <GradientButton
              leftIcon={!generateMutation.isPending ? <Sparkles size={14} /> : undefined}
              isLoading={generateMutation.isPending}
              onClick={handleGenerate}
            >
              Gerar An\u00e1lise BI
            </GradientButton>
          ) : undefined
        }
      />

      {/* Error from generate mutation */}
      {generateMutation.error && (
        <GlassCard className="p-4 border border-red-500/20 bg-red-500/5">
          <p className="text-red-400 text-sm">
            {(generateMutation.error as { response?: { data?: { error?: string } } })?.response?.data?.error ??
              'Erro ao gerar an\u00e1lise. Verifique se h\u00e1 relat\u00f3rios de campanha cadastrados.'}
          </p>
        </GlassCard>
      )}

      {/* Loading */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-text-muted" />
        </div>
      ) : error ? (
        <GlassCard className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-text-secondary text-sm">Erro ao carregar an\u00e1lise BI.</p>
        </GlassCard>
      ) : !bi || !d ? (
        // Empty state
        <GlassCard className="flex flex-col items-center justify-center py-20 text-center">
          <BarChart2 size={40} className="text-text-muted mb-4" />
          <h2 className="text-lg font-semibold text-text-primary mb-2">
            Nenhuma an\u00e1lise gerada
          </h2>
          <p className="text-text-secondary text-sm max-w-sm mb-4">
            {canGenerate
              ? 'Gere a primeira an\u00e1lise BI para visualizar insights de performance das campanhas deste cliente.'
              : 'Nenhuma an\u00e1lise BI dispon\u00edvel para este cliente ainda.'}
          </p>
          {canGenerate && (
            <GradientButton
              leftIcon={!generateMutation.isPending ? <Sparkles size={14} /> : undefined}
              isLoading={generateMutation.isPending}
              onClick={handleGenerate}
            >
              Gerar An\u00e1lise BI
            </GradientButton>
          )}
        </GlassCard>
      ) : (
        <div className="space-y-6">
          {/* Period summary */}
          {d.period_summary && (
            <GlassCard className="p-4">
              <p className="text-xs text-text-muted uppercase tracking-wide mb-2">Resumo do per\u00edodo</p>
              <p className="text-text-secondary text-sm leading-relaxed">{d.period_summary}</p>
            </GlassCard>
          )}

          {/* KPI Performance table */}
          {d.kpi_performance && d.kpi_performance.length > 0 && (
            <GlassCard className="p-4">
              <p className="text-xs text-text-muted uppercase tracking-wide mb-3">
                Performance de KPIs
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left py-2 pr-4 text-text-muted font-medium text-xs">KPI</th>
                      <th className="text-left py-2 pr-4 text-text-muted font-medium text-xs">Meta</th>
                      <th className="text-left py-2 pr-4 text-text-muted font-medium text-xs">Real</th>
                      <th className="text-left py-2 pr-4 text-text-muted font-medium text-xs">Status</th>
                      <th className="text-left py-2 text-text-muted font-medium text-xs">Tend\u00eancia</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.kpi_performance.map((kpi, i) => {
                      const s = STATUS_CONFIG[kpi.status] ?? STATUS_CONFIG.on_track;
                      return (
                        <tr key={i} className="border-b border-white/5 last:border-0">
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
                Insights das campanhas
              </p>
              <p className="text-text-secondary text-sm leading-relaxed">{d.campaign_insights}</p>
            </GlassCard>
          )}

          {/* Content performance */}
          {d.content_performance_notes && (
            <GlassCard className="p-4">
              <p className="text-xs text-text-muted uppercase tracking-wide mb-2">
                Performance de conte\u00fado
              </p>
              <p className="text-text-secondary text-sm leading-relaxed">
                {d.content_performance_notes}
              </p>
            </GlassCard>
          )}

          {/* Recommendations */}
          {d.recommendations && d.recommendations.length > 0 && (
            <GlassCard className="p-4">
              <p className="text-xs text-text-muted uppercase tracking-wide mb-3">
                Recomenda\u00e7\u00f5es
              </p>
              <div className="space-y-3">
                {d.recommendations.map((rec, i) => {
                  const p = PRIORITY_CONFIG[rec.priority] ?? PRIORITY_CONFIG.medium;
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
            <GlassCard className="p-4 border border-red-500/20 bg-red-500/[0.03]">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={14} className="text-red-400" />
                <p className="text-xs text-red-400 uppercase tracking-wide font-medium">
                  Alertas de risco
                </p>
              </div>
              <ul className="space-y-2">
                {d.risk_flags.map((flag, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-red-400 mt-0.5 shrink-0">&bull;</span>
                    <p className="text-text-secondary text-sm">{flag}</p>
                  </li>
                ))}
              </ul>
            </GlassCard>
          )}

          {/* Generated at */}
          {bi.updated_at && (
            <p className="text-text-muted text-xs text-right">
              An\u00e1lise gerada em {new Date(bi.updated_at).toLocaleString('pt-BR')}
            </p>
          )}
        </div>
      )}
    </motion.div>
  );
}
