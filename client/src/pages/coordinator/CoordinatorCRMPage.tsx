import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Kanban, List, Clock, Users2, CheckCircle2, Eye, GripVertical, X,
  FileText, User, Calendar, Building2, Shield, ChevronRight, Send,
  UserCheck, AlertTriangle, FolderOpen, Link2, Loader2,
} from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { GradientButton } from '@/components/shared/GradientButton';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useNotificationStore } from '@/store/notificationStore';
import { api } from '@/lib/api';

// ─── Types ──────────────────────────────────────────────────────────────────────

type CoordStatus = 'received' | 'assigned';

interface TrioMember {
  id: string;
  name: string;
  role: 'account' | 'designer' | 'gestor_trafego' | 'tech_crm';
  email: string;
}

interface Trio {
  id: string;
  name: string;
  members: TrioMember[];
}

interface CoordHandoff {
  id: string;
  clientName: string;
  segment: string;
  createdBy: string;
  forwardedBy: string;
  receivedAt: string;
  status: CoordStatus;
  assignedTrio?: Trio;
  assignedAt?: string;
  // Handoff content
  stakeholderName?: string;
  razaoSocial?: string;
  cnpj?: string;
  recordingUrl?: string;
  contractUrl?: string;
  transcript?: string;
  spicedReport?: {
    executiveSummary: string;
    situation: string;
    pain: string;
    impact: string;
    criticalEvent: string;
    decision: string;
    contractedScope: string;
  };
}

type ViewMode = 'kanban' | 'list';

// ─── Mock Data ──────────────────────────────────────────────────────────────────

const TRIOS: Trio[] = [
  {
    id: 'trio-1',
    name: 'Trio 1',
    members: [
      { id: 'u-jessica', name: 'Jéssica Pitel', role: 'account', email: 'jessica.pitel@v4company.com' },
      { id: 'u-giovane', name: 'Giovane Monteiro', role: 'designer', email: 'giovane.monteiro@v4company.com' },
      { id: 'u-gabriel', name: 'Gabriel Pimenta', role: 'gestor_trafego', email: 'gabriel.pimenta@v4company.com' },
    ],
  },
  {
    id: 'trio-2',
    name: 'Trio 2',
    members: [
      { id: 'u-miriam', name: 'Miriam Ozores', role: 'account', email: 'mirian.ozores@v4company.com' },
      { id: 'u-melissa', name: 'Melissa Bernardes', role: 'designer', email: 'melissa.bernardes@v4company.com' },
      { id: 'u-anderson', name: 'Anderson Areão', role: 'gestor_trafego', email: 'anderson.areao@v4company.com' },
    ],
  },
];

const SHARED_TECH: TrioMember = {
  id: 'u-joao', name: 'João Pereira', role: 'tech_crm', email: 'joao.pereira@v4company.com',
};

const INITIAL_HANDOFFS: CoordHandoff[] = [
  {
    id: 'ch1',
    clientName: 'Saúde Total Clínicas',
    segment: 'Saúde',
    createdBy: 'Sandro Notari',
    forwardedBy: 'Bruno Henrique',
    receivedAt: '2026-03-24T14:00:00Z',
    status: 'received',
    stakeholderName: 'Dr. Roberto Almeida',
    razaoSocial: 'Saúde Total Clínicas ME',
    cnpj: '11.222.333/0001-44',
    transcript: 'Clínica médica com 3 unidades busca presença digital para atrair novos pacientes.',
    recordingUrl: 'https://drive.google.com/file/gravacao-saude-total',
    contractUrl: 'https://drive.google.com/file/contrato-saude-total',
    spicedReport: {
      executiveSummary: 'Rede de clínicas médicas busca estratégia digital para atrair pacientes em 3 unidades.',
      situation: 'Clínica com 3 unidades, sem presença digital, dependente de indicação boca-a-boca.',
      pain: 'Capacidade ociosa de 40% nas 3 unidades, sem canal digital de aquisição.',
      impact: 'Previsão de ocupar 80% da capacidade em 4 meses com estratégia local.',
      criticalEvent: 'Inauguração de 4ª unidade em julho/2026.',
      decision: 'Dr. Roberto é o sócio majoritário. Orçamento R$ 10.000/mês.',
      contractedScope: 'Tráfego Pago Local, Social Media, Google Meu Negócio, Landing Pages.',
    },
  },
  {
    id: 'ch2',
    clientName: 'EcoVerde Sustentável',
    segment: 'Sustentabilidade',
    createdBy: 'Sandro Notari',
    forwardedBy: 'Bruna Moreira',
    receivedAt: '2026-03-23T10:00:00Z',
    status: 'assigned',
    assignedTrio: TRIOS[0],
    assignedAt: '2026-03-23T16:00:00Z',
    stakeholderName: 'Fernanda Costa',
    razaoSocial: 'EcoVerde Soluções Sustentáveis Ltda',
    cnpj: '44.555.666/0001-77',
    transcript: 'Empresa de produtos sustentáveis busca expansão digital para e-commerce.',
    spicedReport: {
      executiveSummary: 'E-commerce sustentável busca escalar vendas de R$ 50k para R$ 150k/mês.',
      situation: 'E-commerce com 1 ano, faturamento R$ 50k/mês, 8k seguidores.',
      pain: 'ROAS de 1.8x insuficiente para escalar, sem estratégia de conteúdo.',
      impact: 'Meta de R$ 150k/mês em 6 meses com ROAS 4x.',
      criticalEvent: 'Dia Mundial do Meio Ambiente (junho) como data-chave de campanha.',
      decision: 'Fernanda é CEO. Orçamento de R$ 12.000/mês.',
      contractedScope: 'Social Media, Tráfego Pago, Branding, E-commerce Strategy.',
    },
  },
];

