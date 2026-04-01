import { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserCog, Plus, Search, Shield, X, Eye, EyeOff,
  ChevronDown, Pencil, Check, AlertTriangle, UserMinus, HardDrive,
} from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { GradientButton } from '@/components/shared/GradientButton';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  must_reset_password: boolean;
  created_at: string;
}

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

const ROLE_GROUPS: { label: string; roles: string[] }[] = [
  { label: 'Liderança', roles: ['lideranca'] },
  { label: 'Aquisição', roles: ['aquisicao'] },
  { label: 'Coordenação', roles: ['coordenador'] },
  { label: 'Operação', roles: ['account', 'designer', 'gestor_trafego'] },
  { label: 'Tecnologia', roles: ['tech_crm'] },
];

const ROLE_COLORS: Record<string, string> = {
  super_admin: 'bg-red-500/15 text-red-400 border-red-500/25',
  lideranca: 'bg-galaxy-pink/15 text-galaxy-pink-light border-galaxy-pink/25',
  aquisicao: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
  coordenador: 'bg-galaxy-purple/15 text-galaxy-purple border-galaxy-purple/25',
  account: 'bg-galaxy-blue/15 text-galaxy-blue-light border-galaxy-blue/25',
  designer: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  gestor_trafego: 'bg-galaxy-cyan/15 text-galaxy-cyan border-galaxy-cyan/25',
  tech_crm: 'bg-orange-500/15 text-orange-400 border-orange-500/25',
};

const ASSIGNABLE_ROLES = ['lideranca', 'aquisicao', 'coordenador', 'account', 'designer', 'gestor_trafego', 'tech_crm'];

