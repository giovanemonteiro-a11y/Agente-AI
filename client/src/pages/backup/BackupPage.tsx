import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  HardDrive, User, Calendar, Clock, Download, Mail, Search,
  FileText, Shield, ChevronRight, ExternalLink,
} from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { GradientButton } from '@/components/shared/GradientButton';
import { cn } from '@/lib/utils';

// ─── Types ──────────────────────────────────────────────────────────────────────

interface BackupEntry {
  id: string;
  userName: string;
  userEmail: string;
  role: string;
  dismissedAt: string;
  dismissedBy: string;
  totalActions: number;
  clients: string[];
  lastAction: string;
}

// ─── Mock Data ──────────────────────────────────────────────────────────────────

const MOCK_BACKUPS: BackupEntry[] = [
  {
    id: 'bk-1',
    userName: 'Maria Teste Silva',
    userEmail: 'maria.teste@v4company.com',
    role: 'account',
    dismissedAt: '2026-03-26T03:27:00Z',
    dismissedBy: 'Bruno Henrique',
    totalActions: 47,
    clients: ['Empresa Alpha Tech', 'Moda Nova Brasil'],
    lastAction: 'Atualizou estratégia do cliente Empresa Alpha Tech',
  },
];

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  lideranca: 'Liderança',
  aquisicao: 'Aquisição',
  coordenador: 'Coordenação',
  account: 'Account',
  designer: 'Designer',
  gestor_trafego: 'Gestor de Tráfego',
  tech_crm: 'Tech CRM',
};

const ROLE_COLORS: Record<string, string> = {
  account: 'bg-galaxy-blue/15 text-galaxy-blue-light border-galaxy-blue/25',
  designer: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  gestor_trafego: 'bg-galaxy-cyan/15 text-galaxy-cyan border-galaxy-cyan/25',
  lideranca: 'bg-galaxy-pink/15 text-galaxy-pink-light border-galaxy-pink/25',
  aquisicao: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
  coordenador: 'bg-galaxy-purple/15 text-galaxy-purple border-galaxy-purple/25',
  tech_crm: 'bg-orange-500/15 text-orange-400 border-orange-500/25',
};

// ─── Page ───────────────────────────────────────────────────────────────────────