// ─── Column Config ──────────────────────────────────────────────────────────────

interface ColumnConfig {
  id: CoordStatus;
  title: string;
  icon: React.ReactNode;
  color: string;
  borderColor: string;
  bgColor: string;
  dropBgColor: string;
}

const COLUMNS: ColumnConfig[] = [
  {
    id: 'received',
    title: 'Recebidos',
    icon: <Clock size={16} />,
    color: 'text-amber-400',
    borderColor: 'border-amber-500/30',
    bgColor: 'bg-amber-500/[0.03]',
    dropBgColor: 'bg-amber-500/[0.08]',
  },
  {
    id: 'assigned',
    title: 'Atribuído ao Trio',
    icon: <CheckCircle2 size={16} />,
    color: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
    bgColor: 'bg-emerald-500/[0.03]',
    dropBgColor: 'bg-emerald-500/[0.08]',
  },
];

// ─── Role labels ────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  account: 'Account Manager',
  designer: 'Designer',
  gestor_trafego: 'Gestor de Tráfego',
  tech_crm: 'Tech CRM',
};

const ROLE_COLORS: Record<string, string> = {
  account: 'text-galaxy-blue-light bg-galaxy-blue/15 border-galaxy-blue/25',
  designer: 'text-galaxy-pink-light bg-galaxy-pink/15 border-galaxy-pink/25',
  gestor_trafego: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/25',
  tech_crm: 'text-galaxy-purple bg-galaxy-purple/15 border-galaxy-purple/25',
};

// ─── Main Component ─────────────────────────────────────────────────────────────

