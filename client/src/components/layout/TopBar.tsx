import { Bell, LogOut, ChevronDown, Check, CheckCheck, X, UserPlus, Kanban } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { useNotificationStore, type NotificationItem } from '@/store/notificationStore';
import { cn } from '@/lib/utils';
import { useState, useRef, useEffect } from 'react';
import { api } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

export function TopBar() {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Fetch notifications from API
  useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      try {
        const res = await api.get<{ data: NotificationItem[] }>('/notifications');
        useNotificationStore.getState().setNotifications(res.data.data ?? []);
        return res.data.data;
      } catch {
        return [];
      }
    },
    refetchInterval: 30000,
  });

  return (
    <header className="h-14 border-b border-glass-border/50 bg-bg-deep/80 backdrop-blur-glass flex items-center justify-between px-6 sticky top-0 z-30">
      {/* Left — empty spacer */}
      <div />

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Notification bell */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => { setShowNotifications((v) => !v); setShowUserMenu(false); }}
            className={cn(
              'relative p-2 rounded-xl transition-all duration-200',
              showNotifications
                ? 'bg-galaxy-blue/15 text-galaxy-blue-light'
                : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
            )}
            aria-label="Notificações"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-galaxy-pink text-white text-2xs flex items-center justify-center font-bold animate-glow-pulse-pink">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <NotificationDropdown onClose={() => setShowNotifications(false)} />
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-glass-border" />

        {/* User menu */}
        <div ref={userRef} className="relative">
          <button
            onClick={() => { setShowUserMenu((v) => !v); setShowNotifications(false); }}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-white/5 transition-all duration-200"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-galaxy flex items-center justify-center text-xs font-bold text-white">
              {user?.name?.charAt(0).toUpperCase() ?? '?'}
            </div>
            <div className="hidden sm:block text-left">
              <span className="text-sm font-medium text-text-primary block leading-tight">
                {user?.name}
              </span>
              <span className="text-2xs text-text-muted capitalize">
                {user?.role?.replace(/_/g, ' ')}
              </span>
            </div>
            <ChevronDown size={14} className={cn('text-text-muted transition-transform', showUserMenu && 'rotate-180')} />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-52 glass-card-strong py-1 z-40 animate-fade-in">
              <div className="px-4 py-2.5 border-b border-glass-border mb-1">
                <p className="text-xs font-medium text-text-primary">{user?.name}</p>
                <p className="text-2xs text-text-muted truncate">{user?.email}</p>
              </div>
              <button
                onClick={() => { setShowUserMenu(false); logout(); window.location.href = '/login'; }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-text-secondary hover:text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut size={14} />
                <span>Sair</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

// ─── Notification Dropdown ──────────────────────────────────────────────────────

function NotificationDropdown({ onClose }: { onClose: () => void }) {
  const { notifications, unreadCount } = useNotificationStore();
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead);

  async function handleMarkAllRead() {
    markAllAsRead();
    try { await api.post('/notifications/read-all'); } catch { /* ignore */ }
  }

  async function handleMarkRead(id: string) {
    markAsRead(id);
    try { await api.patch(`/notifications/${id}/read`); } catch { /* ignore */ }
  }

  const NOTIFICATION_ICONS: Record<string, React.ReactNode> = {
    'handoff:sent': <Kanban size={14} className="text-galaxy-pink-light" />,
    'client:created': <UserPlus size={14} className="text-emerald-400" />,
    default: <Bell size={14} className="text-galaxy-blue-light" />,
  };

  return (
    <div className="absolute right-0 top-full mt-2 w-80 glass-card-strong z-40 animate-fade-in overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-glass-border">
        <h3 className="text-sm font-semibold text-text-primary">Notificações</h3>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-2xs text-galaxy-blue-light hover:text-galaxy-blue flex items-center gap-1 transition-colors"
              title="Marcar todas como lidas"
            >
              <CheckCheck size={12} />
              Ler todas
            </button>
          )}
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Notifications list */}
      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <Bell size={24} className="mx-auto text-text-muted mb-2 opacity-40" />
            <p className="text-xs text-text-muted">Nenhuma notificação</p>
          </div>
        ) : (
          notifications.slice(0, 20).map((n) => (
            <button
              key={n.id}
              onClick={() => !n.read_at && handleMarkRead(n.id)}
              className={cn(
                'w-full flex items-start gap-3 px-4 py-3 text-left transition-colors border-b border-glass-border/50 last:border-0',
                n.read_at
                  ? 'opacity-60 hover:opacity-80'
                  : 'hover:bg-white/[0.03]'
              )}
            >
              <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 mt-0.5">
                {NOTIFICATION_ICONS[n.type] ?? NOTIFICATION_ICONS.default}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-text-primary">{n.title}</p>
                {n.message && (
                  <p className="text-2xs text-text-muted mt-0.5 line-clamp-2">{n.message}</p>
                )}
                <p className="text-2xs text-text-muted mt-1">
                  {formatTimeAgo(n.created_at)}
                </p>
              </div>
              {!n.read_at && (
                <div className="w-2 h-2 rounded-full bg-galaxy-blue flex-shrink-0 mt-1.5" />
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}

function formatTimeAgo(dateStr: string): string {
  const now = Date.now();
  const d = new Date(dateStr).getTime();
  const diff = now - d;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Agora';
  if (mins < 60) return `${mins}min atrás`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h atrás`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Ontem';
  return `${days} dias atrás`;
}
