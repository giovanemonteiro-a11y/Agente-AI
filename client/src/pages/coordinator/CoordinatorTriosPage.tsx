import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, ArrowLeftRight, X, ChevronRight, User, Clock,
  CheckCircle2, FolderOpen, Loader2,
} from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { GradientButton } from '@/components/shared/GradientButton';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import type { Client } from '@/types/client';

interface Trio {
  id: string;
  name: string;
  account_user_id: string | null;
  designer_user_id: string | null;
  gt_user_id: string | null;
  tech_user_id: string | null;
}

interface TrioDisplay {
  trio: Trio;
  members: { name: string; role: string; color: string }[];
  clients: Client[];
}

const ROLE_COLORS: Record<string, string> = {
  account: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  designer: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  gestor_trafego: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  tech_crm: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
};

// Mock member names (would come from API in production)
const MEMBER_NAMES: Record<string, { name: string; role: string }> = {};

function formatLT(days: number | null | undefined): string {
  if (!days) return '—';
  if (days < 30) return `${days}d`;
  return `${Math.floor(days / 30)}m ${days % 30}d`;
}

export function CoordinatorTriosPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [trios, setTrios] = useState<Trio[]>([]);
  const [loading, setLoading] = useState(true);
  const [transferClient, setTransferClient] = useState<Client | null>(null);
  const [transferTargetTrio, setTransferTargetTrio] = useState<string | null>(null);
  const [transferring, setTransferring] = useState(false);

  useEffect(() => {
    async function fetch() {
      try {
        const [clientsRes, triosRes] = await Promise.all([
          api.get<{ data: Client[] }>('/coordinator/clients'),
          api.get<{ data: Trio[] }>('/trios').catch(() => ({ data: { data: [] } })),
        ]);
        setClients(clientsRes.data.data ?? []);
        setTrios(triosRes.data.data ?? []);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    }
    fetch();
  }, []);

  // Group clients by trio
  const trioDisplays: TrioDisplay[] = trios.map(trio => ({
    trio,
    members: [
      trio.account_user_id ? { name: 'Account', role: 'account', color: ROLE_COLORS.account } : null,
      trio.designer_user_id ? { name: 'Designer', role: 'designer', color: ROLE_COLORS.designer } : null,
      trio.gt_user_id ? { name: 'Gestor de Tráfego', role: 'gestor_trafego', color: ROLE_COLORS.gestor_trafego } : null,
      trio.tech_user_id ? { name: 'Tech CRM', role: 'tech_crm', color: ROLE_COLORS.tech_crm } : null,
    ].filter(Boolean) as TrioDisplay['members'],
    clients: clients.filter(c => c.trio_id === trio.id && c.status === 'active'),
  }));

  const unassignedClients = clients.filter(c => !c.trio_id && c.status === 'active');

  async function handleTransfer() {
    if (!transferClient || !transferTargetTrio) return;
    setTransferring(true);
    try {
      await api.patch(`/coordinator/clients/${transferClient.id}`, { trio_id: transferTargetTrio });
      setClients(prev => prev.map(c =>
        c.id === transferClient.id ? { ...c, trio_id: transferTargetTrio } : c
      ));
      setTransferClient(null);
      setTransferTargetTrio(null);
    } catch { /* ignore */ }
    finally { setTransferring(false); }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-galaxy-blue-light" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-3">
          <Users className="text-galaxy-blue-light" size={24} />
          Meus Trios
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Gerencie os clientes de cada trio. Arraste ou transfira clientes entre trios.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {trioDisplays.map((td, i) => (
          <motion.div key={td.trio.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <GlassCard padding="lg">
              {/* Trio header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-text-primary">{td.trio.name}</h2>
                <span className="text-xs text-text-muted">{td.clients.length} clientes</span>
              </div>

              {/* Members */}
              <div className="flex flex-wrap gap-2 mb-4">
                {td.members.map((m, j) => (
                  <span key={j} className={cn('text-2xs px-2 py-1 rounded-full border font-medium', m.color)}>
                    {m.name}
                  </span>
                ))}
              </div>

              {/* Clients list */}
              <div className="space-y-2">
                {td.clients.length === 0 ? (
                  <p className="text-xs text-text-muted text-center py-4">Nenhum cliente neste trio</p>
                ) : (
                  td.clients.map(client => (
                    <div
                      key={client.id}
                      className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-white/[0.02] border border-glass-border hover:border-glass-border-strong transition-all group"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">{client.name}</p>
                        <div className="flex items-center gap-3 text-2xs text-text-muted mt-0.5">
                          {client.niche && <span>{client.niche}</span>}
                          <span className="flex items-center gap-1"><Clock size={9} /> {formatLT(client.lt_days)}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => { setTransferClient(client); setTransferTargetTrio(null); }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-white/5 text-text-muted hover:text-galaxy-blue-light transition-all"
                        title="Transferir para outro trio"
                      >
                        <ArrowLeftRight size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* Unassigned clients */}
      {unassignedClients.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-text-secondary mb-3">Clientes sem trio ({unassignedClients.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {unassignedClients.map(client => (
              <GlassCard key={client.id} padding="sm" className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-primary">{client.name}</p>
                  <p className="text-2xs text-text-muted">{client.niche}</p>
                </div>
                <button
                  onClick={() => { setTransferClient(client); setTransferTargetTrio(null); }}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-text-muted hover:text-galaxy-blue-light transition-all"
                >
                  <ArrowLeftRight size={14} />
                </button>
              </GlassCard>
            ))}
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {createPortal(
        <AnimatePresence>
          {transferClient && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={(e) => e.target === e.currentTarget && setTransferClient(null)}
            >
              <motion.div
                initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                className="w-full max-w-md glass-card-strong rounded-3xl overflow-hidden"
              >
                <div className="flex items-center justify-between px-6 py-4 border-b border-glass-border">
                  <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
                    <ArrowLeftRight size={16} className="text-galaxy-blue-light" />
                    Transferir {transferClient.name}
                  </h2>
                  <button onClick={() => setTransferClient(null)} className="p-2 rounded-xl hover:bg-white/5 text-text-muted"><X size={16} /></button>
                </div>

                <div className="px-6 py-5 space-y-3">
                  <p className="text-sm text-text-secondary mb-3">
                    Selecione o trio de destino para <strong className="text-text-primary">{transferClient.name}</strong>:
                  </p>

                  {trios.map(trio => (
                    <button
                      key={trio.id}
                      onClick={() => setTransferTargetTrio(trio.id)}
                      disabled={trio.id === transferClient.trio_id}
                      className={cn(
                        'w-full text-left px-4 py-3 rounded-xl border transition-all',
                        trio.id === transferClient.trio_id
                          ? 'opacity-40 cursor-not-allowed border-glass-border bg-white/[0.01]'
                          : transferTargetTrio === trio.id
                          ? 'border-galaxy-blue/40 bg-galaxy-blue/10 shadow-glow-blue-sm'
                          : 'border-glass-border hover:border-glass-border-strong hover:bg-white/[0.03]'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-text-primary">{trio.name}</span>
                        {trio.id === transferClient.trio_id && (
                          <span className="text-2xs text-text-muted">Trio atual</span>
                        )}
                        {transferTargetTrio === trio.id && (
                          <CheckCircle2 size={16} className="text-galaxy-blue-light" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="px-6 py-4 border-t border-glass-border">
                  <GradientButton
                    className="w-full"
                    disabled={!transferTargetTrio || transferring}
                    loading={transferring}
                    leftIcon={<ArrowLeftRight size={14} />}
                    onClick={handleTransfer}
                  >
                    Transferir Cliente
                  </GradientButton>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
