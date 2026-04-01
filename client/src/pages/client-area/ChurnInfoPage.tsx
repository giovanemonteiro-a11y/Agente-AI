import { useParams, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle, Calendar, Clock, MessageSquare, User, Building2, TrendingDown } from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { useClientById } from '@/hooks/useClient';
import { cn } from '@/lib/utils';
import type { Client, ChurnSeverity } from '@/types/client';

const SEVERITY_CONFIG: Record<ChurnSeverity, { label: string; color: string; bg: string; border: string; description: string }> = {
  leve: { label: 'Leve', color: 'text-sky-400', bg: 'bg-sky-500/15', border: 'border-sky-500/30', description: 'O cliente saiu por motivos externos que não refletem insatisfação com o serviço.' },
  moderado: { label: 'Moderado', color: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/30', description: 'O cliente saiu por mudança de estratégia ou prioridades internas.' },
  severo: { label: 'Severo', color: 'text-orange-400', bg: 'bg-orange-500/15', border: 'border-orange-500/30', description: 'O cliente saiu insatisfeito com resultados ou atendimento.' },
  preocupante: { label: 'Preocupante', color: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/30', description: 'O cliente saiu com reclamações graves que podem afetar a reputação.' },
};

function computeLT(startDate: string | null): string {
  if (!startDate) return '—';
  const days = Math.floor((Date.now() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));
  if (days < 30) return `${days} dias`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} meses`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  return rem > 0 ? `${years}a ${rem}m` : `${years} anos`;
}

export function ChurnInfoPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const location = useLocation();
  const stateClient = (location.state as { client?: Client } | null)?.client;
  const { data: apiClient, isLoading } = useClientById(clientId);

  // Persist mock client in sessionStorage so it survives sidebar navigation
  if (stateClient && clientId) {
    try { sessionStorage.setItem(`mock-client-${clientId}`, JSON.stringify(stateClient)); } catch { /* ignore */ }
  }
  let cachedClient: Client | undefined;
  if (!apiClient && !stateClient && clientId) {
    try {
      const cached = sessionStorage.getItem(`mock-client-${clientId}`);
      if (cached) cachedClient = JSON.parse(cached);
    } catch { /* ignore */ }
  }

  const client = apiClient ?? stateClient ?? cachedClient;

  if (isLoading && !stateClient) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-6 w-48 rounded shimmer" />
        <div className="h-32 rounded-xl shimmer" />
      </div>
    );
  }

  if (!client) return null;

  const severity = client.churn_severity ?? 'leve';
  const sevConfig = SEVERITY_CONFIG[severity];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
          <AlertTriangle size={22} className="text-red-400" />
          Cliente Inativo
        </h1>
        <p className="text-sm text-text-secondary mt-0.5">Detalhes sobre o encerramento deste projeto</p>
      </div>

      {/* Severity Banner */}
      <div className={cn('rounded-2xl border-2 p-6', sevConfig.bg, sevConfig.border)}>
        <div className="flex items-start gap-4">
          <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0', sevConfig.bg)}>
            <TrendingDown size={24} className={sevConfig.color} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className={cn('text-lg font-bold', sevConfig.color)}>Gravidade: {sevConfig.label}</h2>
              <span className={cn('text-2xs px-2.5 py-1 rounded-full border font-bold uppercase tracking-wider', sevConfig.bg, sevConfig.color, sevConfig.border)}>
                {sevConfig.label}
              </span>
            </div>
            <p className="text-sm text-text-secondary">{sevConfig.description}</p>
          </div>
        </div>
      </div>

      {/* Reason */}
      <GlassCard padding="none">
        <div className="p-6">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-4 flex items-center gap-2">
            <MessageSquare size={14} /> Motivo da Inativação
          </h3>
          <div className="rounded-xl bg-white/[0.03] border border-glass-border p-5">
            <p className="text-sm text-text-primary leading-relaxed">
              {client.churn_reason ?? 'Nenhum motivo registrado para a inativação deste cliente.'}
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Timeline Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <InfoCard
          icon={<Calendar size={16} />}
          label="Início do Projeto"
          value={client.start_date ? new Date(client.start_date).toLocaleDateString('pt-BR') : '—'}
        />
        <InfoCard
          icon={<Calendar size={16} />}
          label="Data de Inativação"
          value={client.churned_at ? new Date(client.churned_at).toLocaleDateString('pt-BR') : '—'}
          color="text-red-400"
        />
        <InfoCard
          icon={<Clock size={16} />}
          label="Lifetime até Queda"
          value={client.lt_days ? `${client.lt_days} dias (${computeLT(client.start_date)})` : '—'}
        />
        <InfoCard
          icon={<User size={16} />}
          label="Stakeholder"
          value={client.stakeholder_name ?? client.contact_name ?? '—'}
        />
      </div>

      {/* Client Info Summary */}
      <GlassCard padding="none">
        <div className="p-6">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-4 flex items-center gap-2">
            <Building2 size={14} /> Dados do Cliente
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-2xs text-text-muted uppercase tracking-wider mb-1">Empresa</p>
              <p className="text-sm font-medium text-text-primary">{client.name}</p>
            </div>
            <div>
              <p className="text-2xs text-text-muted uppercase tracking-wider mb-1">Razão Social</p>
              <p className="text-sm font-medium text-text-primary">{client.razao_social ?? '—'}</p>
            </div>
            <div>
              <p className="text-2xs text-text-muted uppercase tracking-wider mb-1">Segmento</p>
              <p className="text-sm font-medium text-text-primary">{client.segment ?? '—'}</p>
            </div>
            <div>
              <p className="text-2xs text-text-muted uppercase tracking-wider mb-1">CNPJ</p>
              <p className="text-sm font-medium text-text-primary">{client.cnpj ?? '—'}</p>
            </div>
          </div>

          {/* Scope at time of churn */}
          {Array.isArray(client.services_scope) && client.services_scope.length > 0 && (
            <div className="mt-5 pt-4 border-t border-glass-border">
              <p className="text-2xs text-text-muted uppercase tracking-wider mb-2">Escopo Contratado</p>
              <div className="flex flex-wrap gap-1.5">
                {client.services_scope.map((s) => (
                  <span key={s} className="text-2xs px-2 py-0.5 rounded-full bg-white/5 text-text-muted border border-glass-border">
                    {s.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </GlassCard>
    </motion.div>
  );
}

function InfoCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color?: string }) {
  return (
    <GlassCard padding="sm">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-text-muted">{icon}</span>
        <span className="text-2xs text-text-muted uppercase tracking-wider font-medium">{label}</span>
      </div>
      <p className={cn('text-sm font-semibold', color ?? 'text-text-primary')}>{value}</p>
    </GlassCard>
  );
}
