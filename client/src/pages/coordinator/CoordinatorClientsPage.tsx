import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderOpen, Plus, Search, ChevronDown, ChevronUp, AlertTriangle,
  X, Check, CheckCircle2, Users2, Loader2, Link2, MessageSquare,
  Clock, Shield, TrendingUp, DollarSign, Target, Building2, User,
  FileText, Minus, Timer,
} from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { GradientButton } from '@/components/shared/GradientButton';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import type { Client, ChurnSeverity, ClientType } from '@/types/client';

// ─── Constants ──────────────────────────────────────────────────────────────

const SCOPE_OPTIONS = [
  'Social Media', 'Tráfego Pago', 'Site / Landing Page', 'E-commerce',
  'Branding', 'MIV', 'CRM', 'Email Marketing', 'SEO',
];

const SEVERITY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  leve: { label: 'Leve', color: 'text-yellow-400', bg: 'bg-yellow-500/15 border-yellow-500/30' },
  moderado: { label: 'Moderado', color: 'text-orange-400', bg: 'bg-orange-500/15 border-orange-500/30' },
  severo: { label: 'Severo', color: 'text-red-400', bg: 'bg-red-500/15 border-red-500/30' },
  preocupante: { label: 'Preocupante', color: 'text-red-600', bg: 'bg-red-700/20 border-red-700/30' },
};

const TRIOS_MOCK = [
  { id: 'trio-1', name: 'Trio 1', members: ['Jéssica', 'Giovane', 'Gabriel'] },
  { id: 'trio-2', name: 'Trio 2', members: ['Miriam', 'Melissa', 'Anderson'] },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatLT(days: number | null | undefined): string {
  if (!days) return '—';
  if (days < 30) return `${days} dias`;
  const months = Math.floor(days / 30);
  const rem = days % 30;
  return rem > 0 ? `${months}m ${rem}d` : `${months} meses`;
}

function daysRemaining(deadline: string | null | undefined): number {
  if (!deadline) return 0;
  const diff = new Date(deadline).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86400000));
}

function isNewClient(client: Client): boolean {
  if (client.is_new && client.new_until) {
    return new Date(client.new_until) > new Date();
  }
  return client.is_new ?? false;
}

