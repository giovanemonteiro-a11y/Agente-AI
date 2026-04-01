import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarClock, Plus, Check, Clock, AlertTriangle, Loader2, X,
  ChevronDown, ChevronUp, User, Target, Filter, BarChart3,
  ArrowRight, Zap, TrendingUp, AlertCircle, Archive, RefreshCw,
} from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { GradientButton } from '@/components/shared/GradientButton';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

// ─── Types ──────────────────────────────────────────────────────────────────

interface SprintData {
  id: string;
  coordinator_id: string;
  week_start: string;
  week_end: string;
  is_current: boolean;
  is_backlog: boolean;
  status: string;
}

interface SprintTask {
  id: string;
  sprint_id: string;
  client_name: string;
  client_id: string | null;
  task_type: string;
  task_type_custom: string | null;
  description: string;
  executor_id: string | null;
  executor_name: string;
  estimated_hours: number;
  actual_hours: number | null;
  priority: string;
  priority_date: string | null;
  status: string;
  is_planned: boolean;
  is_refracao: boolean;
  refracao_reason: string | null;
  from_backlog: boolean;
  created_at: string;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
}

interface Metrics {
  current: {
    total_tasks: string;
    completed: string;
    in_progress: string;
    pending: string;
    blocked: string;
    refracoes: string;
    unplanned: string;
    total_estimated_hours: string;
    total_actual_hours: string;
    completed_hours: string;
  };
  hoursPerExecutor: { executor_name: string; estimated: string; actual: string; task_count: string; completed: string }[];
  hoursPerClient: { client_name: string; estimated: string; task_count: string }[];
  historical: { week_start: string; total_tasks: string; completed: string; refracoes: string; estimated_hours: string }[];
}

// ─── Constants ──────────────────────────────────────────────────────────────

const MAX_HOURS_PER_DAY = 6;
const WORK_DAYS = 5;
const MAX_WEEKLY_HOURS = MAX_HOURS_PER_DAY * WORK_DAYS; // 30h/week

const TASK_TYPES: Record<string, string> = {
  criativo_campanha: 'Criativo de Campanha',
  criativo_social_media: 'Criativo Social Media',
  branding_book: 'Branding Book',
  miv: 'MIV',
  site: 'Site',
  ecommerce: 'E-commerce',
  landing_page: 'Landing Page',
  patrocinado: 'Patrocinado',
  setup: 'Setup',
  configuracao: 'Configuração',
  personalizado: 'Personalizado',
};

const PRIORITY_COLORS: Record<string, string> = {
  urgente: 'text-red-500 bg-red-500/10 border-red-500/20',
  alta: 'text-red-400 bg-red-500/10 border-red-500/20',
  media: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  baixa: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pendente: { label: 'Pendente', color: 'text-amber-400 bg-amber-500/10', icon: <Clock size={10} /> },
  em_andamento: { label: 'Em Andamento', color: 'text-blue-400 bg-blue-500/10', icon: <RefreshCw size={10} /> },
  concluida: { label: 'Concluída', color: 'text-emerald-400 bg-emerald-500/10', icon: <Check size={10} /> },
  bloqueada: { label: 'Bloqueada', color: 'text-red-400 bg-red-500/10', icon: <AlertCircle size={10} /> },
  cancelada: { label: 'Cancelada', color: 'text-text-muted bg-white/5', icon: <X size={10} /> },
};

// ═══════════════════════════════════════════════════════════════════════════════

