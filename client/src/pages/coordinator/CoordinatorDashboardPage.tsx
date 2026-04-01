import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Users, TrendingUp, DollarSign, AlertTriangle, Shield, Target,
  Clock, ArrowUpRight, ArrowDownRight, Zap, BarChart3, CalendarClock,
  FileText, UserCheck, ChevronRight, Briefcase, Activity, Eye,
} from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

// ─── Types ──────────────────────────────────────────────────────────────────

interface DashboardData {
  overview: {
    totalClients: number;
    activeClients: number;
    churnedClients: number;
    inTratativa: number;
    newClients: number;
    pendingHandoffs: number;
  };
  financial: {
    totalMRR: number;
    totalMediaInvestment: number;
    avgExpectedMargin: number;
    mrrAtRisk: number;
  };
  roi: { clientsTracked: number; roiAbove1: number; roiOnTarget: number };
  churnRisk: { baixa: number; media: number; alta: number; critica: number };
  trios: Array<{
    id: string; name: string; accountName: string; designerName: string;
    gtName: string; techName: string; clientCount: number;
  }>;
  sprint: {
    weekStart: string; weekEnd: string; totalTasks: number; completed: number;
    completionRate: number; totalHours: number; refractions: number; refractionRate: number;
  } | null;
  board: { totalRows: number; withGoalMet: number; avgCsat: number } | null;
  insights: Array<{ type: 'warning' | 'success' | 'info' | 'action'; title: string; message: string }>;
  forecast: { churnRate: number; projectedChurn3m: number; mrrAtRisk: number; avgLT: number };
}

// ─── Animations ─────────────────────────────────────────────────────────────

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };
const fadeUp = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatCurrency(val: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(val);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

// ─── Sub-Components ─────────────────────────────────────────────────────────

function MetricCard({ icon, label, value, sub, color, trend }: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string;
  color: string; trend?: 'up' | 'down' | 'neutral';
}) {
  return (
    <GlassCard variant="strong" padding="none">
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', color)}>
            {icon}
          </div>
          {trend === 'up' && <ArrowUpRight size={16} className="text-emerald-400" />}
          {trend === 'down' && <ArrowDownRight size={16} className="text-red-400" />}
        </div>
        <p className="text-2xl font-bold text-text-primary">{value}</p>
        <p className="text-xs text-text-muted mt-0.5">{label}</p>
        {sub && <p className="text-2xs text-text-muted/70 mt-0.5">{sub}</p>}
      </div>
    </GlassCard>
  );
}

function InsightCard({ insight }: { insight: DashboardData['insights'][0] }) {
  const colors = {
    warning: { bg: 'bg-amber-500/10 border-amber-500/20', icon: 'text-amber-400', iconBg: 'bg-amber-500/10' },
    success: { bg: 'bg-emerald-500/10 border-emerald-500/20', icon: 'text-emerald-400', iconBg: 'bg-emerald-500/10' },
    info: { bg: 'bg-galaxy-blue/10 border-galaxy-blue/20', icon: 'text-galaxy-blue-light', iconBg: 'bg-galaxy-blue/10' },
    action: { bg: 'bg-red-500/10 border-red-500/20', icon: 'text-red-400', iconBg: 'bg-red-500/10' },
  };
  const c = colors[insight.type];
  const icons = { warning: AlertTriangle, success: Shield, info: Eye, action: Zap };
  const Icon = icons[insight.type];

  return (
    <div className={cn('flex items-start gap-3 p-3 rounded-xl border', c.bg)}>
      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', c.iconBg)}>
        <Icon size={16} className={c.icon} />
      </div>
      <div>
        <p className="text-sm font-medium text-text-primary">{insight.title}</p>
        <p className="text-xs text-text-secondary mt-0.5">{insight.message}</p>
      </div>
    </div>
  );
}