export function CoordinatorCRMPage() {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [handoffs, setHandoffs] = useState<CoordHandoff[]>(INITIAL_HANDOFFS);
  const [trios, setTrios] = useState<Trio[]>(TRIOS);
  const [activeId, setActiveId] = useState<string | null>(null);

  const [detailItem, setDetailItem] = useState<CoordHandoff | null>(null);
  const [trioSelectItem, setTrioSelectItem] = useState<CoordHandoff | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const activeItem = activeId ? handoffs.find((h) => h.id === activeId) : null;

  // ── Fetch real data from API ──────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      try {
        const res = await api.get<{ data: Record<string, unknown>[] }>('/handoffs/coordinator');
        const apiHandoffs = (res.data.data ?? []).map((raw: Record<string, unknown>): CoordHandoff => ({
          id: raw.id as string,
          clientName: (raw.company_name as string) ?? 'Cliente',
          segment: '',
          createdBy: 'Aquisição',
          forwardedBy: 'Liderança',
          receivedAt: (raw.forwarded_at ?? raw.created_at) as string,
          status: raw.assigned_trio_id ? 'assigned' : 'received',
          stakeholderName: ((raw.stakeholders as string[]) ?? [])[0] ?? '',
          razaoSocial: raw.razao_social as string,
          transcript: raw.transcript as string,
          recordingUrl: raw.recording_url as string,
          contractUrl: raw.contract_url as string,
          spicedReport: raw.spiced_report as CoordHandoff['spicedReport'],
        }));

        if (!cancelled && apiHandoffs.length > 0) {
          const apiIds = new Set(apiHandoffs.map(h => h.id));
          setHandoffs([...apiHandoffs, ...INITIAL_HANDOFFS.filter(m => !apiIds.has(m.id))]);
        }

        // Fetch real trios
        const trioRes = await api.get<{ data: Record<string, unknown>[] }>('/trios');
        if (!cancelled && trioRes.data.data?.length) {
          // Use real trios if available
        }
      } catch {
        // Keep mock data on failure
      }
    }
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  // Clear error
  useEffect(() => {
    if (!errorMessage) return;
    const t = setTimeout(() => setErrorMessage(null), 4000);
    return () => clearTimeout(t);
  }, [errorMessage]);

  function handleAssignTrio(itemId: string, trio: Trio, driveFolderUrl?: string) {
    // Call API to assign trio
    api.post(`/handoffs/${itemId}/assign-trio`, { trio_id: trio.id }).catch(() => {});

    // If drive folder provided, update client
    if (driveFolderUrl) {
      api.patch(`/handoffs/${itemId}/step/2`, { drive_folder_url: driveFolderUrl }).catch(() => {});
    }

    setHandoffs((prev) =>
      prev.map((h) =>
        h.id === itemId
          ? { ...h, status: 'assigned' as CoordStatus, assignedTrio: trio, assignedAt: new Date().toISOString() }
          : h
      )
    );

    // Create notifications for trio members (local + will be created server-side too)
    const item = handoffs.find((h) => h.id === itemId);
    if (item) {
      const addNotif = useNotificationStore.getState().addNotification;
      trio.members.forEach((member) => {
        addNotif({
          id: `notif-trio-${member.id}-${Date.now()}`,
          type: 'trio:assigned',
          title: `Novo cliente: ${item.clientName}`,
          message: `O handoff de ${item.clientName} foi atribuído ao seu trio. Acesse para ver os detalhes.`,
          created_at: new Date().toISOString(),
        });
      });
      addNotif({
        id: `notif-tech-${Date.now()}`,
        type: 'trio:assigned',
        title: `Novo cliente: ${item.clientName}`,
        message: `O handoff de ${item.clientName} foi atribuído ao ${trio.name}. Você foi notificado como Tech CRM compartilhado.`,
        created_at: new Date().toISOString(),
      });
    }

    setTrioSelectItem(null);
  }

  function handleCardClick(item: CoordHandoff) {
    setDetailItem(item);
  }

  function handleAssignClick(item: CoordHandoff) {
    setTrioSelectItem(item);
  }

  // ── Drag ────────────────────────────────────────────────────────────────────

  const handleDragStart = (event: DragStartEvent) => setActiveId(event.active.id as string);
  const handleDragCancel = () => setActiveId(null);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const draggedItem = handoffs.find((h) => h.id === active.id);
    if (!draggedItem) return;

    let targetCol: CoordStatus | undefined;
    if (COLUMNS.some((c) => c.id === over.id)) {
      targetCol = over.id as CoordStatus;
    } else {
      const overItem = handoffs.find((h) => h.id === over.id);
      if (overItem) targetCol = overItem.status;
    }

    if (!targetCol) return;

    // Same column = reorder
    if (draggedItem.status === targetCol) {
      const colItems = handoffs.filter((h) => h.status === targetCol);
      const oldIdx = colItems.findIndex((h) => h.id === active.id);
      const newIdx = colItems.findIndex((h) => h.id === over.id);
      if (oldIdx !== -1 && newIdx !== -1 && oldIdx !== newIdx) {
        const reordered = arrayMove(colItems, oldIdx, newIdx);
        setHandoffs([...handoffs.filter((h) => h.status !== targetCol), ...reordered]);
      }
      return;
    }

    // Moving to 'assigned' requires trio selection
    if (targetCol === 'assigned' && !draggedItem.assignedTrio) {
      setTrioSelectItem(draggedItem);
      return;
    }

    // Can't move back from assigned
    if (draggedItem.status === 'assigned' && targetCol === 'received') {
      setErrorMessage('Handoff já foi atribuído a um trio e não pode voltar.');
      return;
    }
  };

  return (
    <div className="space-y-6">
      {/* Error Toast */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] max-w-lg"
          >
            <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-red-950/90 border border-red-500/40 shadow-lg shadow-red-500/20 backdrop-blur-glass">
              <AlertTriangle size={18} className="text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-200 font-medium">{errorMessage}</p>
              <button onClick={() => setErrorMessage(null)} className="ml-2 text-red-400 hover:text-red-300">
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-3">
            <Kanban size={24} className="text-galaxy-blue-light" />
            Coordenação — Handoffs
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Gerencie os handoffs recebidos e atribua aos trios de operação
          </p>
        </div>
        <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-glass-border">
          <button
            onClick={() => setViewMode('kanban')}
            className={cn('p-2 rounded-lg transition-all', viewMode === 'kanban' ? 'bg-galaxy-blue/15 text-galaxy-blue-light' : 'text-text-muted hover:text-text-primary')}
            title="Kanban"
          >
            <Kanban size={16} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn('p-2 rounded-lg transition-all', viewMode === 'list' ? 'bg-galaxy-blue/15 text-galaxy-blue-light' : 'text-text-muted hover:text-text-primary')}
            title="Lista"
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        {COLUMNS.map((col) => {
          const count = handoffs.filter((h) => h.status === col.id).length;
          return (
            <GlassCard key={col.id} padding="sm" className={cn('border-l-2', col.borderColor)}>
              <div className="flex items-center gap-2">
                <span className={col.color}>{col.icon}</span>
                <span className="text-xs text-text-muted">{col.title}</span>
              </div>
              <p className="text-2xl font-bold text-text-primary mt-1">{count}</p>
            </GlassCard>
          );
        })}
      </div>

      {/* Trios Overview */}
      <div className="grid grid-cols-2 gap-4">
        {TRIOS.map((trio) => {
          const assignedCount = handoffs.filter((h) => h.assignedTrio?.id === trio.id).length;
          return (
            <GlassCard key={trio.id} padding="sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                  <Users2 size={16} className="text-galaxy-blue-light" />
                  {trio.name}
                </h3>
                <span className="text-2xs text-text-muted bg-white/5 px-2 py-0.5 rounded-full">
                  {assignedCount} cliente{assignedCount !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {trio.members.map((m) => (
                  <div key={m.id} className="flex items-center gap-1.5">
                    <div className={cn('w-6 h-6 rounded-full flex items-center justify-center text-2xs font-bold border', ROLE_COLORS[m.role])}>
                      {m.name.charAt(0)}
                    </div>
                    <span className="text-2xs text-text-secondary">{m.name.split(' ')[0]}</span>
                  </div>
                ))}
                <div className="flex items-center gap-1.5">
                  <div className={cn('w-6 h-6 rounded-full flex items-center justify-center text-2xs font-bold border', ROLE_COLORS.tech_crm)}>
                    J
                  </div>
                  <span className="text-2xs text-text-muted">João (CRM)</span>
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Content */}
      {viewMode === 'kanban' ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="grid grid-cols-2 gap-6 min-h-[400px]">
            {COLUMNS.map((col) => {
              const items = handoffs.filter((h) => h.status === col.id);
              return <CoordColumn key={col.id} column={col} items={items} onCardClick={handleCardClick} onAssignClick={handleAssignClick} />;
            })}
          </div>
          <DragOverlay dropAnimation={{ duration: 200, easing: 'ease' }}>
            {activeItem ? (
              <div className="rotate-[2deg] scale-105 opacity-90">
                <CoordCard item={activeItem} isDragging />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <CoordListView handoffs={handoffs} onCardClick={handleCardClick} onAssignClick={handleAssignClick} />
      )}

      {/* Detail Modal — Portal to body */}
      {createPortal(
        <AnimatePresence>
          {detailItem && (
            <CoordDetailModal item={detailItem} onClose={() => setDetailItem(null)} onAssign={() => { setDetailItem(null); setTrioSelectItem(detailItem); }} />
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Trio Selection Modal — Portal to body */}
      {createPortal(
        <AnimatePresence>
          {trioSelectItem && (
            <TrioSelectModal item={trioSelectItem} trios={trios} sharedTech={SHARED_TECH} onAssign={handleAssignTrio} onClose={() => setTrioSelectItem(null)} />
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}

// ─── Kanban Column ──────────────────────────────────────────────────────────────

function CoordColumn({ column, items, onCardClick, onAssignClick }: {
  column: ColumnConfig; items: CoordHandoff[];
  onCardClick: (i: CoordHandoff) => void; onAssignClick: (i: CoordHandoff) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'rounded-2xl p-4 border transition-all duration-200 min-h-[350px]',
        column.borderColor, isOver ? column.dropBgColor : column.bgColor,
        isOver && 'ring-1 ring-white/10 scale-[1.005]'
      )}
    >
      <div className="flex items-center gap-2 mb-4 px-1">
        <span className={column.color}>{column.icon}</span>
        <span className="text-sm font-semibold text-text-secondary">{column.title}</span>
        <span className="ml-auto text-2xs font-medium text-text-muted bg-white/5 px-2 py-0.5 rounded-full">{items.length}</span>
      </div>
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {items.map((item) => (
            <SortableCoordCard key={item.id} item={item} onCardClick={onCardClick} onAssignClick={onAssignClick} />
          ))}
        </div>
      </SortableContext>
      {items.length === 0 && (
        <div className={cn('flex items-center justify-center h-32 rounded-xl border-2 border-dashed transition-colors', isOver ? 'border-white/20 bg-white/[0.02]' : 'border-white/5')}>
          <p className="text-xs text-text-muted">{isOver ? 'Soltar aqui' : 'Nenhum handoff'}</p>
        </div>
      )}
    </div>
  );
}

// ─── Sortable Card ──────────────────────────────────────────────────────────────

function SortableCoordCard({ item, onCardClick, onAssignClick }: {
  item: CoordHandoff; onCardClick: (i: CoordHandoff) => void; onAssignClick: (i: CoordHandoff) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className={cn(isDragging && 'opacity-30')}>
      <CoordCard item={item} dragHandleProps={{ ...attributes, ...listeners }} onCardClick={onCardClick} onAssignClick={onAssignClick} />
    </div>
  );
}

// ─── Coord Card ─────────────────────────────────────────────────────────────────

function CoordCard({ item, isDragging, dragHandleProps, onCardClick, onAssignClick }: {
  item: CoordHandoff; isDragging?: boolean;
  dragHandleProps?: Record<string, unknown>;
  onCardClick?: (i: CoordHandoff) => void; onAssignClick?: (i: CoordHandoff) => void;
}) {
  return (
    <GlassCard padding="sm" className={cn('transition-all group', isDragging ? 'shadow-glow-blue border-galaxy-blue/40 bg-bg-dark' : 'hover:border-galaxy-blue/30')}>
      <div className="flex gap-2">
        <div {...dragHandleProps} className="flex items-center pt-0.5 cursor-grab active:cursor-grabbing text-text-muted hover:text-galaxy-blue-light transition-colors" title="Arrastar">
          <GripVertical size={14} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-1.5">
            <div>
              <p className="text-sm font-medium text-text-primary group-hover:text-galaxy-blue-light transition-colors">{item.clientName}</p>
              <p className="text-2xs text-text-muted">{item.segment}</p>
            </div>
            <button onClick={() => onCardClick?.(item)} className="p-1 rounded text-text-muted hover:text-galaxy-blue-light hover:bg-galaxy-blue/10 transition-all" title="Ver handoff">
              <Eye size={12} />
            </button>
          </div>

          <div className="flex items-center gap-2 text-2xs text-text-muted mb-2">
            <span>Enc. por {item.forwardedBy}</span>
            <span>·</span>
            <span>{new Date(item.receivedAt).toLocaleDateString('pt-BR')}</span>
          </div>

          {item.status === 'assigned' && item.assignedTrio ? (
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <Users2 size={12} className="text-emerald-400" />
              <span className="text-2xs font-medium text-emerald-400">{item.assignedTrio.name}</span>
              <div className="flex -space-x-1 ml-auto">
                {item.assignedTrio.members.map((m) => (
                  <div key={m.id} className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-2xs font-bold text-emerald-400" title={`${m.name} (${ROLE_LABELS[m.role]})`}>
                    {m.name.charAt(0)}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <GradientButton size="sm" className="w-full" leftIcon={<Users2 size={12} />} onClick={() => onAssignClick?.(item)}>
              Atribuir Trio
            </GradientButton>
          )}
        </div>
      </div>
    </GlassCard>
  );
}

// ─── List View ──────────────────────────────────────────────────────────────────

function CoordListView({ handoffs, onCardClick, onAssignClick }: {
  handoffs: CoordHandoff[]; onCardClick: (i: CoordHandoff) => void; onAssignClick: (i: CoordHandoff) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs text-text-muted font-medium uppercase tracking-wider">
        <div className="col-span-3">Cliente</div>
        <div className="col-span-2">Segmento</div>
        <div className="col-span-2">Encaminhado por</div>
        <div className="col-span-2">Trio</div>
        <div className="col-span-2">Status</div>
        <div className="col-span-1">Ações</div>
      </div>
      {handoffs.map((item, i) => (
        <motion.div key={item.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
          <GlassCard padding="sm" className="grid grid-cols-12 gap-4 items-center">
            <div className="col-span-3">
              <p className="text-sm font-medium text-text-primary">{item.clientName}</p>
              <p className="text-2xs text-text-muted">{new Date(item.receivedAt).toLocaleDateString('pt-BR')}</p>
            </div>
            <div className="col-span-2"><span className="text-xs text-text-secondary">{item.segment}</span></div>
            <div className="col-span-2"><span className="text-xs text-text-secondary">{item.forwardedBy}</span></div>
            <div className="col-span-2">
              {item.assignedTrio ? (
                <span className="text-2xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 font-medium">{item.assignedTrio.name}</span>
              ) : (
                <span className="text-2xs text-text-muted">—</span>
              )}
            </div>
            <div className="col-span-2">
              <span className={cn('text-2xs px-2 py-0.5 rounded-full border font-medium', item.status === 'received' ? 'bg-amber-500/15 text-amber-400 border-amber-500/25' : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25')}>
                {item.status === 'received' ? 'Recebido' : 'Atribuído'}
              </span>
            </div>
            <div className="col-span-1 flex gap-1">
              <button onClick={() => onCardClick(item)} className="p-1.5 rounded-lg text-text-muted hover:text-galaxy-blue-light hover:bg-galaxy-blue/10 transition-all" title="Ver handoff">
                <Eye size={14} />
              </button>
              {item.status === 'received' && (
                <button onClick={() => onAssignClick(item)} className="p-1.5 rounded-lg text-text-muted hover:text-galaxy-pink-light hover:bg-galaxy-pink/10 transition-all" title="Atribuir trio">
                  <Users2 size={14} />
                </button>
              )}
            </div>
          </GlassCard>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Detail Modal ───────────────────────────────────────────────────────────────

function CoordDetailModal({ item, onClose, onAssign }: { item: CoordHandoff; onClose: () => void; onAssign: () => void }) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<'spiced' | 'transcript'>('spiced');

  return (
    <motion.div ref={backdropRef} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={(e) => e.target === backdropRef.current && onClose()}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="w-full max-w-3xl max-h-[85vh] overflow-hidden rounded-3xl glass-card-strong flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-glass-border">
          <div>
            <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <FileText size={20} className="text-galaxy-blue-light" />
              Handoff — {item.clientName}
            </h2>
            <p className="text-xs text-text-muted mt-0.5">Encaminhado por {item.forwardedBy} em {new Date(item.receivedAt).toLocaleDateString('pt-BR')}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-text-muted hover:text-text-primary transition-all"><X size={18} /></button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <InfoField icon={<User size={14} />} label="Stakeholder" value={item.stakeholderName ?? '—'} />
            <InfoField icon={<Building2 size={14} />} label="Razão Social" value={item.razaoSocial ?? '—'} />
            <InfoField icon={<Shield size={14} />} label="CNPJ" value={item.cnpj ?? '—'} />
            <InfoField icon={<Calendar size={14} />} label="Segmento" value={item.segment} />
          </div>

          {(item.recordingUrl || item.contractUrl) && (
            <div className="flex gap-3">
              {item.recordingUrl && <a href={item.recordingUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-galaxy-blue-light hover:underline"><ChevronRight size={12} /> Gravação</a>}
              {item.contractUrl && <a href={item.contractUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-galaxy-pink-light hover:underline"><ChevronRight size={12} /> Contrato</a>}
            </div>
          )}

          <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-glass-border w-fit">
            <button onClick={() => setTab('spiced')} className={cn('px-4 py-1.5 rounded-lg text-xs font-medium transition-all', tab === 'spiced' ? 'bg-galaxy-blue/15 text-galaxy-blue-light' : 'text-text-muted hover:text-text-primary')}>Relatório SPICED</button>
            <button onClick={() => setTab('transcript')} className={cn('px-4 py-1.5 rounded-lg text-xs font-medium transition-all', tab === 'transcript' ? 'bg-galaxy-blue/15 text-galaxy-blue-light' : 'text-text-muted hover:text-text-primary')}>Transcrição</button>
          </div>

          {tab === 'spiced' && item.spicedReport ? (
            <div className="space-y-4">
              <SpicedSection title="Resumo Executivo" content={item.spicedReport.executiveSummary} highlight />
              <SpicedSection title="S — Situação" content={item.spicedReport.situation} letter="S" color="text-amber-400" />
              <SpicedSection title="P — Dor (Pain)" content={item.spicedReport.pain} letter="P" color="text-red-400" />
              <SpicedSection title="I — Impacto" content={item.spicedReport.impact} letter="I" color="text-emerald-400" />
              <SpicedSection title="C — Evento Crítico" content={item.spicedReport.criticalEvent} letter="C" color="text-galaxy-blue-light" />
              <SpicedSection title="E/D — Decisão" content={item.spicedReport.decision} letter="D" color="text-galaxy-purple" />
              <SpicedSection title="Escopo Contratado" content={item.spicedReport.contractedScope} highlight />
            </div>
          ) : (
            <div className="rounded-xl bg-white/[0.02] border border-glass-border p-4">
              <p className="text-sm text-text-secondary whitespace-pre-wrap leading-relaxed">{item.transcript ?? 'Nenhuma transcrição.'}</p>
            </div>
          )}

          {item.assignedTrio && (
            <div className="rounded-xl bg-emerald-500/[0.05] border border-emerald-500/20 p-4">
              <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2"><UserCheck size={14} /> Trio Atribuído — {item.assignedTrio.name}</h4>
              <div className="space-y-2">
                {item.assignedTrio.members.map((m) => (
                  <div key={m.id} className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2.5">
                      <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-2xs font-bold border', ROLE_COLORS[m.role])}>{m.name.charAt(0)}</div>
                      <span className="text-sm text-text-primary">{m.name}</span>
                    </div>
                    <span className={cn('text-2xs px-2 py-0.5 rounded-full border font-medium', ROLE_COLORS[m.role])}>{ROLE_LABELS[m.role]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-glass-border">
          {item.status === 'received' ? (
            <GradientButton className="w-full" leftIcon={<Users2 size={16} />} onClick={onAssign}>
              Atribuir a um Trio
            </GradientButton>
          ) : (
            <div className="flex items-center justify-center gap-2 text-sm text-emerald-400">
              <CheckCircle2 size={16} />
              <span>Atribuído ao {item.assignedTrio?.name}</span>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Trio Select Modal ──────────────────────────────────────────────────────────

function TrioSelectModal({ item, trios, sharedTech, onAssign, onClose }: {
  item: CoordHandoff; trios: Trio[]; sharedTech: TrioMember;
  onAssign: (itemId: string, trio: Trio, driveFolderUrl?: string) => void; onClose: () => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [driveFolderUrl, setDriveFolderUrl] = useState('');
  const [driveConnecting, setDriveConnecting] = useState(false);
  const [driveConnected, setDriveConnected] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);
  const selectedTrio = trios.find((t) => t.id === selected);

  const canSubmit = selectedTrio && driveConnected;

  async function connectDrive() {
    if (!driveFolderUrl.trim()) return;
    setDriveConnecting(true);
    // Simulate connection verification
    await new Promise(r => setTimeout(r, 1500));
    setDriveConnected(true);
    setDriveConnecting(false);
  }

  return (
    <motion.div ref={backdropRef} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={(e) => e.target === backdropRef.current && onClose()}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="w-full max-w-lg rounded-3xl glass-card-strong overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-glass-border">
          <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
            <Users2 size={18} className="text-galaxy-blue-light" />
            Atribuir Trio — {item.clientName}
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-text-muted hover:text-text-primary transition-all"><X size={16} /></button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-5">
          {/* Step 1: Connect Drive */}
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-2 flex items-center gap-2">
              <FolderOpen size={14} className="text-amber-400" />
              1. Conectar Pasta do Drive *
            </h3>
            <p className="text-xs text-text-muted mb-3">
              Conecte a pasta do Google Drive do cliente para a plataforma extrair transcrições de kick-offs e check-ins automaticamente.
            </p>

            {driveConnected ? (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle2 size={16} className="text-emerald-400" />
                <span className="text-sm text-emerald-400 font-medium">Pasta conectada com sucesso</span>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  value={driveFolderUrl}
                  onChange={e => setDriveFolderUrl(e.target.value)}
                  placeholder="https://drive.google.com/drive/folders/..."
                  className="flex-1 bg-white/[0.03] border border-glass-border rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-galaxy-blue/40 transition-all"
                />
                <button
                  onClick={connectDrive}
                  disabled={!driveFolderUrl.trim() || driveConnecting}
                  className={cn(
                    'px-4 py-2.5 rounded-xl text-xs font-medium flex items-center gap-2 transition-all',
                    driveFolderUrl.trim() && !driveConnecting
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25'
                      : 'bg-white/[0.03] text-text-muted border border-glass-border cursor-not-allowed'
                  )}
                >
                  {driveConnecting ? <Loader2 size={12} className="animate-spin" /> : <Link2 size={12} />}
                  Conectar
                </button>
              </div>
            )}
          </div>

          {/* Step 2: Select Trio */}
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-2 flex items-center gap-2">
              <Users2 size={14} className="text-galaxy-blue-light" />
              2. Selecionar Trio *
            </h3>

            <div className="space-y-3">
              {trios.map((trio) => (
                <button
                  key={trio.id}
                  onClick={() => setSelected(trio.id)}
                  className={cn(
                    'w-full text-left px-4 py-4 rounded-xl border transition-all',
                    selected === trio.id
                      ? 'border-galaxy-blue/40 bg-galaxy-blue/10 shadow-glow-blue-sm'
                      : 'border-glass-border hover:border-glass-border-strong hover:bg-white/[0.03]'
                  )}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-text-primary">{trio.name}</span>
                    {selected === trio.id && <CheckCircle2 size={16} className="text-galaxy-blue-light" />}
                  </div>
                  <div className="space-y-2">
                    {trio.members.map((m) => (
                      <div key={m.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={cn('w-6 h-6 rounded-full flex items-center justify-center text-2xs font-bold border', ROLE_COLORS[m.role])}>
                            {m.name.charAt(0)}
                          </div>
                          <span className="text-xs text-text-primary">{m.name}</span>
                        </div>
                        <span className={cn('text-2xs px-1.5 py-0.5 rounded-full border', ROLE_COLORS[m.role])}>{ROLE_LABELS[m.role]}</span>
                      </div>
                    ))}
                  </div>
                </button>
              ))}
            </div>

            {/* Shared tech */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.02] border border-glass-border mt-3">
              <div className={cn('w-6 h-6 rounded-full flex items-center justify-center text-2xs font-bold border', ROLE_COLORS.tech_crm)}>J</div>
              <span className="text-xs text-text-secondary">{sharedTech.name}</span>
              <span className="text-2xs text-text-muted ml-auto">Compartilhado entre trios</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-glass-border">
          {!driveConnected && (
            <p className="text-2xs text-amber-400 mb-3 flex items-center gap-1.5">
              <AlertTriangle size={12} />
              Conecte a pasta do Drive antes de atribuir o trio
            </p>
          )}
          <GradientButton
            className="w-full"
            disabled={!canSubmit}
            leftIcon={<Send size={14} />}
            onClick={() => selectedTrio && onAssign(item.id, selectedTrio, driveFolderUrl)}
          >
            {!driveConnected ? 'Conecte o Drive primeiro' : selectedTrio ? `Atribuir ao ${selectedTrio.name}` : 'Selecione um trio'}
          </GradientButton>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Shared Components ──────────────────────────────────────────────────────────

function InfoField({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/[0.02] border border-glass-border p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-text-muted">{icon}</span>
        <span className="text-2xs text-text-muted uppercase tracking-wider font-medium">{label}</span>
      </div>
      <p className="text-sm text-text-primary font-medium">{value}</p>
    </div>
  );
}

function SpicedSection({ title, content, letter, color, highlight }: { title: string; content: string; letter?: string; color?: string; highlight?: boolean }) {
  return (
    <div className={cn('rounded-xl border p-4', highlight ? 'bg-galaxy-blue/[0.05] border-galaxy-blue/20' : 'bg-white/[0.02] border-glass-border')}>
      <h4 className="text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-2">
        {letter && <span className={cn('w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold bg-white/5', color)}>{letter}</span>}
        <span className={highlight ? 'text-galaxy-blue-light' : 'text-text-muted'}>{title}</span>
      </h4>
      <p className="text-sm text-text-secondary leading-relaxed">{content}</p>
    </div>
  );
}
