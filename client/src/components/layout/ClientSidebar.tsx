import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutGrid,
  Video,
  Target,
  FileText,
  Users2,
  Newspaper,
  ClipboardList,
  TrendingUp,
  BarChart2,
  ChevronLeft,
  Layers,
  AlertTriangle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useClientById } from '@/hooks/useClient';

interface ClientNavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
}

export function ClientSidebar() {
  const { pathname } = useLocation();
  // Extract clientId from URL: /clients/:clientId/...
  const match = pathname.match(/^\/clients\/([^/]+)\/.+/);
  const clientId = match?.[1];
  const isMockId = clientId?.startsWith('mock-');
  const { data: client } = useClientById(isMockId ? undefined : clientId);

  // For mock clients, get data from navigation state or sessionStorage cache
  const stateClient = (location.state as { client?: { status?: string; name?: string; segment?: string } } | null)?.client;
  let cachedMock: { name?: string; segment?: string; status?: string } | undefined;
  if (!client && !stateClient && clientId) {
    try {
      const raw = sessionStorage.getItem(`mock-client-${clientId}`);
      if (raw) cachedMock = JSON.parse(raw);
    } catch { /* ignore */ }
  }
  if (stateClient && clientId) {
    try { sessionStorage.setItem(`mock-client-${clientId}`, JSON.stringify(stateClient)); } catch { /* ignore */ }
  }
  const clientName = client?.name ?? stateClient?.name ?? cachedMock?.name;
  const clientSegment = client?.segment ?? stateClient?.segment ?? cachedMock?.segment;
  const clientStatus = client?.status ?? stateClient?.status ?? cachedMock?.status;

  if (!clientId) return null;

  const isInactive = clientStatus === 'churned' || clientId.includes('inactive') || pathname.includes('/churn-info');

  const navItems: ClientNavItem[] = [];

  // Inactive clients get "Motivo Inativo" tab first
  if (isInactive) {
    navItems.push({
      to: `/clients/${clientId}/churn-info`,
      icon: <AlertTriangle size={16} />,
      label: 'Motivo Inativo',
    });
  }

  navItems.push(
    { to: `/clients/${clientId}/overview`, icon: <LayoutGrid size={16} />, label: 'Visão Geral' },
    { to: `/clients/${clientId}/meetings`, icon: <Video size={16} />, label: 'Reuniões' },
    { to: `/clients/${clientId}/strategy`, icon: <Target size={16} />, label: 'Estratégia' },
    { to: `/clients/${clientId}/summary`, icon: <FileText size={16} />, label: 'One Page Summary' },
    { to: `/clients/${clientId}/cohorts`, icon: <Users2 size={16} />, label: 'Coortes' },
    { to: `/clients/${clientId}/editorial`, icon: <Newspaper size={16} />, label: 'Editorial' },
    { to: `/clients/${clientId}/briefings`, icon: <ClipboardList size={16} />, label: 'Briefings' },
    { to: `/clients/${clientId}/systems`, icon: <Layers size={16} />, label: 'Sistemas' },
    { to: `/clients/${clientId}/reports`, icon: <TrendingUp size={16} />, label: 'Relatórios' },
    { to: `/clients/${clientId}/bi`, icon: <BarChart2 size={16} />, label: 'BI do Cliente' },
  );

  return (
    <div className="w-52 border-r border-glass-border bg-white/[0.015] flex flex-col py-4">
      {/* Back to clients */}
      <Link
        to="/clients"
        className="flex items-center gap-2 px-4 mb-2 text-xs text-text-muted hover:text-text-secondary transition-colors"
      >
        <ChevronLeft size={14} />
        <span>Todos os clientes</span>
      </Link>

      {/* Client name */}
      {clientName && (
        <div className="px-4 mb-4 pb-3 border-b border-glass-border">
          <p className="text-sm font-semibold text-text-primary truncate">{clientName}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className={cn(
              'text-2xs px-1.5 py-0.5 rounded-full border font-medium',
              isInactive
                ? 'bg-red-500/15 text-red-400 border-red-500/25'
                : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25'
            )}>
              {isInactive ? 'Inativo' : 'Ativo'}
            </span>
            {clientSegment && (
              <span className="text-2xs text-text-muted truncate">{clientSegment}</span>
            )}
          </div>
        </div>
      )}

      <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            state={stateClient ? { client: stateClient } : undefined}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200',
                isActive
                  ? 'bg-galaxy-blue/15 text-galaxy-blue-light'
                  : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
              )
            }
          >
            <span className="flex-shrink-0 opacity-70">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