function ChurnRiskBar({ data }: { data: DashboardData['churnRisk'] }) {
  const total = data.baixa + data.media + data.alta + data.critica;
  if (total === 0) return <p className="text-xs text-text-muted">Sem clientes ativos</p>;

  const segments = [
    { key: 'baixa', label: 'Baixa', count: data.baixa, color: 'bg-emerald-500' },
    { key: 'media', label: 'Média', count: data.media, color: 'bg-amber-500' },
    { key: 'alta', label: 'Alta', count: data.alta, color: 'bg-orange-500' },
    { key: 'critica', label: 'Crítica', count: data.critica, color: 'bg-red-500' },
  ];

  return (
    <div>
      <div className="flex h-3 rounded-full overflow-hidden bg-white/5 mb-3">
        {segments.map(s => s.count > 0 && (
          <div key={s.key} className={cn('transition-all', s.color)} style={{ width: `${(s.count / total) * 100}%` }} />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {segments.map(s => (
          <div key={s.key} className="flex items-center gap-1.5">
            <div className={cn('w-2.5 h-2.5 rounded-full', s.color)} />
            <span className="text-2xs text-text-muted">{s.label}: <span className="text-text-primary font-medium">{s.count}</span></span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TrioCard({ trio }: { trio: DashboardData['trios'][0] }) {
  const navigate = useNavigate();
  return (
    <button onClick={() => navigate('/coordinator/trios')} className="text-left w-full">
      <GlassCard variant="default" padding="none">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-text-primary">{trio.name.split(' — ')[0]}</h4>
            <span className="text-2xs text-text-muted bg-white/5 px-2 py-0.5 rounded-full">
              {trio.clientCount} cliente{trio.clientCount !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="space-y-1.5">
            {[
              { role: 'Account', name: trio.accountName },
              { role: 'Designer', name: trio.designerName },
              { role: 'GT', name: trio.gtName },
            ].map(m => (
              <div key={m.role} className="flex items-center gap-2">
                <span className="text-2xs text-text-muted w-14">{m.role}</span>
                <span className="text-xs text-text-secondary">{m.name}</span>
              </div>
            ))}
          </div>
        </div>
      </GlassCard>
    </button>
  );
}

function QuickLink({ icon, label, to, badge }: { icon: React.ReactNode; label: string; to: string; badge?: number }) {
  const navigate = useNavigate();
  return (
    <button onClick={() => navigate(to)} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/[0.04] transition-all w-full text-left group">
      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 group-hover:bg-galaxy-blue/10 transition-colors">
        {icon}
      </div>
      <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors flex-1">{label}</span>
      {badge != null && badge > 0 && (
        <span className="text-2xs font-bold text-white bg-galaxy-pink px-1.5 py-0.5 rounded-full">{badge}</span>
      )}
      <ChevronRight size={14} className="text-text-muted group-hover:text-text-primary transition-colors" />
    </button>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export function CoordinatorDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const firstName = user?.name?.split(' ')[0] ?? 'Coordenador';

  const { data, isLoading } = useQuery({
    queryKey: ['coordinator-dashboard'],
    queryFn: async () => {
      const res = await api.get<{ data: DashboardData }>('/coordinator/clients/dashboard');
      return res.data.data;
    },
    refetchInterval: 60000,
  });

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <div><div className="h-8 w-48 rounded shimmer" /><div className="h-4 w-72 rounded shimmer mt-2" /></div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-28 rounded-2xl shimmer" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-48 rounded-2xl shimmer" />
          <div className="h-48 rounded-2xl shimmer" />
        </div>
      </div>
    );
  }

  const o = data.overview;
  const f = data.financial;

  return (
    <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-6 pb-8">
      {/* Header */}
      <motion.div variants={fadeUp}>
        <h1 className="text-2xl font-bold text-text-primary">
          Olá, <span className="gradient-text">{firstName}</span>
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Painel de Coordenação · {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </motion.div>

      {/* Metric Cards — Row 1: Overview */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard icon={<Users size={18} />} label="Clientes Ativos" value={o.activeClients} color="bg-galaxy-blue/10 text-galaxy-blue-light" sub={`${o.totalClients} total · ${o.newClients} novo(s)`} />
        <MetricCard icon={<AlertTriangle size={18} />} label="Em Tratativa" value={o.inTratativa} color="bg-amber-500/10 text-amber-400" trend={o.inTratativa > 0 ? 'down' : 'neutral'} />
        <MetricCard icon={<Activity size={18} />} label="Churned" value={o.churnedClients} color="bg-red-500/10 text-red-400" sub={`Taxa: ${data.forecast.churnRate}%`} />
        <MetricCard icon={<FileText size={18} />} label="Handoffs Pendentes" value={o.pendingHandoffs} color="bg-galaxy-pink/10 text-galaxy-pink-light" />
      </motion.div>

      {/* Metric Cards — Row 2: Financial */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard icon={<DollarSign size={18} />} label="MRR Total" value={formatCurrency(f.totalMRR)} color="bg-emerald-500/10 text-emerald-400" />
        <MetricCard icon={<TrendingUp size={18} />} label="Investimento Mídia" value={formatCurrency(f.totalMediaInvestment)} color="bg-cyan-500/10 text-cyan-400" />
        <MetricCard icon={<Target size={18} />} label="Margem Média" value={`${f.avgExpectedMargin}%`} color="bg-purple-500/10 text-purple-400" />
        <MetricCard icon={<DollarSign size={18} />} label="MRR em Risco" value={formatCurrency(f.mrrAtRisk)} color="bg-red-500/10 text-red-400" trend={f.mrrAtRisk > 0 ? 'down' : 'neutral'} />
      </motion.div>

      {/* Two-column row: Insights + Churn Risk */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* AI Insights */}
        <GlassCard variant="strong" padding="none">
          <div className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Zap size={16} className="text-galaxy-pink-light" />
              <h3 className="text-sm font-semibold text-text-primary">Insights Inteligentes</h3>
            </div>
            {data.insights.length === 0 ? (
              <p className="text-xs text-text-muted text-center py-6">Todos os indicadores estão saudáveis</p>
            ) : (
              <div className="space-y-2">
                {data.insights.map((insight, i) => <InsightCard key={i} insight={insight} />)}
              </div>
            )}
          </div>
        </GlassCard>

        {/* Churn Risk + Forecast */}
        <GlassCard variant="strong" padding="none">
          <div className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Shield size={16} className="text-emerald-400" />
              <h3 className="text-sm font-semibold text-text-primary">Risco de Churn & Previsão</h3>
            </div>
            <ChurnRiskBar data={data.churnRisk} />
            <div className="mt-4 pt-4 border-t border-glass-border space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-text-muted">LT Médio da Carteira</span>
                <span className="text-text-primary font-medium">{data.forecast.avgLT} dias</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-text-muted">Projeção Churn 3 meses</span>
                <span className={cn('font-medium', data.forecast.projectedChurn3m > 1 ? 'text-red-400' : 'text-emerald-400')}>
                  ~{data.forecast.projectedChurn3m} cliente(s)
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-text-muted">MRR em Risco (alta/crítica)</span>
                <span className="text-red-400 font-medium">{formatCurrency(data.forecast.mrrAtRisk)}</span>
              </div>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Three-column: Sprint + Board + ROI */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sprint Summary */}
        <GlassCard variant="strong" padding="none">
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CalendarClock size={16} className="text-galaxy-blue-light" />
                <h3 className="text-sm font-semibold text-text-primary">Sprint Semanal</h3>
              </div>
              <button onClick={() => navigate('/coordinator/sprint')} className="text-2xs text-galaxy-blue-light hover:underline">Ver</button>
            </div>
            {data.sprint ? (
              <div className="space-y-3">
                <p className="text-2xs text-text-muted">{formatDate(data.sprint.weekStart)} — {formatDate(data.sprint.weekEnd)}</p>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-bold text-text-primary">{data.sprint.completionRate}%</span>
                  <span className="text-xs text-text-muted mb-1">concluída</span>
                </div>
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-galaxy-blue to-galaxy-purple transition-all" style={{ width: `${data.sprint.completionRate}%` }} />
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="text-center p-2 rounded-lg bg-white/[0.02]">
                    <p className="text-lg font-bold text-text-primary">{data.sprint.totalTasks}</p>
                    <p className="text-2xs text-text-muted">Tarefas</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-white/[0.02]">
                    <p className="text-lg font-bold text-text-primary">{data.sprint.totalHours}h</p>
                    <p className="text-2xs text-text-muted">Estimadas</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-text-muted text-center py-6">Nenhuma sprint ativa</p>
            )}
          </div>
        </GlassCard>

        {/* ROI Performance */}
        <GlassCard variant="strong" padding="none">
          <div className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Target size={16} className="text-emerald-400" />
              <h3 className="text-sm font-semibold text-text-primary">Performance ROI</h3>
            </div>
            {data.roi.clientsTracked > 0 ? (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-4xl font-bold gradient-text">{data.roi.roiAbove1}/{data.roi.clientsTracked}</p>
                  <p className="text-xs text-text-muted mt-1">clientes com ROI &gt; 1</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-white/[0.02]">
                  <p className="text-lg font-bold text-emerald-400">{data.roi.roiOnTarget}</p>
                  <p className="text-2xs text-text-muted">atingindo meta de ROI</p>
                </div>
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${data.roi.clientsTracked > 0 ? (data.roi.roiOnTarget / data.roi.clientsTracked) * 100 : 0}%` }} />
                </div>
              </div>
            ) : (
              <p className="text-xs text-text-muted text-center py-6">Nenhum ROI configurado</p>
            )}
          </div>
        </GlassCard>

        {/* Quick Actions */}
        <GlassCard variant="strong" padding="none">
          <div className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Briefcase size={16} className="text-galaxy-pink-light" />
              <h3 className="text-sm font-semibold text-text-primary">Acesso Rápido</h3>
            </div>
            <div className="space-y-1">
              <QuickLink icon={<BarChart3 size={14} className="text-galaxy-blue-light" />} label="CRM" to="/coordinator/crm" badge={o.pendingHandoffs} />
              <QuickLink icon={<Users size={14} className="text-emerald-400" />} label="Meus Clientes" to="/coordinator/clients" />
              <QuickLink icon={<UserCheck size={14} className="text-purple-400" />} label="Trios" to="/coordinator/trios" />
              <QuickLink icon={<Clock size={14} className="text-amber-400" />} label="Board Of Head" to="/coordinator/board-of-head" />
              <QuickLink icon={<CalendarClock size={14} className="text-cyan-400" />} label="Sprint" to="/coordinator/sprint" />
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Trios Overview */}
      <motion.div variants={fadeUp}>
        <div className="flex items-center gap-2 mb-3">
          <UserCheck size={16} className="text-galaxy-blue-light" />
          <h3 className="text-sm font-semibold text-text-primary">Meus Trios</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {data.trios.map(trio => <TrioCard key={trio.id} trio={trio} />)}
        </div>
      </motion.div>
    </motion.div>
  );
}
