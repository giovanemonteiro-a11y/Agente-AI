import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users, WifiOff, Clock, Briefcase, Search, Filter, ChevronDown,
  ArrowUpDown, AlertTriangle, Sparkles, Calendar, Building2, User,
} from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { useClients } from '@/hooks/useClient';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import type { Client, ClientStatus, ServiceScope, ChurnSeverity } from '@/types/client';

// ── Helpers ─────────────────────────────────────────────────────────────────

const SERVICE_LABELS: Record<ServiceScope, string> = {
  social_media: 'Social Media',
  trafego: 'Tráfego',
  site_lp: 'Site/LP',
  ecommerce: 'E-commerce',
  branding: 'Branding',
  miv: 'MIV',
};

const SEVERITY_CONFIG: Record<ChurnSeverity, { label: string; color: string; bg: string; border: string }> = {
  leve: { label: 'Leve', color: 'text-sky-400', bg: 'bg-sky-500/15', border: 'border-sky-500/25' },
  moderado: { label: 'Moderado', color: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/25' },
  severo: { label: 'Severo', color: 'text-orange-400', bg: 'bg-orange-500/15', border: 'border-orange-500/25' },
  preocupante: { label: 'Preocupante', color: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/25' },
};

function computeLT(startDate: string | null): number | null {
  if (!startDate) return null;
  const start = new Date(startDate).getTime();
  const now = Date.now();
  return Math.floor((now - start) / (1000 * 60 * 60 * 24));
}

function formatLT(days: number | null): string {
  if (days === null) return '—';
  if (days < 30) return `${days}d`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}m`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  return rem > 0 ? `${years}a ${rem}m` : `${years}a`;
}

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.04 } } };
const fadeUp = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.25 } } };

// ── Filter types ────────────────────────────────────────────────────────────

type ActiveSort = 'name' | 'start_date';
type InactiveSort = 'newest' | 'oldest';
type ActiveTab = 'active' | 'inactive';

// ── Page Component ──────────────────────────────────────────────────────────

export function ClientsListPage() {
  const navigate = useNavigate();
  const { data: rawClients, isLoading, isError, error } = useClients();
  const { user, isLideranca, isSuperAdmin } = useAuth();

  const hideNewButton = isLideranca;

  // Enrich clients with computed LT
  // - "NOVO" ribbon = within 15 days of creation
  // - LT computed from start_date (or lt_days if coordenador pre-filled for base clients)
  const clients = useMemo(() => {
    if (!rawClients) return [];
    const enriched: Client[] = rawClients.map((c) => ({
      ...c,
      lt_days: c.lt_days ?? computeLT(c.start_date),
      is_new: c.is_new ?? (c.created_at && (Date.now() - new Date(c.created_at).getTime()) < 15 * 24 * 60 * 60 * 1000),
    }));

    // Inject mock inactive client for demonstration
    const hasInactive = enriched.some((c) => c.status === 'churned');
    if (!hasInactive) {
      enriched.push({
        id: 'mock-inactive-1',
        name: 'Padaria Pão Dourado',
        segment: 'Alimentação',
        services_scope: ['social_media', 'trafego'],
        designer_scope: [],
        contact_name: 'Maria Santos',
        contact_email: 'maria@paodourado.com',
        contact_phone: null,
        start_date: '2025-06-15',
        status: 'churned',
        drive_folder_id: null,
        drive_folder_url: null,
        whatsapp_group_id: null,
        sheets_sprint_url: null,
        monday_board_id: null,
        created_at: '2025-06-15T00:00:00Z',
        stakeholder_name: 'Maria Santos',
        razao_social: 'Padaria Pão Dourado LTDA',
        cnpj: '33.444.555/0001-66',
        is_new: false,
        lt_days: 195,
        churned_at: '2025-12-28',
        churn_reason: 'Cliente optou por internalizar o marketing após 6 meses. Resultados estavam positivos mas budget foi redirecionado para expansão física.',
        churn_severity: 'leve',
      } as Client);
      enriched.push({
        id: 'mock-inactive-2',
        name: 'TechBR Solutions',
        segment: 'Tecnologia',
        services_scope: ['trafego', 'site_lp'],
        designer_scope: [],
        contact_name: 'Ricardo Mendes',
        contact_email: 'ricardo@techbr.com',
        contact_phone: null,
        start_date: '2025-03-01',
        status: 'churned',
        drive_folder_id: null,
        drive_folder_url: null,
        whatsapp_group_id: null,
        sheets_sprint_url: null,
        monday_board_id: null,
        created_at: '2025-03-01T00:00:00Z',
        stakeholder_name: 'Ricardo Mendes',
        razao_social: 'TechBR Solutions S.A.',
        cnpj: '77.888.999/0001-11',
        is_new: false,
        lt_days: 120,
        churned_at: '2025-07-01',
        churn_reason: 'Insatisfação com resultados de tráfego. ROAS não atingiu a meta de 3x após 4 meses. Cliente migrou para concorrente.',
        churn_severity: 'severo',
      } as Client);
      enriched.push({
        id: 'mock-inactive-3',
        name: 'Bella Moda Fitness',
        segment: 'Moda',
        services_scope: ['social_media', 'branding'],
        designer_scope: [],
        contact_name: 'Juliana Alves',
        contact_email: 'juliana@bellamoda.com',
        contact_phone: null,
        start_date: '2025-09-10',
        status: 'churned',
        drive_folder_id: null,
        drive_folder_url: null,
        whatsapp_group_id: null,
        sheets_sprint_url: null,
        monday_board_id: null,
        created_at: '2025-09-10T00:00:00Z',
        stakeholder_name: 'Juliana Alves',
        razao_social: 'Bella Moda Fitness Eireli',
        cnpj: '22.111.333/0001-55',
        is_new: false,
        lt_days: 90,
        churned_at: '2025-12-10',
        churn_reason: 'Empresa fechou operação física e migrou 100% para marketplace. Não necessita mais de marketing direto.',
        churn_severity: 'moderado',
      } as Client);
    }
    return enriched;
  }, [rawClients]);

  // Tab state
  const [tab, setTab] = useState<ActiveTab>('active');

  // Active filters
  const [searchActive, setSearchActive] = useState('');
  const [filterSector, setFilterSector] = useState('');
  const [filterService, setFilterService] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [activeSort, setActiveSort] = useState<ActiveSort>('name');

  // Inactive filters
  const [searchInactive, setSearchInactive] = useState('');
  const [inactiveSort, setInactiveSort] = useState<InactiveSort>('newest');
  const [filterSeverity, setFilterSeverity] = useState<ChurnSeverity | ''>('');

  // Split clients
  const activeClients = clients.filter((c) => c.status === 'active' || c.status === 'paused');
  const inactiveClients = clients.filter((c) => c.status === 'churned');

  // Unique sectors and services for filter dropdowns
  const sectors = useMemo(() => {
    const set = new Set(activeClients.map((c) => c.segment).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [activeClients]);

  const services = useMemo(() => {
    const set = new Set(activeClients.flatMap((c) => c.services_scope ?? []));
    return Array.from(set).sort();
  }, [activeClients]);

  // Filter active clients
  const filteredActive = useMemo(() => {
    let list = activeClients;
    if (searchActive) {
      const q = searchActive.toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(q) || c.contact_name?.toLowerCase().includes(q));
    }
    if (filterSector) list = list.filter((c) => c.segment === filterSector);
    if (filterService) list = list.filter((c) => c.services_scope?.includes(filterService as ServiceScope));
    if (filterStartDate) list = list.filter((c) => c.start_date && c.start_date >= filterStartDate);
    list.sort((a, b) => {
      if (activeSort === 'name') return a.name.localeCompare(b.name);
      return (a.start_date ?? '').localeCompare(b.start_date ?? '');
    });
    return list;
  }, [activeClients, searchActive, filterSector, filterService, filterStartDate, activeSort]);

  // Filter inactive clients
  const filteredInactive = useMemo(() => {
    let list = inactiveClients;
    if (searchInactive) {
      const q = searchInactive.toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(q));
    }
    if (filterSeverity) list = list.filter((c) => c.churn_severity === filterSeverity);
    list.sort((a, b) => {
      const dateA = a.churned_at ?? a.created_at;
      const dateB = b.churned_at ?? b.created_at;
      return inactiveSort === 'newest' ? dateB.localeCompare(dateA) : dateA.localeCompare(dateB);
    });
    return list;
  }, [inactiveClients, searchInactive, inactiveSort, filterSeverity]);

  const activeCount = activeClients.length;
  const inactiveCount = inactiveClients.length;

  return (
    <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-6">
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-3">
            <Briefcase size={24} className="text-galaxy-blue-light" />
            Clientes
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            {isLoading ? 'Carregando...' : `${activeCount} ativo${activeCount !== 1 ? 's' : ''} · ${inactiveCount} inativo${inactiveCount !== 1 ? 's' : ''}`}
          </p>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={fadeUp} className="flex gap-1 p-1 rounded-xl bg-white/5 border border-glass-border w-fit">
        <button
          onClick={() => setTab('active')}
          className={cn('px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2',
            tab === 'active' ? 'bg-galaxy-blue/15 text-galaxy-blue-light' : 'text-text-muted hover:text-text-primary'
          )}
        >
          Ativos
          <span className={cn('text-2xs px-1.5 py-0.5 rounded-full', tab === 'active' ? 'bg-galaxy-blue/20 text-galaxy-blue-light' : 'bg-white/5 text-text-muted')}>{activeCount}</span>
        </button>
        <button
          onClick={() => setTab('inactive')}
          className={cn('px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2',
            tab === 'inactive' ? 'bg-red-500/15 text-red-400' : 'text-text-muted hover:text-text-primary'
          )}
        >
          Inativos
          <span className={cn('text-2xs px-1.5 py-0.5 rounded-full', tab === 'inactive' ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-text-muted')}>{inactiveCount}</span>
        </button>
      </motion.div>

      {/* Error */}
      {isError && (
        <motion.div variants={fadeUp}>
          <GlassCard className="flex flex-col items-center justify-center py-16 text-center">
            <WifiOff size={36} className="mb-4 text-red-400" />
            <p className="font-semibold text-text-primary">Erro ao carregar clientes</p>
            <p className="text-sm text-text-secondary mt-1">{(error as Error)?.message ?? 'Verifique sua conexão.'}</p>
          </GlassCard>
        </motion.div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <GlassCard key={i} padding="sm" className="space-y-3">
              <div className="shimmer h-5 rounded w-2/3" />
              <div className="shimmer h-4 rounded w-1/3" />
              <div className="flex gap-2 pt-1"><div className="shimmer h-6 rounded-full w-20" /><div className="shimmer h-6 rounded-full w-20" /></div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Active Tab */}
      {!isLoading && !isError && tab === 'active' && (
        <>
          {/* Filters */}
          <motion.div variants={fadeUp} className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Buscar cliente..."
                value={searchActive}
                onChange={(e) => setSearchActive(e.target.value)}
                className="w-full h-10 pl-9 pr-3 rounded-xl bg-bg-dark/80 backdrop-blur-sm border border-glass-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-galaxy-blue/50 focus:ring-1 focus:ring-galaxy-blue/20 transition-all hover:border-glass-border-strong"
              />
            </div>
            <FilterSelect icon={<Calendar size={12} />} label="Data início" value={filterStartDate} onChange={setFilterStartDate}>
              <option value="">Todas as datas</option>
              <option value="2026-01-01">A partir de Jan/2026</option>
              <option value="2025-07-01">A partir de Jul/2025</option>
              <option value="2025-01-01">A partir de Jan/2025</option>
            </FilterSelect>
            <FilterSelect icon={<Building2 size={12} />} label="Setor" value={filterSector} onChange={setFilterSector}>
              <option value="">Todos os setores</option>
              {sectors.map((s) => <option key={s} value={s}>{s}</option>)}
            </FilterSelect>
            <FilterSelect icon={<Filter size={12} />} label="Serviço" value={filterService} onChange={setFilterService}>
              <option value="">Todos os serviços</option>
              {services.map((s) => <option key={s} value={s}>{SERVICE_LABELS[s] ?? s}</option>)}
            </FilterSelect>
          </motion.div>

          {/* Grid */}
          {filteredActive.length === 0 ? (
            <motion.div variants={fadeUp}>
              <GlassCard className="flex flex-col items-center justify-center py-20 text-center">
                <Users size={28} className="text-text-muted mb-3" />
                <p className="text-sm text-text-muted">Nenhum cliente ativo encontrado</p>
              </GlassCard>
            </motion.div>
          ) : (
            <motion.div variants={stagger} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredActive.map((client) => (
                <motion.div key={client.id} variants={fadeUp}>
                  <ActiveClientCard client={client} onClick={() => navigate(`/clients/${client.id}`)} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </>
      )}

      {/* Inactive Tab */}
      {!isLoading && !isError && tab === 'inactive' && (
        <>
          {/* Filters */}
          <motion.div variants={fadeUp} className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Buscar cliente inativo..."
                value={searchInactive}
                onChange={(e) => setSearchInactive(e.target.value)}
                className="w-full h-10 pl-9 pr-3 rounded-xl bg-bg-dark/80 backdrop-blur-sm border border-glass-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-galaxy-blue/50 focus:ring-1 focus:ring-galaxy-blue/20 transition-all hover:border-glass-border-strong"
              />
            </div>
            <FilterSelect icon={<ArrowUpDown size={12} />} label="Ordenar" value={inactiveSort} onChange={(v) => setInactiveSort(v as InactiveSort)}>
              <option value="newest">Mais recente primeiro</option>
              <option value="oldest">Mais antigo primeiro</option>
            </FilterSelect>
            <FilterSelect icon={<AlertTriangle size={12} />} label="Gravidade" value={filterSeverity} onChange={(v) => setFilterSeverity(v as ChurnSeverity | '')}>
              <option value="">Todas</option>
              <option value="leve">Leve</option>
              <option value="moderado">Moderado</option>
              <option value="severo">Severo</option>
              <option value="preocupante">Preocupante</option>
            </FilterSelect>
          </motion.div>

          {filteredInactive.length === 0 ? (
            <motion.div variants={fadeUp}>
              <GlassCard className="flex flex-col items-center justify-center py-20 text-center">
                <Users size={28} className="text-text-muted mb-3" />
                <p className="text-sm text-text-muted">Nenhum cliente inativo</p>
              </GlassCard>
            </motion.div>
          ) : (
            <motion.div variants={stagger} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredInactive.map((client) => (
                <motion.div key={client.id} variants={fadeUp}>
                  <InactiveClientCard client={client} onClick={() => navigate(`/clients/${client.id}/churn-info`, { state: { client } })} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </>
      )}
    </motion.div>
  );
}

// ── Active Client Card ──────────────────────────────────────────────────────

function ActiveClientCard({ client, onClick }: { client: Client; onClick: () => void }) {
  const lt = client.lt_days ?? computeLT(client.start_date);
  const isNew = client.is_new;

  return (
    <GlassCard
      padding="none"
      className="cursor-pointer transition-all duration-200 hover:bg-bg-card-hover hover:border-glass-border-strong hover:-translate-y-0.5 hover:shadow-card-hover group relative overflow-hidden"
    >
      {/* New ribbon */}
      {isNew && (
        <div className="absolute top-0 right-0 z-10">
          <div className="bg-gradient-galaxy text-white text-2xs font-bold px-3 py-0.5 rounded-bl-lg flex items-center gap-1">
            <Sparkles size={10} />
            NOVO
          </div>
        </div>
      )}

      <div role="button" tabIndex={0} onClick={onClick} onKeyDown={(e) => e.key === 'Enter' && onClick()} className="p-5">
        {/* Name + Status */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <h3 className="font-semibold text-base text-text-primary truncate group-hover:text-galaxy-blue-light transition-colors">
            {client.name}
          </h3>
          <span className="text-2xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 font-medium flex-shrink-0">
            {client.status === 'paused' ? 'Pausado' : 'Ativo'}
          </span>
        </div>

        {/* Scope chips */}
        {Array.isArray(client.services_scope) && client.services_scope.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {client.services_scope.map((s) => (
              <span key={s} className="text-2xs px-2 py-0.5 rounded-full bg-galaxy-blue/[0.12] text-galaxy-blue-light border border-galaxy-blue/20">
                {SERVICE_LABELS[s]}
              </span>
            ))}
          </div>
        )}

        {/* Info grid */}
        <div className="space-y-1.5">
          {(client.stakeholder_name || client.contact_name) && (
            <div className="flex items-center gap-1.5 text-xs text-text-secondary">
              <User size={11} className="text-text-muted flex-shrink-0" />
              <span className="truncate">{client.stakeholder_name ?? client.contact_name}</span>
            </div>
          )}
          {client.segment && (
            <div className="flex items-center gap-1.5 text-xs text-text-secondary">
              <Building2 size={11} className="text-text-muted flex-shrink-0" />
              <span className="truncate">{client.segment}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            {client.start_date && (
              <div className="flex items-center gap-1.5 text-xs text-text-muted">
                <Calendar size={11} />
                <span>{new Date(client.start_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-xs font-medium text-galaxy-blue-light">
              <Clock size={11} />
              <span>LT: {formatLT(lt)}</span>
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

// ── Inactive Client Card ────────────────────────────────────────────────────

function InactiveClientCard({ client, onClick }: { client: Client; onClick: () => void }) {
  const severity = client.churn_severity ?? 'leve';
  const sevConfig = SEVERITY_CONFIG[severity];
  const ltAtChurn = client.lt_days ?? computeLT(client.start_date);

  return (
    <GlassCard
      padding="none"
      className="cursor-pointer transition-all duration-200 hover:bg-bg-card-hover hover:border-glass-border-strong group relative overflow-hidden opacity-85 hover:opacity-100"
    >
      {/* Severity stripe */}
      <div className={cn('absolute top-0 left-0 w-1 h-full', sevConfig.bg.replace('/15', '/40'))} />

      <div role="button" tabIndex={0} onClick={onClick} onKeyDown={(e) => e.key === 'Enter' && onClick()} className="p-5 pl-4">
        {/* Name + Severity badge */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-sm text-text-primary truncate group-hover:text-text-secondary transition-colors">
            {client.name}
          </h3>
          <span className={cn('text-2xs px-2 py-0.5 rounded-full border font-medium flex-shrink-0', sevConfig.bg, sevConfig.color, sevConfig.border)}>
            {sevConfig.label}
          </span>
        </div>

        {/* Scope */}
        {Array.isArray(client.services_scope) && client.services_scope.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {client.services_scope.map((s) => (
              <span key={s} className="text-2xs px-1.5 py-0.5 rounded-full bg-white/5 text-text-muted border border-glass-border">
                {SERVICE_LABELS[s]}
              </span>
            ))}
          </div>
        )}

        {/* Stakeholder */}
        {(client.stakeholder_name || client.contact_name) && (
          <div className="flex items-center gap-1.5 text-xs text-text-muted mb-2">
            <User size={11} />
            <span className="truncate">{client.stakeholder_name ?? client.contact_name}</span>
          </div>
        )}

        {/* Reason */}
        {client.churn_reason && (
          <p className="text-xs text-text-muted leading-relaxed mb-2 line-clamp-3 bg-white/[0.02] rounded-lg px-2.5 py-2 border border-glass-border">
            {client.churn_reason}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5 text-xs text-text-muted">
            <Clock size={11} />
            <span>LT: {formatLT(ltAtChurn)}</span>
          </div>
          {client.churned_at && (
            <div className="text-2xs text-text-muted">
              Inativo em {new Date(client.churned_at).toLocaleDateString('pt-BR')}
            </div>
          )}
        </div>
      </div>
    </GlassCard>
  );
}

// ── Filter Select Component ─────────────────────────────────────────────────

function FilterSelect({
  icon, label, value, onChange, children,
}: {
  icon: React.ReactNode; label: string; value: string;
  onChange: (v: string) => void; children: React.ReactNode;
}) {
  return (
    <div className="relative group">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none z-10">{icon}</div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'appearance-none h-10 pl-9 pr-9 rounded-xl border text-sm font-medium transition-all cursor-pointer',
          'bg-bg-dark/80 backdrop-blur-sm',
          'border-glass-border hover:border-glass-border-strong',
          'text-text-primary',
          'focus:outline-none focus:border-galaxy-blue/50 focus:ring-1 focus:ring-galaxy-blue/20',
          '[&>option]:bg-bg-deep [&>option]:text-text-primary [&>option]:py-2',
          value ? 'border-galaxy-blue/30 text-galaxy-blue-light' : ''
        )}
        aria-label={label}
      >
        {children}
      </select>
      <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none group-hover:text-text-secondary transition-colors" />
    </div>
  );
}
