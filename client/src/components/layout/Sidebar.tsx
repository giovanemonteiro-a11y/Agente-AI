import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Settings,
  Zap,
  Kanban,
  UserCog,
  FolderOpen,
  Megaphone,
  TrendingUp,
  ClipboardList,
  Send,
  Layers,
  Plug,
  HardDrive,
  Table2,
  CalendarClock,
  DollarSign,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/types/auth';

interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
  end?: boolean;
  roles?: UserRole[];
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

function getNavSections(role: UserRole, userEmail?: string): NavSection[] {
  const sections: NavSection[] = [];

  // ─── Super Admin ──────────────────────────────────
  if (role === 'super_admin') {
    sections.push(
      {
        items: [
          { to: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
        ],
      },
      {
        title: 'Gestão',
        items: [
          { to: '/crm', icon: <Kanban size={18} />, label: 'CRM' },
          { to: '/clients', icon: <FolderOpen size={18} />, label: 'Clientes' },
          { to: '/users', icon: <UserCog size={18} />, label: 'Usuários' },
        ],
      },
      {
        title: 'Inteligência',
        items: [
          { to: '/bi', icon: <BarChart3 size={18} />, label: 'BI Global' },
        ],
      },
      {
        title: 'Sistema',
        items: [
          { to: '/settings', icon: <Settings size={18} />, label: 'Configurações' },
        ],
      }
    );
    return sections;
  }

  // ─── Liderança ────────────────────────────────────
  if (role === 'lideranca') {
    sections.push(
      {
        items: [
          { to: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
        ],
      },
      {
        title: 'Gestão',
        items: [
          { to: '/crm', icon: <Kanban size={18} />, label: 'CRM' },
          { to: '/clients', icon: <FolderOpen size={18} />, label: 'Clientes' },
          { to: '/users', icon: <UserCog size={18} />, label: 'Equipe' },
        ],
      },
      {
        title: 'Inteligência',
        items: [
          { to: '/bi', icon: <BarChart3 size={18} />, label: 'BI Overall' },
        ],
      }
    );

    // Backup — exclusive to Bruno (immutable root user)
    if (userEmail === 'bruno.ribeiro@v4company.com') {
      sections.push({
        title: 'Governança',
        items: [
          { to: '/backup', icon: <HardDrive size={18} />, label: 'Backup' },
        ],
      });
    }

    // Commercial module — exclusive to Bruna Moreira
    if (userEmail === 'bruna.moreira@v4company.com') {
      sections.push({
        title: 'Gestão Comercial',
        items: [
          { to: '/commercial', icon: <DollarSign size={18} />, label: 'Dashboard', end: true },
          { to: '/commercial/monetizations', icon: <TrendingUp size={18} />, label: 'Monetizações' },
          { to: '/commercial/commissions', icon: <BarChart3 size={18} />, label: 'Comissões' },
          { to: '/commercial/goals', icon: <ClipboardList size={18} />, label: 'Metas' },
        ],
      });
    }

    return sections;
  }

  // ─── Aquisição ────────────────────────────────────
  if (role === 'aquisicao') {
    sections.push(
      {
        items: [
          { to: '/handoffs/new', icon: <Send size={18} />, label: 'Novo Handoff' },
        ],
      }
    );
    return sections;
  }

  // ─── Coordenador ──────────────────────────────────
  if (role === 'coordenador') {
    sections.push(
      {
        items: [
          { to: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
        ],
      },
      {
        title: 'Gestão',
        items: [
          { to: '/coordinator-crm', icon: <Kanban size={18} />, label: 'CRM' },
          { to: '/coordinator/clients', icon: <FolderOpen size={18} />, label: 'Meus Clientes' },
          { to: '/coordinator/trios', icon: <Users size={18} />, label: 'Trios' },
        ],
      },
      {
        title: 'Operação',
        items: [
          { to: '/coordinator/board-of-head', icon: <Table2 size={18} />, label: 'Board Of Head' },
          { to: '/coordinator/sprint', icon: <CalendarClock size={18} />, label: 'Sprint' },
        ],
      }
    );
    return sections;
  }

  // ─── Account ──────────────────────────────────────
  if (role === 'account') {
    sections.push(
      {
        items: [
          { to: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
        ],
      },
      {
        title: 'Meus Clientes',
        items: [
          { to: '/clients', icon: <FolderOpen size={18} />, label: 'Clientes' },
          { to: '/briefings', icon: <ClipboardList size={18} />, label: 'Briefings' },
        ],
      },
      {
        title: 'Inteligência',
        items: [
          { to: '/bi', icon: <BarChart3 size={18} />, label: 'BI' },
        ],
      }
    );
    return sections;
  }

  // ─── Designer ─────────────────────────────────────
  if (role === 'designer') {
    sections.push(
      {
        items: [
          { to: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
        ],
      },
      {
        title: 'Meus Clientes',
        items: [
          { to: '/clients', icon: <FolderOpen size={18} />, label: 'Clientes' },
          { to: '/systems', icon: <Layers size={18} />, label: 'Módulos' },
        ],
      },
      {
        title: 'Inteligência',
        items: [
          { to: '/bi', icon: <BarChart3 size={18} />, label: 'BI' },
        ],
      }
    );
    return sections;
  }

  // ─── Gestor de Tráfego ────────────────────────────
  if (role === 'gestor_trafego') {
    sections.push(
      {
        items: [
          { to: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
        ],
      },
      {
        title: 'Operação',
        items: [
          { to: '/clients', icon: <FolderOpen size={18} />, label: 'Clientes' },
          { to: '/investments', icon: <TrendingUp size={18} />, label: 'Investimentos' },
          { to: '/campaigns', icon: <Megaphone size={18} />, label: 'Campanhas' },
        ],
      },
      {
        title: 'Inteligência',
        items: [
          { to: '/bi', icon: <BarChart3 size={18} />, label: 'BI' },
        ],
      }
    );
    return sections;
  }

  // ─── Tech CRM ─────────────────────────────────────
  if (role === 'tech_crm') {
    sections.push(
      {
        items: [
          { to: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
        ],
      },
      {
        title: 'Operação',
        items: [
          { to: '/clients', icon: <FolderOpen size={18} />, label: 'Clientes' },
          { to: '/integrations', icon: <Plug size={18} />, label: 'Integrações' },
        ],
      }
    );
    return sections;
  }

  // ─── Fallback ─────────────────────────────────────
  sections.push({
    items: [
      { to: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
      { to: '/clients', icon: <FolderOpen size={18} />, label: 'Clientes' },
    ],
  });

  return sections;
}

export function Sidebar() {
  const { user } = useAuth();
  const navSections = getNavSections((user?.role ?? 'account') as UserRole, user?.email);

  return (
    <aside className="w-64 min-h-screen bg-gradient-sidebar border-r border-glass-border flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-glass-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-galaxy flex items-center justify-center animate-glow-pulse">
            <Zap size={16} className="text-white" />
          </div>
          <div>
            <span className="text-sm font-bold gradient-text">AI SICI</span>
            <p className="text-2xs text-text-muted leading-none mt-0.5">Agência Inteligente</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        {navSections.map((section, si) => (
          <div key={si}>
            {section.title && (
              <p className="px-3 mb-2 text-2xs font-semibold text-text-muted uppercase tracking-wider">
                {section.title}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 group',
                      isActive
                        ? 'bg-galaxy-blue/15 text-galaxy-blue-light border border-galaxy-blue/20 shadow-glow-blue-sm'
                        : 'text-text-secondary hover:text-text-primary hover:bg-white/[0.04]'
                    )
                  }
                >
                  <span className="flex-shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom padding */}
      <div className="p-3" />
    </aside>
  );
}
