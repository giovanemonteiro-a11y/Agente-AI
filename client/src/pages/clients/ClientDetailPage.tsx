import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  ExternalLink,
  User,
  Briefcase,
  AlertCircle,
} from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useClientById } from '@/hooks/useClient';
import { cn } from '@/lib/utils';
import type { ClientStatus, ServiceScope, DesignerScope } from '@/types/client';

// ── constants ──────────────────────────────────────────────────────────────

const SERVICE_LABELS: Record<ServiceScope, string> = {
  social_media: 'Social Media',
  trafego: 'Tráfego',
  site_lp: 'Site/LP',
  ecommerce: 'E-commerce',
  branding: 'Branding',
  miv: 'MIV',
};

const DESIGNER_LABELS: Record<DesignerScope, string> = {
  social_media: 'Social Media',
  campanha: 'Campanha',
  landing_page: 'Landing Page',
  site: 'Site',
  ecommerce: 'E-commerce',
  branding: 'Branding',
  miv: 'MIV',
};

const STATUS_MAP: Record<ClientStatus, { label: string; variant: 'success' | 'warning' | 'error' }> = {
  active: { label: 'Ativo', variant: 'success' },
  paused: { label: 'Pausado', variant: 'warning' },
  churned: { label: 'Churned', variant: 'error' },
};

const TABS = [
  { label: 'Overview', href: '' },
  { label: 'Reuniões', href: 'meetings' },
  { label: 'Estratégia', href: 'strategy' },
  { label: 'Sumário', href: 'summary' },
  { label: 'Cohorts', href: 'cohorts' },
  { label: 'Briefings', href: 'briefings' },
  { label: 'Relatórios', href: 'reports' },
  { label: 'BI', href: 'bi' },
];

// ── helpers ────────────────────────────────────────────────────────────────

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-text-muted">{icon}</div>
      <div>
        <p className="text-xs text-text-muted mb-0.5">{label}</p>
        <p className="text-sm font-medium text-text-primary">{value}</p>
      </div>
    </div>
  );
}

function ScopeChips({ items, labels }: { items: unknown; labels: Record<string, string> }) {
  const parsed: string[] = Array.isArray(items)
    ? items
    : typeof items === 'string' && items.length > 2
    ? items.replace(/^\{/, '').replace(/\}$/, '').split(',').filter(Boolean)
    : [];
  if (parsed.length === 0) return <p className="text-sm text-text-muted">—</p>;
  return (
    <div className="flex flex-wrap gap-2">
      {parsed.map((s: string) => (
        <span
          key={s}
          className="text-xs px-2.5 py-1 rounded-full bg-galaxy-blue/[0.12] text-galaxy-blue-light border border-galaxy-blue/20"
        >
          {labels[s] ?? s}
        </span>
      ))}
    </div>
  );
}

function SkeletonDetail() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl shimmer" />
        <div className="space-y-2">
          <div className="h-6 w-48 rounded shimmer" />
          <div className="h-4 w-24 rounded shimmer" />
        </div>
      </div>
      <div className="h-10 rounded-xl shimmer" />
      <GlassCard className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-4 rounded shimmer" />
        ))}
      </GlassCard>
    </div>
  );
}

// ── page ───────────────────────────────────────────────────────────────────

export function ClientDetailPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const { data: client, isLoading, isError, error } = useClientById(clientId);

  const pathSegments = location.pathname.split('/');
  const lastSegment = pathSegments[pathSegments.length - 1];
  const activeTab = TABS.find((t) => t.href === lastSegment && t.href !== '')?.href ?? '';

  if (isLoading) return <SkeletonDetail />;

  if (isError) {
    return (
      <div className="space-y-6">
        <GlassCard className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle size={36} className="mb-4 text-red-400" />
          <p className="font-semibold text-text-primary mb-1">Erro ao carregar cliente</p>
          <p className="text-sm text-text-secondary">
            {(error as Error)?.message ?? 'Cliente não encontrado.'}
          </p>
        </GlassCard>
      </div>
    );
  }

  if (!client) {
    return (
      <div>
        <GlassCard className="flex flex-col items-center justify-center py-16 text-center">
          <User size={36} className="mb-4 text-text-muted" />
          <p className="font-semibold text-text-primary">Cliente não encontrado</p>
        </GlassCard>
      </div>
    );
  }

  const status = STATUS_MAP[client.status];
  const startDateFormatted = client.start_date
    ? new Date(client.start_date).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-start gap-4">
        <button
          onClick={() => navigate('/clients')}
          className="flex items-center justify-center w-9 h-9 rounded-xl mt-1 shrink-0 bg-white/5 border border-white/10 text-text-secondary hover:bg-white/10 hover:text-text-primary transition-all duration-150"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold gradient-text truncate">{client.name}</h1>
            <StatusBadge variant={status.variant} label={status.label} />
          </div>
          {client.segment && (
            <p className="text-sm text-text-secondary mt-1">{client.segment}</p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-0.5 border-b border-white/[0.07]">
        {TABS.map((tab) => {
          const isActive = tab.href === activeTab;
          const to = tab.href === '' ? `/clients/${clientId}` : `/clients/${clientId}/${tab.href}`;
          return (
            <Link
              key={tab.href}
              to={to}
              className={cn(
                'px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all duration-150 whitespace-nowrap',
                isActive
                  ? 'text-galaxy-blue-light border-b-2 border-galaxy-blue-light -mb-px'
                  : 'text-text-muted hover:text-text-secondary'
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === '' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Contact & Info */}
          <GlassCard className="lg:col-span-2" padding="none">
            <div className="p-5">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-4">
                Informações de contato
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoRow icon={<User size={15} />} label="Responsável" value={client.contact_name} />
                <InfoRow icon={<Mail size={15} />} label="E-mail" value={client.contact_email} />
                <InfoRow icon={<Phone size={15} />} label="Telefone" value={client.contact_phone} />
                <InfoRow icon={<Calendar size={15} />} label="Data de início" value={startDateFormatted} />
              </div>

              {client.drive_folder_url && client.drive_folder_url !== '#' && (
                <div className="mt-5 pt-4 border-t border-glass-border">
                  <a
                    href={client.drive_folder_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-medium text-galaxy-blue-light hover:text-galaxy-blue transition-colors"
                  >
                    <ExternalLink size={14} />
                    Pasta no Google Drive
                  </a>
                </div>
              )}
            </div>
          </GlassCard>

          {/* Scopes */}
          <div className="space-y-4">
            <GlassCard padding="none">
              <div className="p-5">
                <p className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Briefcase size={12} />
                  Escopo de serviços
                </p>
                <ScopeChips items={client.services_scope} labels={SERVICE_LABELS} />
              </div>
            </GlassCard>

            <GlassCard padding="none">
              <div className="p-5">
                <p className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Briefcase size={12} />
                  Escopo do designer
                </p>
                <ScopeChips items={client.designer_scope} labels={DESIGNER_LABELS} />
              </div>
            </GlassCard>
          </div>
        </div>
      ) : (
        <GlassCard className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 bg-galaxy-blue/10 border border-galaxy-blue/20">
            <Briefcase size={20} className="text-galaxy-blue-light" />
          </div>
          <h2 className="text-base font-semibold text-text-primary mb-1">
            {TABS.find((t) => t.href === activeTab)?.label}
          </h2>
          <p className="text-sm text-text-secondary">Em desenvolvimento</p>
        </GlassCard>
      )}
    </motion.div>
  );
}