export function SprintPage() {
  const { user } = useAuth();
  const isCoordinator = user?.role === 'coordenador' || user?.role === 'super_admin';
  const isAccount = user?.role === 'account';
  const canEdit = isCoordinator || isAccount;

  const [sprint, setSprint] = useState<SprintData | null>(null);
  const [backlog, setBacklog] = useState<SprintData | null>(null);
  const [tasks, setTasks] = useState<SprintTask[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  // UI State
  const [activeTab, setActiveTab] = useState<'sprint' | 'backlog' | 'metrics'>('sprint');
  const [showNewTask, setShowNewTask] = useState(false);
  const [filterExecutor, setFilterExecutor] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Week info
  const now = new Date();
  const isFriday = now.getDay() === 5;

  // Fetch data
  useEffect(() => {
    async function fetch() {
      try {
        const [sprintRes, metricsRes] = await Promise.all([
          api.get<{ data: { sprint: SprintData; backlog: SprintData; tasks: SprintTask[]; teamMembers: TeamMember[] } }>('/sprint/current'),
          api.get<{ data: Metrics }>('/sprint/metrics'),
        ]);
        const d = sprintRes.data.data;
        setSprint(d.sprint);
        setBacklog(d.backlog);
        setTasks(d.tasks);
        setTeamMembers(d.teamMembers);
        setMetrics(metricsRes.data.data);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    }
    fetch();
  }, []);

  // Computed
  const sprintTasks = useMemo(() => {
    let list = tasks.filter(t => t.sprint_id === sprint?.id);
    if (filterExecutor) list = list.filter(t => t.executor_name === filterExecutor);
    if (filterType) list = list.filter(t => t.task_type === filterType);
    if (filterStatus) list = list.filter(t => t.status === filterStatus);
    return list;
  }, [tasks, sprint?.id, filterExecutor, filterType, filterStatus]);

  const backlogTasks = useMemo(() =>
    tasks.filter(t => t.sprint_id === backlog?.id),
  [tasks, backlog?.id]);

  const executorNames = useMemo(() =>
    [...new Set(tasks.map(t => t.executor_name))].filter(Boolean),
  [tasks]);

  // Stats
  const totalEstimated = sprintTasks.reduce((s, t) => s + (t.estimated_hours || 0), 0);
  const completedCount = sprintTasks.filter(t => t.status === 'concluida').length;
  const refracaoCount = sprintTasks.filter(t => t.is_refracao).length;
  const unplannedCount = sprintTasks.filter(t => !t.is_planned).length;
  const completionRate = sprintTasks.length > 0 ? Math.round((completedCount / sprintTasks.length) * 100) : 0;

  // Hours per executor
  const executorHours = useMemo(() => {
    const map: Record<string, number> = {};
    sprintTasks.forEach(t => {
      map[t.executor_name] = (map[t.executor_name] || 0) + (t.estimated_hours || 0);
    });
    return Object.entries(map).map(([name, hours]) => ({
      name,
      hours,
      maxHours: MAX_WEEKLY_HOURS,
      pct: Math.round((hours / MAX_WEEKLY_HOURS) * 100),
      overloaded: hours > MAX_WEEKLY_HOURS,
    }));
  }, [sprintTasks]);

  // Handlers
  async function handleStatusChange(taskId: string, newStatus: string) {
    if (!canEdit) return;
    try {
      await api.patch(`/sprint/tasks/${taskId}`, { status: newStatus });
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    } catch { /* ignore */ }
  }

  async function handleTaskCreated(task: SprintTask) {
    setTasks(prev => [...prev, task]);
    setShowNewTask(false);
  }

  async function moveToBacklog(taskId: string) {
    if (!backlog || !canEdit) return;
    try {
      await api.patch(`/sprint/tasks/${taskId}`, { sprint_id: backlog.id });
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, sprint_id: backlog.id } : t));
    } catch { /* ignore */ }
  }

  async function moveToSprint(taskId: string) {
    if (!sprint || !canEdit) return;
    try {
      await api.patch(`/sprint/tasks/${taskId}`, { sprint_id: sprint.id, from_backlog: true });
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, sprint_id: sprint.id, from_backlog: true } : t));
    } catch { /* ignore */ }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-galaxy-blue-light" /></div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-3">
            <CalendarClock className="text-galaxy-blue-light" size={24} />
            Sprint Semanal
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            {sprint?.week_start && `Semana: ${new Date(sprint.week_start).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} — ${new Date(sprint.week_end).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`}
            {' · '}{sprintTasks.length} tarefas · {totalEstimated.toFixed(1)}h estimadas
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isFriday && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs">
              <AlertTriangle size={14} />
              Sexta-feira: organize a sprint da próxima semana!
            </div>
          )}
          {canEdit && (
            <GradientButton leftIcon={<Plus size={14} />} onClick={() => setShowNewTask(true)} size="sm">
              Nova Demanda
            </GradientButton>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Total', value: sprintTasks.length, color: 'text-text-primary' },
          { label: 'Concluídas', value: `${completionRate}%`, color: 'text-emerald-400' },
          { label: 'Horas Estimadas', value: `${totalEstimated.toFixed(0)}h`, color: 'text-blue-400' },
          { label: 'Refrações', value: refracaoCount, color: refracaoCount > 0 ? 'text-red-400' : 'text-text-muted' },
          { label: 'Não Planejadas', value: unplannedCount, color: unplannedCount > 0 ? 'text-amber-400' : 'text-text-muted' },
        ].map(s => (
          <GlassCard key={s.label} padding="sm">
            <p className={cn('text-xl font-bold', s.color)}>{s.value}</p>
            <p className="text-2xs text-text-muted">{s.label}</p>
          </GlassCard>
        ))}
      </div>

      {/* Hours per executor (SMART capacity) */}
      {executorHours.length > 0 && (
        <GlassCard padding="md" className="mb-6">
          <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
            <User size={14} className="text-galaxy-blue-light" />
            Horas por Executor (máx {MAX_WEEKLY_HOURS}h/semana · {MAX_HOURS_PER_DAY}h/dia)
          </h3>
          <div className="space-y-2">
            {executorHours.map(e => (
              <div key={e.name} className="flex items-center gap-3">
                <span className="text-xs text-text-secondary w-32 truncate">{e.name}</span>
                <div className="flex-1 h-4 bg-white/[0.03] rounded-full overflow-hidden border border-glass-border">
                  <div
                    className={cn('h-full rounded-full transition-all', e.overloaded ? 'bg-red-500' : e.pct > 80 ? 'bg-amber-500' : 'bg-galaxy-blue')}
                    style={{ width: `${Math.min(e.pct, 100)}%` }}
                  />
                </div>
                <span className={cn('text-xs font-medium w-16 text-right', e.overloaded ? 'text-red-400' : 'text-text-secondary')}>
                  {e.hours.toFixed(1)}h ({e.pct}%)
                </span>
                {e.overloaded && <AlertTriangle size={12} className="text-red-400" />}
              </div>
            ))}
          </div>
          {executorHours.some(e => e.overloaded) && (
            <div className="mt-3 flex items-start gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
              <Zap size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-2xs text-red-400">
                <strong>Atenção:</strong> Há executores com mais de {MAX_WEEKLY_HOURS}h na semana. Considere redistribuir demandas para evitar sobrecarga.
              </p>
            </div>
          )}
        </GlassCard>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-4 p-1 bg-white/[0.02] rounded-xl border border-glass-border w-fit">
        {[
          { key: 'sprint', label: 'Sprint da Semana', count: sprintTasks.length },
          { key: 'backlog', label: 'Sprint Backlog', count: backlogTasks.length },
          { key: 'metrics', label: 'Métricas', count: null },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={cn(
              'px-4 py-2 rounded-lg text-xs font-medium transition-all',
              activeTab === tab.key
                ? 'bg-galaxy-blue/15 text-galaxy-blue-light shadow-glow-blue-sm'
                : 'text-text-muted hover:text-text-secondary'
            )}
          >
            {tab.label} {tab.count !== null && <span className="ml-1 opacity-60">({tab.count})</span>}
          </button>
        ))}
      </div>

      {/* Filters (for sprint/backlog tabs) */}
      {activeTab !== 'metrics' && (
        <div className="flex flex-wrap gap-2 mb-4">
          <select value={filterExecutor} onChange={e => setFilterExecutor(e.target.value)} className="bg-[#1a1a2e] border border-glass-border rounded-lg px-3 py-1.5 text-xs text-text-primary focus:outline-none [&>option]:bg-[#1a1a2e] [&>option]:text-white">
            <option value="">Todos executores</option>
            {executorNames.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className="bg-[#1a1a2e] border border-glass-border rounded-lg px-3 py-1.5 text-xs text-text-primary focus:outline-none [&>option]:bg-[#1a1a2e] [&>option]:text-white">
            <option value="">Todos os tipos</option>
            {Object.entries(TASK_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-[#1a1a2e] border border-glass-border rounded-lg px-3 py-1.5 text-xs text-text-primary focus:outline-none [&>option]:bg-[#1a1a2e] [&>option]:text-white">
            <option value="">Todos status</option>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          {(filterExecutor || filterType || filterStatus) && (
            <button onClick={() => { setFilterExecutor(''); setFilterType(''); setFilterStatus(''); }} className="text-2xs text-text-muted hover:text-text-primary px-2">
              Limpar filtros
            </button>
          )}
        </div>
      )}

      {/* Sprint Tasks */}
      {activeTab === 'sprint' && (
        <div className="space-y-2">
          {sprintTasks.length === 0 ? (
            <GlassCard padding="lg" className="text-center">
              <CalendarClock size={32} className="mx-auto text-text-muted mb-3 opacity-40" />
              <p className="text-sm text-text-muted">Nenhuma demanda na sprint da semana</p>
              {canEdit && <p className="text-xs text-text-muted mt-1">Clique em "Nova Demanda" para adicionar</p>}
            </GlassCard>
          ) : (
            sprintTasks.map((task, i) => (
              <TaskRow
                key={task.id}
                task={task}
                index={i}
                canEdit={canEdit}
                onStatusChange={handleStatusChange}
                onMoveToBacklog={moveToBacklog}
              />
            ))
          )}
        </div>
      )}

      {/* Backlog */}
      {activeTab === 'backlog' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-text-secondary flex items-center gap-2">
              <Archive size={12} /> Demandas que surgiram durante a semana para organizar na próxima sprint
            </p>
          </div>
          {backlogTasks.length === 0 ? (
            <GlassCard padding="lg" className="text-center">
              <Archive size={32} className="mx-auto text-text-muted mb-3 opacity-40" />
              <p className="text-sm text-text-muted">Backlog vazio</p>
            </GlassCard>
          ) : (
            backlogTasks.map((task, i) => (
              <TaskRow
                key={task.id}
                task={task}
                index={i}
                canEdit={canEdit}
                onStatusChange={handleStatusChange}
                onMoveToSprint={moveToSprint}
                isBacklog
              />
            ))
          )}
        </div>
      )}

      {/* Metrics */}
      {activeTab === 'metrics' && metrics && (
        <div className="space-y-6">
          {/* Present */}
          <GlassCard padding="lg">
            <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Target size={14} className="text-blue-400" /> Presente — Sprint Atual
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total de Tarefas', value: metrics.current.total_tasks },
                { label: 'Concluídas', value: metrics.current.completed },
                { label: 'Em Andamento', value: metrics.current.in_progress },
                { label: 'Pendentes', value: metrics.current.pending },
                { label: 'Horas Estimadas', value: `${parseFloat(metrics.current.total_estimated_hours).toFixed(0)}h` },
                { label: 'Horas Concluídas', value: `${parseFloat(metrics.current.completed_hours).toFixed(0)}h` },
                { label: 'Refrações', value: metrics.current.refracoes },
                { label: 'Não Planejadas', value: metrics.current.unplanned },
              ].map(m => (
                <div key={m.label} className="px-3 py-2 rounded-xl bg-white/[0.02] border border-glass-border">
                  <p className="text-lg font-bold text-text-primary">{m.value}</p>
                  <p className="text-2xs text-text-muted">{m.label}</p>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Hours per executor */}
          {metrics.hoursPerExecutor.length > 0 && (
            <GlassCard padding="lg">
              <h3 className="text-sm font-semibold text-text-primary mb-3">Horas por Executor</h3>
              <div className="space-y-2">
                {metrics.hoursPerExecutor.map(e => (
                  <div key={e.executor_name} className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.02] border border-glass-border">
                    <span className="text-xs text-text-primary">{e.executor_name}</span>
                    <div className="flex items-center gap-4 text-xs text-text-muted">
                      <span>{e.task_count} tarefas</span>
                      <span>{parseFloat(e.estimated).toFixed(1)}h estimadas</span>
                      <span className="text-emerald-400">{e.completed} concluídas</span>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {/* Hours per client */}
          {metrics.hoursPerClient.length > 0 && (
            <GlassCard padding="lg">
              <h3 className="text-sm font-semibold text-text-primary mb-3">Horas por Projeto (Cliente)</h3>
              <div className="space-y-2">
                {metrics.hoursPerClient.map(c => (
                  <div key={c.client_name} className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.02] border border-glass-border">
                    <span className="text-xs text-text-primary">{c.client_name}</span>
                    <span className="text-xs text-text-muted">{parseFloat(c.estimated).toFixed(1)}h · {c.task_count} tarefas</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {/* Historical (Past) */}
          {metrics.historical.length > 1 && (
            <GlassCard padding="lg">
              <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
                <TrendingUp size={14} className="text-galaxy-purple" /> Passado — Últimas Sprints
              </h3>
              <div className="space-y-2">
                {metrics.historical.map(h => (
                  <div key={h.week_start} className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.02] border border-glass-border">
                    <span className="text-xs text-text-secondary">{new Date(h.week_start).toLocaleDateString('pt-BR')}</span>
                    <div className="flex items-center gap-4 text-xs text-text-muted">
                      <span>{h.total_tasks} tarefas</span>
                      <span className="text-emerald-400">{h.completed} concluídas</span>
                      <span>{h.refracoes} refrações</span>
                      <span>{parseFloat(h.estimated_hours).toFixed(0)}h</span>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {/* Future Insights */}
          <GlassCard padding="lg" className="border-l-2 border-galaxy-blue/30 bg-galaxy-blue/[0.02]">
            <h3 className="text-sm font-semibold text-text-primary mb-2 flex items-center gap-2">
              <Zap size={14} className="text-galaxy-blue-light" /> Insights e Recomendações
            </h3>
            <div className="space-y-2 text-xs text-text-secondary">
              {refracaoCount > 2 && (
                <p className="flex items-start gap-2">
                  <AlertTriangle size={12} className="text-amber-400 flex-shrink-0 mt-0.5" />
                  Alto índice de refrações ({refracaoCount}). Avalie se o planejamento da sprint precisa de mais buffer.
                </p>
              )}
              {unplannedCount > sprintTasks.length * 0.3 && (
                <p className="flex items-start gap-2">
                  <AlertTriangle size={12} className="text-amber-400 flex-shrink-0 mt-0.5" />
                  {Math.round((unplannedCount / sprintTasks.length) * 100)}% das demandas não foram planejadas. Considere reservar mais tempo para imprevistos.
                </p>
              )}
              {executorHours.some(e => e.overloaded) && (
                <p className="flex items-start gap-2">
                  <AlertCircle size={12} className="text-red-400 flex-shrink-0 mt-0.5" />
                  Executores sobrecarregados detectados. Redistribua demandas para manter o limite de {MAX_HOURS_PER_DAY}h/dia.
                </p>
              )}
              {completionRate > 80 && (
                <p className="flex items-start gap-2">
                  <CheckCircle size={12} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                  Excelente taxa de conclusão ({completionRate}%). A equipe está bem calibrada.
                </p>
              )}
              {sprintTasks.length === 0 && (
                <p className="text-text-muted">Adicione demandas à sprint para ver insights personalizados.</p>
              )}
            </div>
          </GlassCard>
        </div>
      )}

      {/* New Task Modal */}
      {createPortal(
        <AnimatePresence>
          {showNewTask && sprint && backlog && (
            <NewTaskModal
              sprintId={sprint.id}
              backlogId={backlog.id}
              coordinatorId={sprint.coordinator_id}
              teamMembers={teamMembers}
              onClose={() => setShowNewTask(false)}
              onCreated={handleTaskCreated}
            />
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CheckCircle helper (used in insights)
function CheckCircle({ size, className }: { size: number; className: string }) {
  return <Check size={size} className={className} />;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TASK ROW
// ═══════════════════════════════════════════════════════════════════════════════

function TaskRow({ task, index, canEdit, onStatusChange, onMoveToBacklog, onMoveToSprint, isBacklog }: {
  task: SprintTask; index: number; canEdit: boolean;
  onStatusChange: (id: string, status: string) => void;
  onMoveToBacklog?: (id: string) => void;
  onMoveToSprint?: (id: string) => void;
  isBacklog?: boolean;
}) {
  const statusCfg = STATUS_CONFIG[task.status] ?? STATUS_CONFIG.pendente;
  const nextStatus: Record<string, string> = {
    pendente: 'em_andamento',
    em_andamento: 'concluida',
    concluida: 'pendente',
    bloqueada: 'pendente',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02 }}
      className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.02] border border-glass-border hover:border-glass-border-strong transition-all group"
    >
      {/* Status toggle */}
      {canEdit && (
        <button
          onClick={() => onStatusChange(task.id, nextStatus[task.status] ?? 'pendente')}
          className={cn(
            'w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all',
            task.status === 'concluida' ? 'bg-emerald-500 border-emerald-500' :
            task.status === 'em_andamento' ? 'border-blue-500 bg-blue-500/20' :
            'border-glass-border-strong hover:border-galaxy-blue/50'
          )}
        >
          {task.status === 'concluida' && <Check size={10} className="text-white" />}
          {task.status === 'em_andamento' && <div className="w-2 h-2 rounded-full bg-blue-400" />}
        </button>
      )}

      {/* Client */}
      <span className="text-2xs text-text-muted w-24 truncate flex-shrink-0">{task.client_name}</span>

      {/* Description */}
      <div className="flex-1 min-w-0">
        <p className={cn('text-xs font-medium truncate', task.status === 'concluida' ? 'text-text-muted line-through' : 'text-text-primary')}>
          {task.description}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-2xs text-text-muted">{TASK_TYPES[task.task_type] ?? task.task_type}</span>
          {!task.is_planned && <span className="text-2xs text-amber-400">última hora</span>}
          {task.is_refracao && <span className="text-2xs text-red-400">refração</span>}
        </div>
      </div>

      {/* Executor */}
      <span className="text-2xs text-text-muted w-20 truncate text-right flex-shrink-0">{task.executor_name}</span>

      {/* Hours */}
      <span className="text-2xs text-text-muted w-10 text-right flex-shrink-0">{task.estimated_hours}h</span>

      {/* Priority */}
      <span className={cn('text-2xs px-1.5 py-0.5 rounded font-medium border flex-shrink-0', PRIORITY_COLORS[task.priority])}>
        {task.priority}
      </span>

      {/* Status */}
      <span className={cn('text-2xs px-1.5 py-0.5 rounded font-medium flex items-center gap-1 flex-shrink-0', statusCfg.color)}>
        {statusCfg.icon} {statusCfg.label}
      </span>

      {/* Move actions */}
      {canEdit && !isBacklog && onMoveToBacklog && (
        <button
          onClick={() => onMoveToBacklog(task.id)}
          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/5 text-text-muted hover:text-amber-400 transition-all"
          title="Mover para backlog"
        >
          <Archive size={12} />
        </button>
      )}
      {canEdit && isBacklog && onMoveToSprint && (
        <button
          onClick={() => onMoveToSprint(task.id)}
          className="p-1 rounded hover:bg-white/5 text-text-muted hover:text-galaxy-blue-light transition-all"
          title="Mover para sprint"
        >
          <ArrowRight size={12} />
        </button>
      )}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// NEW TASK MODAL
// ═══════════════════════════════════════════════════════════════════════════════

function NewTaskModal({ sprintId, backlogId, coordinatorId, teamMembers, onClose, onCreated }: {
  sprintId: string; backlogId: string; coordinatorId: string;
  teamMembers: TeamMember[];
  onClose: () => void; onCreated: (task: SprintTask) => void;
}) {
  const [clientName, setClientName] = useState('');
  const [taskType, setTaskType] = useState('personalizado');
  const [taskTypeCustom, setTaskTypeCustom] = useState('');
  const [description, setDescription] = useState('');
  const [executorName, setExecutorName] = useState('');
  const [executorId, setExecutorId] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('2');
  const [priority, setPriority] = useState('media');
  const [priorityDate, setPriorityDate] = useState('');
  const [isPlanned, setIsPlanned] = useState(true);
  const [isRefracao, setIsRefracao] = useState(false);
  const [refracaoReason, setRefracaoReason] = useState('');
  const [targetBacklog, setTargetBacklog] = useState(false);
  const [sending, setSending] = useState(false);

  const inputCls = 'w-full bg-[#1a1a2e] border border-glass-border rounded-xl px-3 py-2 text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-galaxy-blue/40 transition-all [&>option]:bg-[#1a1a2e] [&>option]:text-text-primary';
  const labelCls = 'text-2xs font-semibold text-text-secondary uppercase tracking-wider mb-1 block';

  async function handleSubmit() {
    if (!clientName || !description || !executorName) return;
    setSending(true);
    try {
      const res = await api.post<{ data: SprintTask }>('/sprint/tasks', {
        sprint_id: targetBacklog ? backlogId : sprintId,
        coordinator_id: coordinatorId,
        client_name: clientName,
        task_type: taskType,
        task_type_custom: taskType === 'personalizado' ? taskTypeCustom : null,
        description,
        executor_id: executorId || null,
        executor_name: executorName,
        estimated_hours: parseFloat(estimatedHours) || 1,
        priority,
        priority_date: priorityDate || null,
        is_planned: isPlanned,
        is_refracao: isRefracao,
        refracao_reason: isRefracao ? refracaoReason : null,
        from_backlog: targetBacklog,
      });
      onCreated(res.data.data);
    } catch { /* ignore */ }
    finally { setSending(false); }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
        className="w-full max-w-lg glass-card-strong rounded-3xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-glass-border flex-shrink-0">
          <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
            <Plus size={16} className="text-galaxy-blue-light" />
            Nova Demanda
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-text-muted"><X size={16} /></button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          {/* Target */}
          <div className="flex gap-2">
            {[{ key: false, label: 'Sprint da Semana' }, { key: true, label: 'Backlog' }].map(t => (
              <button
                key={String(t.key)}
                onClick={() => setTargetBacklog(t.key)}
                className={cn('flex-1 px-3 py-2 rounded-xl text-xs font-medium border transition-all',
                  targetBacklog === t.key ? 'bg-galaxy-blue/15 text-galaxy-blue-light border-galaxy-blue/30' : 'bg-white/[0.02] text-text-muted border-glass-border'
                )}
              >{t.label}</button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls}>Cliente *</label><input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Nome do cliente" className={inputCls} /></div>
            <div>
              <label className={labelCls}>Executor *</label>
              <select
                value={executorName}
                onChange={e => {
                  setExecutorName(e.target.value);
                  const member = teamMembers.find(m => m.name === e.target.value);
                  setExecutorId(member?.id ?? '');
                }}
                className={inputCls}
              >
                <option value="">Selecione...</option>
                {teamMembers.map(m => <option key={m.id} value={m.name}>{m.name} ({m.role})</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls}>Tipo de Tarefa</label>
            <select value={taskType} onChange={e => setTaskType(e.target.value)} className={inputCls}>
              {Object.entries(TASK_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            {taskType === 'personalizado' && (
              <input value={taskTypeCustom} onChange={e => setTaskTypeCustom(e.target.value)} placeholder="Tipo personalizado" className={cn(inputCls, 'mt-2')} />
            )}
          </div>

          <div><label className={labelCls}>Descrição *</label><textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Descreva a demanda..." className={cn(inputCls, 'h-20 resize-none')} /></div>

          <div className="grid grid-cols-3 gap-3">
            <div><label className={labelCls}>Horas Estimadas</label><input type="number" min={0.5} step={0.5} value={estimatedHours} onChange={e => setEstimatedHours(e.target.value)} className={inputCls} /></div>
            <div>
              <label className={labelCls}>Prioridade</label>
              <select value={priority} onChange={e => setPriority(e.target.value)} className={inputCls}>
                <option value="urgente">Urgente</option>
                <option value="alta">Alta</option>
                <option value="media">Média</option>
                <option value="baixa">Baixa</option>
              </select>
            </div>
            <div><label className={labelCls}>Data Prioridade</label><input type="date" value={priorityDate} onChange={e => setPriorityDate(e.target.value)} className={inputCls} /></div>
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={!isPlanned} onChange={e => setIsPlanned(!e.target.checked)} className="accent-amber-500" />
              <span className="text-xs text-text-secondary">Entrou de última hora</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isRefracao} onChange={e => setIsRefracao(e.target.checked)} className="accent-red-500" />
              <span className="text-xs text-text-secondary">É refração</span>
            </label>
          </div>

          {isRefracao && (
            <div><label className={labelCls}>Motivo da Refração</label><input value={refracaoReason} onChange={e => setRefracaoReason(e.target.value)} placeholder="Por que está sendo refeito?" className={inputCls} /></div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-glass-border flex-shrink-0">
          <GradientButton
            className="w-full"
            disabled={!clientName || !description || !executorName || sending}
            loading={sending}
            leftIcon={<Plus size={14} />}
            onClick={handleSubmit}
          >
            {targetBacklog ? 'Adicionar ao Backlog' : 'Adicionar à Sprint'}
          </GradientButton>
        </div>
      </motion.div>
    </motion.div>
  );
}
