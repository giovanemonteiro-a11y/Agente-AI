import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, CheckCircle, CalendarCheck, ArrowRight, TrendingUp } from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { GradientButton } from '@/components/shared/GradientButton';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useAuth } from '@/hooks/useAuth';
import { useClients } from '@/hooks/useClient';
import { CoordinatorDashboardPage } from '@/pages/coordinator/CoordinatorDashboardPage';
import type { Client, ClientStatus } from '@/types/client';

// ── helpers ────────────────────────────────────────────────────────────────

const STATUS_MAP: Record<ClientStatus, { label: string; variant: 'success' | 'warning' | 'error' }> = {
  active: { label: 'Ativo', variant: 'success' },
  paused: { label: 'Pausado', variant: 'warning' },
  churned: { label: 'Churned', variant: 'error' },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

// ── sub-components ─────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  color,
  isLoading,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: 'blue' | 'green' | 'pink';
  isLoading?: boolean;
}) {
  const colorMap = {
    blue: 'bg-galaxy-blue/10 border-galaxy-blue/20 text-galaxy-blue-light',
    green: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    pink: 'bg-galaxy-pink/10 border-galaxy-pink/20 text-galaxy-pink-light',
  };

  return (
    <GlassCard variant="strong" padding="none">
      <div className="p-5 flex items-start gap-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${colorMap[color]}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs text-text-muted mb-1">{label}</p>
          {isLoading ? (
            <div className="h-7 w-16 rounded shimmer" />
          ) : (
            <p className="text-2xl font-bold text-text-primary">{value}</p>
          )}
        </div>
      </div>
    </GlassCard>
  );
}

function RecentClientRow({ client }: { client: Client }) {
  const navigate = useNavigate();
  const status = STATUS_MAP[client.status];

  return (
    <button
      onClick={() => navigate(`/clients/${client.id}`)}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-150 text-left hover:bg-white/[0.04] group"
    >
      {/* Avatar */}
      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 bg-gradient-to-br from-galaxy-blue/30 to-galaxy-purple/30 border border-galaxy-blue/30 text-galaxy-blue-light">
        {client.name.charAt(0).toUpperCase()}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary truncate group-hover:text-galaxy-blue-light transition-colors">
          {client.name}
        </p>
        {client.segment && (
          <p className="text-xs text-text-muted truncate">{client.segment}</p>
        )}
      </div>

      {/* Status */}
      <StatusBadge variant={status.variant} label={status.label} />
    </button>
  );
}

// ── page ───────────────────────────────────────────────────────────────────

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: clients, isLoading } = useClients();

  // Role-specific dashboards
  if (user?.role === 'coordenador') return <CoordinatorDashboardPage />;

  const totalClients = clients?.length ?? 0;
  const activeClients = clients?.filter((c) => c.status === 'active').length ?? 0;
  const recentClients = clients ? [...clients].slice(0, 5) : [];

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={stagger}
      className="space-y-6"
    >
      {/* Greeting */}
      <motion.div variants={fadeUp}>
        <h1 className="text-2xl font-bold text-text-primary">
          Olá,{' '}
          <span className="gradient-text">{user?.name?.split(' ')[0] ?? 'bem-vindo'}</span>
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Visão geral da agência · {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </motion.div>

      {/* Stats row */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={<Users size={18} />} label="Total de Clientes" value={totalClients} color="blue" isLoading={isLoading} />
        <StatCard icon={<CheckCircle size={18} />} label="Clientes Ativos" value={activeClients} color="green" isLoading={isLoading} />
        <StatCard icon={<CalendarCheck size={18} />} label="Check-ins Este Mês" value="—" color="pink" />
      </motion.div>

      {/* Recent clients */}
      <motion.div variants={fadeUp}>
        <GlassCard padding="none">
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-galaxy-blue-light" />
                <h2 className="text-sm font-semibold text-text-primary">Clientes recentes</h2>
              </div>
              <button
                onClick={() => navigate('/clients')}
                className="text-xs flex items-center gap-1 text-text-muted hover:text-galaxy-blue-light transition-colors"
              >
                Ver todos
                <ArrowRight size={12} />
              </button>
            </div>

            {isLoading && (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-9 h-9 rounded-xl shimmer shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3.5 rounded shimmer w-1/2" />
                      <div className="h-3 rounded shimmer w-1/3" />
                    </div>
                    <div className="h-5 w-14 rounded-full shimmer" />
                  </div>
                ))}
              </div>
            )}

            {!isLoading && recentClients.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Users size={28} className="mb-3 text-text-muted" />
                <p className="text-sm text-text-secondary">Nenhum cliente ainda</p>
                <div className="mt-4">
                  <GradientButton size="sm" onClick={() => navigate('/clients/new')}>
                    Cadastrar primeiro cliente
                  </GradientButton>
                </div>
              </div>
            )}

            {!isLoading && recentClients.length > 0 && (
              <div className="space-y-0.5">
                {recentClients.map((client) => (
                  <RecentClientRow key={client.id} client={client} />
                ))}
              </div>
            )}
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}