export function BackupPage() {
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = MOCK_BACKUPS.filter((b) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return b.userName.toLowerCase().includes(q) || b.userEmail.toLowerCase().includes(q);
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-3">
          <HardDrive size={24} className="text-galaxy-blue-light" />
          Backup de Governança
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Registro completo de todas as ações de membros desligados da plataforma
        </p>
      </div>

      {/* Info banner */}
      <GlassCard padding="sm" className="border-l-2 border-galaxy-blue/40">
        <div className="flex items-start gap-3">
          <Shield size={18} className="text-galaxy-blue-light flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-text-primary font-medium">Área exclusiva de governança</p>
            <p className="text-xs text-text-muted mt-0.5">
              Quando um membro é demitido, o sistema cria automaticamente um backup de todas as ações realizadas na plataforma.
              Nenhum dado é perdido — tudo fica registrado aqui para consulta e auditoria.
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          placeholder="Buscar por nome ou e-mail..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-10 pl-9 pr-3 rounded-xl bg-bg-dark/80 backdrop-blur-sm border border-glass-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-galaxy-blue/50 transition-all"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <GlassCard padding="sm">
          <p className="text-2xs text-text-muted uppercase tracking-wider mb-1">Total de Backups</p>
          <p className="text-2xl font-bold text-text-primary">{MOCK_BACKUPS.length}</p>
        </GlassCard>
        <GlassCard padding="sm">
          <p className="text-2xs text-text-muted uppercase tracking-wider mb-1">Ações Registradas</p>
          <p className="text-2xl font-bold text-galaxy-blue-light">{MOCK_BACKUPS.reduce((sum, b) => sum + b.totalActions, 0)}</p>
        </GlassCard>
        <GlassCard padding="sm">
          <p className="text-2xs text-text-muted uppercase tracking-wider mb-1">Último Desligamento</p>
          <p className="text-sm font-bold text-text-primary">
            {MOCK_BACKUPS.length > 0 ? new Date(MOCK_BACKUPS[0].dismissedAt).toLocaleDateString('pt-BR') : '—'}
          </p>
        </GlassCard>
      </div>

      {/* Backup List */}
      {filtered.length === 0 ? (
        <GlassCard className="flex flex-col items-center justify-center py-16 text-center">
          <HardDrive size={32} className="text-text-muted mb-3 opacity-40" />
          <p className="text-sm text-text-muted">Nenhum backup encontrado</p>
          <p className="text-2xs text-text-muted mt-1">Backups são criados automaticamente ao demitir um membro.</p>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {filtered.map((backup) => (
            <BackupCard
              key={backup.id}
              backup={backup}
              expanded={expandedId === backup.id}
              onToggle={() => setExpandedId(expandedId === backup.id ? null : backup.id)}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ─── Backup Card ────────────────────────────────────────────────────────────────

function BackupCard({ backup, expanded, onToggle }: { backup: BackupEntry; expanded: boolean; onToggle: () => void }) {
  const [emailSent, setEmailSent] = useState(false);

  return (
    <GlassCard padding="none" className="overflow-hidden">
      {/* Header — clickable */}
      <button onClick={onToggle} className="w-full p-5 flex items-center gap-4 text-left hover:bg-white/[0.02] transition-colors">
        <div className="w-10 h-10 rounded-full bg-red-500/15 border border-red-500/25 flex items-center justify-center text-sm font-bold text-red-400 flex-shrink-0">
          {backup.userName.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-text-primary">{backup.userName}</p>
            <span className={cn('text-2xs px-2 py-0.5 rounded-full border font-medium', ROLE_COLORS[backup.role] ?? 'bg-white/10 text-text-secondary')}>
              {ROLE_LABELS[backup.role] ?? backup.role}
            </span>
          </div>
          <p className="text-xs text-text-muted">{backup.userEmail}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-xs text-text-muted">Desligado em</p>
          <p className="text-sm font-medium text-red-400">{new Date(backup.dismissedAt).toLocaleDateString('pt-BR')}</p>
        </div>
        <ChevronRight size={16} className={cn('text-text-muted transition-transform', expanded && 'rotate-90')} />
      </button>

      {/* Expanded content */}
      {expanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="border-t border-glass-border"
        >
          <div className="p-5 space-y-4">
            {/* Info grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <InfoField icon={<User size={12} />} label="Demitido por" value={backup.dismissedBy} />
              <InfoField icon={<FileText size={12} />} label="Total de Ações" value={String(backup.totalActions)} />
              <InfoField icon={<Calendar size={12} />} label="Data" value={new Date(backup.dismissedAt).toLocaleDateString('pt-BR')} />
              <InfoField icon={<Clock size={12} />} label="Última Ação" value={backup.lastAction.length > 30 ? backup.lastAction.slice(0, 30) + '...' : backup.lastAction} />
            </div>

            {/* Clients worked on */}
            <div>
              <p className="text-2xs text-text-muted uppercase tracking-wider mb-2">Clientes Atendidos</p>
              <div className="flex flex-wrap gap-2">
                {backup.clients.map((c) => (
                  <span key={c} className="text-xs px-2.5 py-1 rounded-full bg-white/5 text-text-secondary border border-glass-border">{c}</span>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <GradientButton size="sm" leftIcon={<Download size={14} />}>
                Baixar Relatório
              </GradientButton>
              <button
                onClick={() => setEmailSent(true)}
                disabled={emailSent}
                className={cn(
                  'h-8 px-4 rounded-xl text-xs font-medium border flex items-center gap-2 transition-all',
                  emailSent
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-white/5 border-glass-border text-text-secondary hover:bg-white/10'
                )}
              >
                <Mail size={14} />
                {emailSent ? 'Enviado para lideranças' : 'Enviar para Lideranças'}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </GlassCard>
  );
}

function InfoField({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white/[0.02] border border-glass-border p-2.5">
      <div className="flex items-center gap-1 mb-0.5">
        <span className="text-text-muted">{icon}</span>
        <span className="text-2xs text-text-muted uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-xs font-medium text-text-primary truncate">{value}</p>
    </div>
  );
}