function computeCurrentLT(client: Client): number {
  const base = client.lt_days ?? 0;
  if (!client.lt_start_date) return base;
  const start = new Date(client.lt_start_date);
  const elapsed = Math.floor((Date.now() - start.getTime()) / 86400000);
  return base + elapsed;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export function CoordinatorClientsPage() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showActive, setShowActive] = useState(true);
  const [showInactive, setShowInactive] = useState(true);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [churnTarget, setChurnTarget] = useState<Client | null>(null);

  // Filters
  const [filterType, setFilterType] = useState<ClientType | ''>('');
  const [filterSeverity, setFilterSeverity] = useState<ChurnSeverity | ''>('');

  // Fetch clients
  useEffect(() => {
    let cancelled = false;
    async function fetch() {
      try {
        const res = await api.get<{ data: Client[] }>('/coordinator/clients');
        if (!cancelled) setClients(res.data.data ?? []);
      } catch {
        // Keep empty
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetch();
    const interval = setInterval(fetch, 20000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  // Computed lists
  const activeClients = useMemo(() => {
    let list = clients.filter(c => c.status === 'active');
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(c => c.name.toLowerCase().includes(q) || c.niche?.toLowerCase().includes(q));
    }
    if (filterType) list = list.filter(c => c.client_type === filterType);
    return list;
  }, [clients, searchQuery, filterType]);

  const inactiveClients = useMemo(() => {
    let list = clients.filter(c => c.status === 'churned');
    if (filterSeverity) list = list.filter(c => c.churn_severity === filterSeverity);
    return list.sort((a, b) => new Date(b.churned_at ?? 0).getTime() - new Date(a.churned_at ?? 0).getTime());
  }, [clients, filterSeverity]);

  // Handlers
  async function handleSaveFromTratativa(clientId: string) {
    try {
      await api.patch(`/coordinator/clients/${clientId}/save`);
      setClients(prev => prev.map(c => c.id === clientId ? { ...c, in_tratativa: false, tratativa_reason: null, tratativa_deadline: null } : c));
    } catch { /* ignore */ }
  }

  function handleClientCreated(newClient: Client) {
    setClients(prev => [newClient, ...prev]);
    setShowCreateModal(false);
  }

  function handleChurnDone(updatedClient: Client) {
    setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
    setChurnTarget(null);
  }

  function handleTratativaStarted(updatedClient: Client) {
    setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
    setChurnTarget(null);
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-3">
            <FolderOpen className="text-galaxy-blue-light" size={24} />
            Meus Clientes
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            {activeClients.length} ativos · {inactiveClients.length} inativos
          </p>
        </div>
        <GradientButton leftIcon={<Plus size={16} />} onClick={() => setShowCreateModal(true)}>
          Cadastrar Cliente da Base
        </GradientButton>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Buscar por nome ou nicho..."
          className="w-full bg-white/[0.03] border border-glass-border rounded-xl pl-11 pr-4 py-3 text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-galaxy-blue/40 transition-all"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-galaxy-blue-light" />
        </div>
      ) : (
        <>
          {/* ─── Active Clients ─────────────────────────────────────────── */}
          <button
            onClick={() => setShowActive(!showActive)}
            className="flex items-center gap-2 mb-4 text-text-primary hover:text-galaxy-blue-light transition-colors"
          >
            {showActive ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            <h2 className="text-lg font-semibold">Clientes Ativos ({activeClients.length})</h2>
          </button>

          {showActive && (
            <>
              {/* Filters */}
              <div className="flex gap-2 mb-4 flex-wrap">
                {(['', 'recorrente', 'one_time'] as const).map(t => (
                  <button
                    key={t || 'all'}
                    onClick={() => setFilterType(t)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                      filterType === t
                        ? 'bg-galaxy-blue/15 text-galaxy-blue-light border-galaxy-blue/30'
                        : 'bg-white/[0.02] text-text-muted border-glass-border hover:text-text-secondary'
                    )}
                  >
                    {t === '' ? 'Todos' : t === 'recorrente' ? 'Recorrente' : 'One Time'}
                  </button>
                ))}
              </div>

              {activeClients.length === 0 ? (
                <GlassCard padding="lg" className="text-center mb-8">
                  <FolderOpen size={32} className="mx-auto text-text-muted mb-3 opacity-40" />
                  <p className="text-sm text-text-muted">Nenhum cliente ativo ainda</p>
                </GlassCard>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
                  <AnimatePresence>
                    {activeClients.map((client, i) => (
                      <motion.div
                        key={client.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                      >
                        <ClientCard
                          client={client}
                          onClick={() => navigate(`/clients/${client.id}/overview`)}
                          onChurn={() => setChurnTarget(client)}
                          onSave={() => handleSaveFromTratativa(client.id)}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </>
          )}

          {/* ─── Inactive Clients ────────────────────────────────────────── */}
          <button
            onClick={() => setShowInactive(!showInactive)}
            className="flex items-center gap-2 mb-4 text-text-primary hover:text-galaxy-blue-light transition-colors"
          >
            {showInactive ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            <h2 className="text-lg font-semibold">Clientes Inativos ({inactiveClients.length})</h2>
          </button>

          {showInactive && (
            <>
              {/* Severity filters */}
              <div className="flex gap-2 mb-4 flex-wrap">
                <button
                  onClick={() => setFilterSeverity('')}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                    !filterSeverity ? 'bg-galaxy-blue/15 text-galaxy-blue-light border-galaxy-blue/30' : 'bg-white/[0.02] text-text-muted border-glass-border'
                  )}
                >Todos</button>
                {Object.entries(SEVERITY_CONFIG).map(([key, cfg]) => (
                  <button
                    key={key}
                    onClick={() => setFilterSeverity(key as ChurnSeverity)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                      filterSeverity === key ? cfg.bg + ' ' + cfg.color : 'bg-white/[0.02] text-text-muted border-glass-border'
                    )}
                  >{cfg.label}</button>
                ))}
              </div>

              {inactiveClients.length === 0 ? (
                <GlassCard padding="lg" className="text-center">
                  <p className="text-sm text-text-muted">Nenhum cliente inativo</p>
                </GlassCard>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {inactiveClients.map((client, i) => (
                    <motion.div key={client.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                      <InactiveClientCard client={client} onClick={() => navigate(`/clients/${client.id}/churn-info`)} />
                    </motion.div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Modals via Portal */}
      {createPortal(
        <AnimatePresence>
          {showCreateModal && <CreateBaseClientModal onClose={() => setShowCreateModal(false)} onCreated={handleClientCreated} />}
        </AnimatePresence>,
        document.body
      )}
      {createPortal(
        <AnimatePresence>
          {churnTarget && (
            <ChurnModal
              client={churnTarget}
              onClose={() => setChurnTarget(null)}
              onChurn={handleChurnDone}
              onTratativa={handleTratativaStarted}
            />
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT CARD
// ═══════════════════════════════════════════════════════════════════════════════

function ClientCard({ client, onClick, onChurn, onSave }: {
  client: Client; onClick: () => void; onChurn: () => void; onSave: () => void;
}) {
  const lt = computeCurrentLT(client);
  const isNew = isNewClient(client);
  const inTratativa = client.in_tratativa;
  const tratativaDays = daysRemaining(client.tratativa_deadline);

  return (
    <GlassCard padding="md" className="relative overflow-hidden hover:border-glass-border-strong transition-all group">
      {/* New badge */}
      {isNew && (
        <div className="absolute top-0 right-0">
          <div className="bg-gradient-galaxy text-white text-2xs font-bold px-3 py-1 rounded-bl-xl">
            NOVO
          </div>
        </div>
      )}

      {/* Tratativa badge */}
      {inTratativa && (
        <div className="absolute top-0 left-0">
          <div className="bg-red-500/90 text-white text-2xs font-bold px-3 py-1 rounded-br-xl flex items-center gap-1">
            <AlertTriangle size={10} /> EM TRATATIVA
          </div>
        </div>
      )}

      <div className="cursor-pointer" onClick={onClick}>
        <h3 className="text-sm font-bold text-text-primary mt-1 mb-1 pr-16">{client.name}</h3>

        {client.niche && (
          <span className="text-2xs px-2 py-0.5 rounded-full bg-galaxy-purple/15 text-galaxy-purple border border-galaxy-purple/20 inline-block mb-2">
            {client.niche}
          </span>
        )}

        <div className="space-y-1 text-xs text-text-secondary">
          {client.stakeholder_name && (
            <div className="flex items-center gap-1.5">
              <User size={11} className="text-text-muted" />
              {client.stakeholder_name}
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Clock size={11} className="text-text-muted" />
            LT: {formatLT(lt)}
          </div>
          {(() => {
            const scope = Array.isArray(client.services_scope)
              ? client.services_scope
              : typeof client.services_scope === 'string'
              ? (client.services_scope as string).replace(/^\{/, '').replace(/\}$/, '').split(',').filter(Boolean)
              : [];
            return scope.length > 0 ? (
              <div className="flex flex-wrap gap-1 mt-1">
                {scope.slice(0, 3).map((s: string) => (
                  <span key={s} className="text-2xs px-1.5 py-0.5 rounded bg-galaxy-blue/10 text-galaxy-blue-light">
                    {s.replace(/_/g, ' ')}
                  </span>
                ))}
                {scope.length > 3 && <span className="text-2xs text-text-muted">+{scope.length - 3}</span>}
              </div>
            ) : null;
          })()}
        </div>
      </div>

      {/* Tratativa timer + actions */}
      {inTratativa && (
        <div className="mt-3 pt-3 border-t border-red-500/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xs text-red-400 flex items-center gap-1">
              <Timer size={10} /> {tratativaDays} dias restantes
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); onSave(); }}
              className="flex-1 text-2xs py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/25 transition-all font-medium"
            >
              ✓ Cliente Salvo
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onChurn(); }}
              className="flex-1 text-2xs py-1.5 rounded-lg bg-red-500/15 text-red-400 border border-red-500/20 hover:bg-red-500/25 transition-all font-medium"
            >
              Churn
            </button>
          </div>
        </div>
      )}

      {/* Churn button (non-tratativa) */}
      {!inTratativa && (
        <div className="mt-3 pt-3 border-t border-glass-border">
          <button
            onClick={(e) => { e.stopPropagation(); onChurn(); }}
            className="w-full text-2xs py-1.5 rounded-lg text-text-muted hover:text-red-400 hover:bg-red-500/10 border border-glass-border hover:border-red-500/20 transition-all"
          >
            Churn
          </button>
        </div>
      )}
    </GlassCard>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// INACTIVE CLIENT CARD
// ═══════════════════════════════════════════════════════════════════════════════

function InactiveClientCard({ client, onClick }: { client: Client; onClick: () => void }) {
  const severity = SEVERITY_CONFIG[client.churn_severity ?? 'leve'];

  return (
    <GlassCard padding="md" className="opacity-70 hover:opacity-90 cursor-pointer transition-all" onClick={onClick}>
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-sm font-bold text-text-primary">{client.name}</h3>
        <span className={cn('text-2xs px-2 py-0.5 rounded-full font-medium border', severity.bg, severity.color)}>
          {severity.label}
        </span>
      </div>
      {client.niche && <p className="text-2xs text-text-muted mb-1">{client.niche}</p>}
      {client.stakeholder_name && <p className="text-2xs text-text-muted">{client.stakeholder_name}</p>}
      {client.churn_reason && (
        <p className="text-2xs text-text-muted mt-2 line-clamp-2 italic">"{client.churn_reason}"</p>
      )}
    </GlassCard>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CHURN MODAL
// ═══════════════════════════════════════════════════════════════════════════════

function ChurnModal({ client, onClose, onChurn, onTratativa }: {
  client: Client; onClose: () => void;
  onChurn: (c: Client) => void; onTratativa: (c: Client) => void;
}) {
  const [severity, setSeverity] = useState<ChurnSeverity | ''>('');
  const [reason, setReason] = useState('');
  const [detail, setDetail] = useState('');
  const [isTratativa, setIsTratativa] = useState(false);
  const [tratativaDeadline, setTratativaDeadline] = useState('');
  const [sending, setSending] = useState(false);

  async function handleSubmit() {
    setSending(true);
    try {
      if (isTratativa) {
        const res = await api.patch<{ data: Client }>(`/coordinator/clients/${client.id}/tratativa`, {
          tratativa_reason: reason,
          tratativa_deadline: tratativaDeadline,
        });
        onTratativa(res.data.data);
      } else {
        const res = await api.patch<{ data: Client }>(`/coordinator/clients/${client.id}/churn`, {
          churn_reason: reason,
          churn_severity: severity,
          churn_detail: detail,
        });
        onChurn(res.data.data);
      }
    } catch { /* ignore */ }
    finally { setSending(false); }
  }

  const canSubmit = isTratativa
    ? reason.trim() && tratativaDeadline
    : reason.trim() && severity;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
        className="w-full max-w-md glass-card-strong rounded-3xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-glass-border">
          <h2 className="text-base font-bold text-text-primary">Registrar Churn — {client.name}</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-text-muted"><X size={16} /></button>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Severity */}
          {!isTratativa && (
            <div>
              <label className="text-xs font-semibold text-text-secondary uppercase mb-2 block">Gravidade *</label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.entries(SEVERITY_CONFIG) as [ChurnSeverity, typeof SEVERITY_CONFIG[string]][]).map(([key, cfg]) => (
                  <button
                    key={key}
                    onClick={() => setSeverity(key)}
                    className={cn(
                      'px-3 py-2.5 rounded-xl text-xs font-medium border transition-all text-left',
                      severity === key ? cfg.bg + ' ' + cfg.color : 'bg-white/[0.02] text-text-muted border-glass-border hover:border-glass-border-strong'
                    )}
                  >
                    {cfg.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="text-xs font-semibold text-text-secondary uppercase mb-1.5 block">
              {isTratativa ? 'Motivo da Tratativa *' : 'Motivo do Churn *'}
            </label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder={isTratativa ? 'Descreva o motivo da tratativa...' : 'Descreva o motivo do churn...'}
              className="w-full h-24 bg-white/[0.03] border border-glass-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted/50 resize-none focus:outline-none focus:border-galaxy-blue/40 transition-all"
            />
          </div>

          {/* Detail */}
          {!isTratativa && (
            <div>
              <label className="text-xs font-semibold text-text-secondary uppercase mb-1.5 block">Detalhes</label>
              <textarea
                value={detail}
                onChange={e => setDetail(e.target.value)}
                placeholder="Informações adicionais..."
                className="w-full h-16 bg-white/[0.03] border border-glass-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted/50 resize-none focus:outline-none focus:border-galaxy-blue/40 transition-all"
              />
            </div>
          )}

          {/* Tratativa toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => setIsTratativa(!isTratativa)}
              className={cn(
                'w-10 h-5 rounded-full transition-all relative',
                isTratativa ? 'bg-amber-500' : 'bg-white/10'
              )}
            >
              <div className={cn(
                'w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all',
                isTratativa ? 'left-5.5' : 'left-0.5'
              )} style={{ left: isTratativa ? '22px' : '2px' }} />
            </div>
            <span className="text-sm text-text-primary">Em tratativa?</span>
          </label>

          {/* Tratativa deadline */}
          {isTratativa && (
            <div>
              <label className="text-xs font-semibold text-text-secondary uppercase mb-1.5 block">Prazo da Tratativa *</label>
              <input
                type="date"
                value={tratativaDeadline}
                onChange={e => setTratativaDeadline(e.target.value)}
                className="w-full bg-white/[0.03] border border-glass-border rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-galaxy-blue/40 transition-all"
              />
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-glass-border">
          <GradientButton
            className="w-full"
            disabled={!canSubmit || sending}
            loading={sending}
            onClick={handleSubmit}
          >
            {isTratativa ? 'Iniciar Tratativa' : 'Confirmar Churn'}
          </GradientButton>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CREATE BASE CLIENT MODAL
// ═══════════════════════════════════════════════════════════════════════════════

function CreateBaseClientModal({ onClose, onCreated }: {
  onClose: () => void; onCreated: (c: Client) => void;
}) {
  const [sending, setSending] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [razaoSocial, setRazaoSocial] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [niche, setNiche] = useState('');
  const [stakeholders, setStakeholders] = useState(['']);
  const [ltDays, setLtDays] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [scope, setScope] = useState<string[]>([]);
  const [contractPeriod, setContractPeriod] = useState('');
  const [clientType, setClientType] = useState<'recorrente' | 'one_time'>('recorrente');
  const [contractUrl, setContractUrl] = useState('');
  const [driveConnected, setDriveConnected] = useState(false);
  const [driveUrl, setDriveUrl] = useState('');
  const [whatsappConnected, setWhatsappConnected] = useState(false);

  // Financial
  const [feeValue, setFeeValue] = useState('');
  const [mediaInvestment, setMediaInvestment] = useState('');
  const [expectedMargin, setExpectedMargin] = useState('');
  const [roiTarget, setRoiTarget] = useState('');
  const [roiAchieved, setRoiAchieved] = useState('');
  const [roiAchievedFlag, setRoiAchievedFlag] = useState(false);

  // Status
  const [clientGoals, setClientGoals] = useState('');
  const [stakeholderUpdated, setStakeholderUpdated] = useState(false);
  const [planningUpToDate, setPlanningUpToDate] = useState(true);
  const [feePaymentUpToDate, setFeePaymentUpToDate] = useState(true);
  const [churnProbability, setChurnProbability] = useState('baixa');
  const [decisionMaker, setDecisionMaker] = useState('');

  // Team
  const [trioId, setTrioId] = useState('');
  const [accountIncluded, setAccountIncluded] = useState(true);
  const [accountDedication, setAccountDedication] = useState(50);
  const [designerIncluded, setDesignerIncluded] = useState(true);
  const [designerDedication, setDesignerDedication] = useState(50);
  const [gtIncluded, setGtIncluded] = useState(false);
  const [gtDedication, setGtDedication] = useState(0);

  const inputCls = 'w-full bg-[#1a1a2e] border border-glass-border rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-galaxy-blue/40 transition-all [&>option]:bg-[#1a1a2e] [&>option]:text-white';
  const labelCls = 'text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5 block';

  async function handleSubmit() {
    if (!name.trim()) return;
    setSending(true);
    try {
      const res = await api.post<{ data: Client }>('/coordinator/clients', {
        name,
        razao_social: razaoSocial,
        cnpj,
        niche,
        stakeholders: stakeholders.filter(Boolean),
        lt_days: ltDays,
        start_date: startDate || undefined,
        services_scope: scope,
        contract_period: contractPeriod,
        client_type: clientType,
        contract_url: contractUrl,
        drive_folder_url: driveUrl || undefined,
        whatsapp_group_id: whatsappConnected ? `grupo-${Date.now()}` : undefined,
        fee_value: feeValue ? parseFloat(feeValue) : undefined,
        media_investment: mediaInvestment ? parseFloat(mediaInvestment) : undefined,
        expected_margin: expectedMargin ? parseFloat(expectedMargin) : undefined,
        roi_target: roiTarget ? parseFloat(roiTarget) : undefined,
        roi_achieved: roiAchieved ? parseFloat(roiAchieved) : undefined,
        roi_achieved_flag: roiAchievedFlag,
        client_goals: clientGoals ? [{ goal: clientGoals, achieved: false }] : [],
        stakeholder_updated: stakeholderUpdated,
        planning_up_to_date: planningUpToDate,
        fee_payment_up_to_date: feePaymentUpToDate,
        churn_probability: churnProbability,
        decision_maker: decisionMaker,
        trio_id: trioId || undefined,
        team_allocation: {
          account: { included: accountIncluded, dedication: accountDedication },
          designer: { included: designerIncluded, dedication: designerDedication },
          gestor_trafego: { included: gtIncluded, dedication: gtDedication },
        },
        source: 'base',
      });
      onCreated(res.data.data);
    } catch { /* ignore */ }
    finally { setSending(false); }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
        className="w-full max-w-3xl glass-card-strong rounded-3xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-glass-border flex-shrink-0">
          <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
            <Building2 size={18} className="text-galaxy-blue-light" />
            Cadastrar Cliente da Base
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-text-muted"><X size={16} /></button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">
          {/* Section 1: Empresa */}
          <section>
            <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
              <Building2 size={14} className="text-galaxy-blue-light" /> Dados da Empresa
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><label className={labelCls}>Nome da Marca *</label><input value={name} onChange={e => setName(e.target.value)} placeholder="Nome da empresa" className={inputCls} /></div>
              <div><label className={labelCls}>Razão Social</label><input value={razaoSocial} onChange={e => setRazaoSocial(e.target.value)} placeholder="Razão Social" className={inputCls} /></div>
              <div><label className={labelCls}>CNPJ</label><input value={cnpj} onChange={e => setCnpj(e.target.value)} placeholder="00.000.000/0000-00" className={inputCls} /></div>
              <div><label className={labelCls}>Nicho</label><input value={niche} onChange={e => setNiche(e.target.value)} placeholder="Ex: Tecnologia, Saúde, Moda" className={inputCls} /></div>
            </div>

            {/* Stakeholders */}
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1.5">
                <label className={labelCls}>Stakeholders</label>
                <button onClick={() => setStakeholders(s => [...s, ''])} className="text-2xs text-galaxy-blue-light hover:text-galaxy-blue flex items-center gap-1"><Plus size={12} /> Adicionar</button>
              </div>
              {stakeholders.map((s, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input value={s} onChange={e => { const n = [...stakeholders]; n[i] = e.target.value; setStakeholders(n); }} placeholder={`Stakeholder ${i+1}`} className={cn(inputCls, 'flex-1')} />
                  {stakeholders.length > 1 && <button onClick={() => setStakeholders(s => s.filter((_, j) => j !== i))} className="p-2 text-text-muted hover:text-red-400"><Minus size={14} /></button>}
                </div>
              ))}
            </div>
          </section>

          {/* Section 2: Projeto */}
          <section>
            <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
              <FileText size={14} className="text-galaxy-blue-light" /> Projeto
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><label className={labelCls}>LT (dias)</label><input type="number" value={ltDays} onChange={e => setLtDays(parseInt(e.target.value) || 0)} className={inputCls} /></div>
              <div><label className={labelCls}>Data Início</label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>Período Contratado</label><input value={contractPeriod} onChange={e => setContractPeriod(e.target.value)} placeholder="Ex: 12 meses" className={inputCls} /></div>
              <div><label className={labelCls}>Contrato (URL)</label><input value={contractUrl} onChange={e => setContractUrl(e.target.value)} placeholder="https://drive.google.com/..." className={inputCls} /></div>
            </div>

            <div className="mt-3">
              <label className={labelCls}>Tipo</label>
              <div className="flex gap-3">
                {(['recorrente', 'one_time'] as const).map(t => (
                  <button key={t} onClick={() => setClientType(t)} className={cn('px-4 py-2 rounded-xl text-xs font-medium border transition-all', clientType === t ? 'bg-galaxy-blue/15 text-galaxy-blue-light border-galaxy-blue/30' : 'bg-white/[0.02] text-text-muted border-glass-border')}>
                    {t === 'recorrente' ? 'Recorrente' : 'One Time'}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-3">
              <label className={labelCls}>Escopo Contratado</label>
              <div className="flex flex-wrap gap-2">
                {SCOPE_OPTIONS.map(s => (
                  <button key={s} onClick={() => setScope(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])} className={cn('px-3 py-1.5 rounded-xl text-xs font-medium border transition-all', scope.includes(s) ? 'bg-galaxy-blue/15 text-galaxy-blue-light border-galaxy-blue/30' : 'bg-white/[0.02] text-text-muted border-glass-border')}>
                    {scope.includes(s) && <Check size={10} className="inline mr-1" />}{s}
                  </button>
                ))}
              </div>
            </div>

            {/* Connections */}
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                {whatsappConnected ? (
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs"><CheckCircle2 size={14} /> WhatsApp conectado</div>
                ) : (
                  <button onClick={() => setWhatsappConnected(true)} className="w-full flex items-center gap-2 justify-center px-3 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs hover:bg-emerald-500/20 transition-all"><MessageSquare size={14} /> Conectar WhatsApp</button>
                )}
              </div>
              <div>
                {driveConnected ? (
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs"><CheckCircle2 size={14} /> Drive conectado</div>
                ) : (
                  <div className="flex gap-1">
                    <input value={driveUrl} onChange={e => setDriveUrl(e.target.value)} placeholder="URL da pasta" className={cn(inputCls, 'text-xs py-2')} />
                    <button onClick={() => driveUrl && setDriveConnected(true)} className="px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs hover:bg-amber-500/20 transition-all flex-shrink-0"><Link2 size={12} /></button>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Section 3: Financeiro */}
          <section>
            <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
              <DollarSign size={14} className="text-emerald-400" /> Informações Financeiras
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div><label className={labelCls}>Valor do Fee (R$)</label><input value={feeValue} onChange={e => setFeeValue(e.target.value)} placeholder="0.00" className={inputCls} /></div>
              <div><label className={labelCls}>Investimento Mídia (R$)</label><input value={mediaInvestment} onChange={e => setMediaInvestment(e.target.value)} placeholder="0.00" className={inputCls} /></div>
              <div><label className={labelCls}>Margem Esperada (%)</label><input value={expectedMargin} onChange={e => setExpectedMargin(e.target.value)} placeholder="0" className={inputCls} /></div>
              <div><label className={labelCls}>ROI Target</label><input value={roiTarget} onChange={e => setRoiTarget(e.target.value)} placeholder="0.00" className={inputCls} /></div>
              <div><label className={labelCls}>ROI Atingido</label><input value={roiAchieved} onChange={e => setRoiAchieved(e.target.value)} placeholder="0.00" className={inputCls} /></div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={roiAchievedFlag} onChange={e => setRoiAchievedFlag(e.target.checked)} className="accent-galaxy-blue" />
                  <span className="text-xs text-text-secondary">ROI atingido?</span>
                </label>
              </div>
            </div>
          </section>

          {/* Section 4: Status */}
          <section>
            <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
              <Target size={14} className="text-amber-400" /> Status do Projeto
            </h3>
            <div><label className={labelCls}>Metas do Cliente</label><textarea value={clientGoals} onChange={e => setClientGoals(e.target.value)} placeholder="Descreva as metas do cliente..." className={cn(inputCls, 'h-16 resize-none')} /></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={stakeholderUpdated} onChange={e => setStakeholderUpdated(e.target.checked)} className="accent-galaxy-blue" /><span className="text-xs text-text-secondary">Stakeholders atualizados</span></label>
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={planningUpToDate} onChange={e => setPlanningUpToDate(e.target.checked)} className="accent-galaxy-blue" /><span className="text-xs text-text-secondary">Planejamento em dia</span></label>
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={feePaymentUpToDate} onChange={e => setFeePaymentUpToDate(e.target.checked)} className="accent-galaxy-blue" /><span className="text-xs text-text-secondary">Fee em dia</span></label>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div><label className={labelCls}>Quem Decide</label><input value={decisionMaker} onChange={e => setDecisionMaker(e.target.value)} placeholder="Nome do decisor" className={inputCls} /></div>
              <div>
                <label className={labelCls}>Probabilidade de Churn</label>
                <select value={churnProbability} onChange={e => setChurnProbability(e.target.value)} className={inputCls}>
                  <option value="baixa">Baixa</option>
                  <option value="media">Média</option>
                  <option value="alta">Alta</option>
                  <option value="critica">Crítica</option>
                </select>
              </div>
            </div>
          </section>

          {/* Section 5: Equipe */}
          <section>
            <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
              <Users2 size={14} className="text-galaxy-purple" /> Equipe
            </h3>
            <div className="mb-3">
              <label className={labelCls}>Trio Responsável</label>
              <div className="flex gap-2">
                {TRIOS_MOCK.map(t => (
                  <button key={t.id} onClick={() => setTrioId(t.id)} className={cn('flex-1 px-3 py-2.5 rounded-xl text-xs font-medium border transition-all text-left', trioId === t.id ? 'bg-galaxy-blue/15 text-galaxy-blue-light border-galaxy-blue/30' : 'bg-white/[0.02] text-text-muted border-glass-border')}>
                    <span className="font-semibold">{t.name}</span>
                    <p className="text-2xs text-text-muted mt-0.5">{t.members.join(', ')}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Allocations */}
            {[
              { label: 'Account', included: accountIncluded, setIncl: setAccountIncluded, ded: accountDedication, setDed: setAccountDedication },
              { label: 'Designer', included: designerIncluded, setIncl: setDesignerIncluded, ded: designerDedication, setDed: setDesignerDedication },
              { label: 'Gestor de Tráfego', included: gtIncluded, setIncl: setGtIncluded, ded: gtDedication, setDed: setGtDedication },
            ].map(a => (
              <div key={a.label} className="flex items-center gap-4 mb-2">
                <label className="flex items-center gap-2 w-40 cursor-pointer">
                  <input type="checkbox" checked={a.included} onChange={e => a.setIncl(e.target.checked)} className="accent-galaxy-blue" />
                  <span className="text-xs text-text-secondary">{a.label}</span>
                </label>
                <input
                  type="range" min={0} max={100} value={a.ded}
                  onChange={e => a.setDed(parseInt(e.target.value))}
                  disabled={!a.included}
                  className="flex-1 accent-galaxy-blue"
                />
                <span className="text-xs text-text-muted w-10 text-right">{a.ded}%</span>
              </div>
            ))}
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-glass-border flex-shrink-0">
          <GradientButton className="w-full" disabled={!name.trim() || sending} loading={sending} onClick={handleSubmit} leftIcon={<Plus size={14} />}>
            Cadastrar Cliente
          </GradientButton>
        </div>
      </motion.div>
    </motion.div>
  );
}