export function UsersPage() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterGroup, setFilterGroup] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await api.get<{ data: User[]; total: number }>('/users');
      return res.data;
    },
  });

  const users = data?.data ?? [];

  const filteredUsers = users.filter((u) => {
    if (u.role === 'super_admin' && currentUser?.role !== 'super_admin') return false;
    if (search) {
      const q = search.toLowerCase();
      if (!u.name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false;
    }
    if (filterGroup) {
      const group = ROLE_GROUPS.find((g) => g.label === filterGroup);
      if (group && !group.roles.includes(u.role)) return false;
    }
    return true;
  });

  const groupedUsers = filterGroup
    ? [{ label: filterGroup, users: filteredUsers }]
    : ROLE_GROUPS.map((g) => ({
        label: g.label,
        users: filteredUsers.filter((u) => g.roles.includes(u.role)),
      })).filter((g) => g.users.length > 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-3">
            <UserCog size={24} className="text-galaxy-blue-light" />
            Gestão de Equipe
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            {users.length} membros ativos
          </p>
        </div>
        <GradientButton onClick={() => setShowCreateModal(true)} leftIcon={<Plus size={16} />}>
          Novo Membro
        </GradientButton>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Buscar por nome ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-4 rounded-xl text-sm bg-white/5 border border-glass-border text-text-primary placeholder-text-muted focus:outline-none focus:border-galaxy-blue transition-colors"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilterGroup(null)}
            className={cn(
              'px-3 py-2 rounded-lg text-xs font-medium transition-all border',
              !filterGroup
                ? 'bg-galaxy-blue/15 text-galaxy-blue-light border-galaxy-blue/25'
                : 'bg-white/5 text-text-secondary border-glass-border hover:bg-white/8'
            )}
          >
            Todos
          </button>
          {ROLE_GROUPS.map((g) => (
            <button
              key={g.label}
              onClick={() => setFilterGroup(filterGroup === g.label ? null : g.label)}
              className={cn(
                'px-3 py-2 rounded-lg text-xs font-medium transition-all border',
                filterGroup === g.label
                  ? 'bg-galaxy-blue/15 text-galaxy-blue-light border-galaxy-blue/25'
                  : 'bg-white/5 text-text-secondary border-glass-border hover:bg-white/8'
              )}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {/* User List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-galaxy-blue border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {groupedUsers.map((group) => (
            <div key={group.label}>
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3 px-1">
                {group.label} ({group.users.length})
              </h3>
              <div className="grid gap-2">
                {group.users.map((u) => (
                  <UserCard
                    key={u.id}
                    user={u}
                    isSelf={u.id === currentUser?.id}
                    canEdit={currentUser?.role === 'super_admin' || currentUser?.role === 'lideranca'}
                    onEdit={() => setEditingUser(u)}
                  />
                ))}
              </div>
            </div>
          ))}
          {filteredUsers.length === 0 && (
            <p className="text-center text-text-muted py-8">Nenhum membro encontrado.</p>
          )}
        </div>
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateUserModal onClose={() => setShowCreateModal(false)} onCreated={() => queryClient.invalidateQueries({ queryKey: ['users'] })} />
        )}
        {editingUser && (
          <EditRoleModal user={editingUser} onClose={() => setEditingUser(null)} onUpdated={() => queryClient.invalidateQueries({ queryKey: ['users'] })} />
        )}
      </AnimatePresence>
    </div>
  );
}

function UserCard({ user, isSelf, canEdit, onEdit }: { user: User; isSelf: boolean; canEdit: boolean; onEdit: () => void }) {
  return (
    <GlassCard padding="sm" className="flex items-center gap-4">
      <div className="w-10 h-10 rounded-full bg-gradient-galaxy flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
        {user.name.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-text-primary truncate">{user.name}</p>
          {isSelf && (
            <span className="text-2xs px-1.5 py-0.5 rounded bg-galaxy-blue/15 text-galaxy-blue-light">Você</span>
          )}
          {user.must_reset_password && (
            <span className="text-2xs px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 flex items-center gap-1">
              <AlertTriangle size={10} /> Pendente
            </span>
          )}
        </div>
        <p className="text-xs text-text-muted truncate">{user.email}</p>
      </div>
      <span className={cn('text-2xs px-2.5 py-1 rounded-full border font-medium', ROLE_COLORS[user.role] ?? 'bg-white/10 text-text-secondary border-white/10')}>
        {ROLE_LABELS[user.role] ?? user.role}
      </span>
      {canEdit && !isSelf && (
        <button
          onClick={onEdit}
          className="p-2 rounded-lg text-text-muted hover:text-galaxy-blue-light hover:bg-galaxy-blue/10 transition-all"
          title="Editar cargo"
        >
          <Pencil size={14} />
        </button>
      )}
    </GlassCard>
  );
}

function CreateUserModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('account');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate random password
  const [password] = useState(() => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%&';
    let pw = '';
    for (let i = 0; i < 12; i++) pw += chars[Math.floor(Math.random() * chars.length)];
    return pw;
  });

  const [success, setSuccess] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      await api.post('/users', { name, email, password, role });
    },
    onSuccess: () => {
      setSuccess(true);
      onCreated();
      // Show success for 2.5s then close
      setTimeout(() => onClose(), 2500);
    },
    onError: (err: unknown) => {
      const axErr = err as { response?: { data?: { error?: string } } };
      setError(axErr?.response?.data?.error ?? 'Erro ao criar usuário.');
    },
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    mutation.mutate();
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="glass-card-strong p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-text-primary">Novo Membro</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
            <X size={20} />
          </button>
        </div>

        {success ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto">
              <Check size={28} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-base font-semibold text-text-primary">Membro criado com sucesso!</p>
              <p className="text-sm text-text-secondary mt-1">
                Um e-mail com as credenciais de acesso foi enviado para <strong className="text-text-primary">{email}</strong>.
              </p>
              <p className="text-xs text-text-muted mt-3">
                O membro ficará como <span className="text-amber-400 font-medium">Pendente</span> até realizar o primeiro acesso e redefinir a senha.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-text-secondary uppercase tracking-wide">Nome</label>
              <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full h-10 mt-1.5 px-3 rounded-xl text-sm bg-white/5 border border-glass-border text-text-primary focus:outline-none focus:border-galaxy-blue transition-colors" placeholder="Nome completo" />
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary uppercase tracking-wide">E-mail</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full h-10 mt-1.5 px-3 rounded-xl text-sm bg-white/5 border border-glass-border text-text-primary focus:outline-none focus:border-galaxy-blue transition-colors" placeholder="email@v4company.com" />
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary uppercase tracking-wide">Cargo</label>
              <div className="relative mt-1.5">
                <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full h-10 px-3 rounded-xl text-sm bg-white/5 border border-glass-border text-text-primary focus:outline-none focus:border-galaxy-blue transition-colors appearance-none">
                  {ASSIGNABLE_ROLES.map((r) => (<option key={r} value={r} className="bg-bg-dark">{ROLE_LABELS[r]}</option>))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary uppercase tracking-wide">Senha Temporária</label>
              <div className="relative mt-1.5">
                <input type={showPassword ? 'text' : 'password'} value={password} readOnly className="w-full h-10 px-3 pr-10 rounded-xl text-sm bg-white/5 border border-glass-border text-text-primary font-mono" />
                <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors">
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <p className="text-2xs text-text-muted mt-1">O membro redefinirá a senha no primeiro login.</p>
            </div>
            {error && (<div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">{error}</div>)}
            <GradientButton type="submit" isLoading={mutation.isPending} className="w-full" leftIcon={<Plus size={16} />}>
              {mutation.isPending ? 'Criando...' : 'Criar Membro'}
            </GradientButton>
          </form>
        )}
      </motion.div>
    </motion.div>
  );
}

// Bruno's email — the immutable root user who cannot be dismissed
const IMMUTABLE_USER_EMAIL = 'bruno.ribeiro@v4company.com';

function EditRoleModal({ user, onClose, onUpdated }: { user: User; onClose: () => void; onUpdated: () => void }) {
  const [role, setRole] = useState(user.role);
  const [error, setError] = useState<string | null>(null);
  const [showDismissConfirm, setShowDismissConfirm] = useState(false);
  const [dismissSuccess, setDismissSuccess] = useState(false);

  const isImmutable = user.email === IMMUTABLE_USER_EMAIL;

  const mutation = useMutation({
    mutationFn: async () => {
      await api.patch(`/users/${user.id}`, { role });
    },
    onSuccess: () => {
      onUpdated();
      onClose();
    },
    onError: (err: unknown) => {
      const axErr = err as { response?: { data?: { error?: string } } };
      setError(axErr?.response?.data?.error ?? 'Erro ao atualizar.');
    },
  });

  const dismissMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/users/${user.id}`);
    },
    onSuccess: () => {
      setDismissSuccess(true);
      onUpdated();
      setTimeout(() => onClose(), 2500);
    },
    onError: (err: unknown) => {
      const axErr = err as { response?: { data?: { error?: string } } };
      setError(axErr?.response?.data?.error ?? 'Erro ao demitir membro.');
    },
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="glass-card-strong p-6 w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        {dismissSuccess ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center mx-auto">
              <UserMinus size={28} className="text-red-400" />
            </div>
            <div>
              <p className="text-base font-semibold text-text-primary">Membro demitido</p>
              <p className="text-sm text-text-secondary mt-1">
                <strong className="text-text-primary">{user.name}</strong> foi removido da plataforma.
              </p>
              <p className="text-xs text-text-muted mt-2">Um backup das ações foi salvo automaticamente.</p>
            </div>
          </div>
        ) : showDismissConfirm ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-red-400 flex items-center gap-2">
                <AlertTriangle size={20} />
                Confirmar Demissão
              </h2>
              <button onClick={() => setShowDismissConfirm(false)} className="text-text-muted hover:text-text-primary transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
              <p className="text-sm text-text-primary mb-2">
                Tem certeza que deseja demitir <strong>{user.name}</strong>?
              </p>
              <p className="text-xs text-text-muted">
                Esta ação irá remover o acesso deste membro à plataforma. Um backup completo de todas as ações realizadas será criado automaticamente.
              </p>
            </div>
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">{error}</div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setShowDismissConfirm(false)}
                className="flex-1 h-10 rounded-xl text-sm font-medium bg-white/5 border border-glass-border text-text-secondary hover:bg-white/10 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={() => dismissMutation.mutate()}
                disabled={dismissMutation.isPending}
                className="flex-1 h-10 rounded-xl text-sm font-medium bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {dismissMutation.isPending ? (
                  <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <UserMinus size={14} />
                    Confirmar Demissão
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-text-primary">Alterar Cargo</h2>
              <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-white/5">
              <div className="w-8 h-8 rounded-full bg-gradient-galaxy flex items-center justify-center text-xs font-bold text-white">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">{user.name}</p>
                <p className="text-xs text-text-muted">{user.email}</p>
              </div>
            </div>

            <div className="mb-4">
              <label className="text-xs font-medium text-text-secondary uppercase tracking-wide">Novo Cargo</label>
              <div className="relative mt-1.5">
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl text-sm bg-white/5 border border-glass-border text-text-primary focus:outline-none focus:border-galaxy-blue transition-colors appearance-none"
                >
                  {ASSIGNABLE_ROLES.map((r) => (
                    <option key={r} value={r} className="bg-bg-dark">{ROLE_LABELS[r]}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              </div>
            </div>

            {role !== user.role && (
              <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400 flex items-start gap-2">
                <Shield size={14} className="flex-shrink-0 mt-0.5" />
                <span>Ao mudar o cargo, o acesso de <strong>{user.name}</strong> será ajustado para o painel de <strong>{ROLE_LABELS[role]}</strong>.</span>
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">{error}</div>
            )}

            <div className="space-y-2">
              <GradientButton
                onClick={() => mutation.mutate()}
                isLoading={mutation.isPending}
                disabled={role === user.role}
                className="w-full"
                leftIcon={<Check size={16} />}
              >
                {mutation.isPending ? 'Salvando...' : 'Salvar Alteração'}
              </GradientButton>

              {!isImmutable && (
                <button
                  onClick={() => setShowDismissConfirm(true)}
                  className="w-full h-10 rounded-xl text-sm font-medium text-red-400 border border-red-500/20 bg-red-500/5 hover:bg-red-500/15 transition-all flex items-center justify-center gap-2"
                >
                  <UserMinus size={14} />
                  Demitido
                </button>
              )}

              {isImmutable && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-galaxy-blue/5 border border-galaxy-blue/15 text-2xs text-galaxy-blue-light">
                  <Shield size={12} />
                  <span>Este perfil é a raiz da plataforma e não pode ser removido.</span>
                </div>
              )}
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
