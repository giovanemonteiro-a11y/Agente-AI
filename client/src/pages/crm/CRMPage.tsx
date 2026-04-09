import { useState, useCallback, useEffect, useRef } from 'react';
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
  Kanban, List, Clock, CheckCircle2, AlertCircle, Send, Eye, GripVertical,
  X, FileText, User, Calendar, Building2, Shield, ChevronRight, Check,
  AlertTriangle, UserCheck, Users,
} from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { GradientButton } from '@/components/shared/GradientButton';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useNotificationStore } from '@/store/notificationStore';
import { api } from '@/lib/api';

// ─── Types ──────────────────────────────────────────────────────────────────────

type HandoffStatus = 'pending_review' | 'approved_partial' | 'approved_all' | 'forwarded';

interface Approval {
  userId: string;
  userName: string;
  approved: boolean;
  approvedAt?: string;
}

interface HandoffItem {
  id: string;
  clientName: string;
  segment: string;
  createdBy: string;
  createdAt: string;
  status: HandoffStatus;
  approvals: Approval[];
  totalLeaders: number;
  forwardedTo?: string;
  forwardedBy?: string;
  // Handoff content
  transcript?: string;
  recordingUrl?: string;
  contractUrl?: string;
  stakeholderName?: string;
  cnpj?: string;
  razaoSocial?: string;
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

interface Coordinator {
  id: string;
  name: string;
  email: string;
}

// ─── Mock Data ──────────────────────────────────────────────────────────────────

const MOCK_COORDINATORS: Coordinator[] = [
  { id: 'coord-1', name: 'Ester Prudêncio', email: 'ester.prudencio@v4company.com' },
];

const INITIAL_HANDOFFS: HandoffItem[] = [
  {
    id: 'h1',
    clientName: 'Empresa Alpha Tech',
    segment: 'Tecnologia',
    createdBy: 'Sandro Notari',
    createdAt: '2026-03-24',
    status: 'pending_review',
    approvals: [
      { userId: 'u-bruno', userName: 'Bruno', approved: false },
      { userId: 'u-bruna', userName: 'Bruna', approved: false },
      { userId: 'u-gerson', userName: 'Gerson', approved: false },
    ],
    totalLeaders: 3,
    stakeholderName: 'Carlos Silva',
    razaoSocial: 'Alpha Tech Soluções Ltda',
    cnpj: '12.345.678/0001-90',
    transcript: 'Reunião de venda realizada em 24/03/2026. O cliente busca uma solução completa de marketing digital para aumentar a presença online da empresa, que atua no segmento de tecnologia B2B. Atualmente investem R$ 5.000/mês em mídia paga com resultados abaixo do esperado. Desejam reestruturar toda a estratégia de aquisição, incluindo tráfego pago, social media e criação de landing pages para geração de leads qualificados. O stakeholder Carlos Silva é o CEO e tomador de decisão direto.',
    recordingUrl: 'https://drive.google.com/file/example-alpha-tech',
    contractUrl: 'https://drive.google.com/file/contrato-alpha-tech',
    spicedReport: {
      executiveSummary: 'A Empresa Alpha Tech busca reestruturar sua estratégia de marketing digital para aumentar a geração de leads B2B qualificados, com investimento atual de R$ 5.000/mês em mídia paga sem resultados satisfatórios.',
      situation: 'Empresa de tecnologia B2B com 5 anos de mercado, equipe de 30 pessoas. Atualmente utiliza Google Ads sem gestão profissional, sem presença em redes sociais e com site desatualizado. Faturamento mensal de R$ 200k.',
      pain: 'ROI negativo em mídia paga, leads desqualificados, custo por aquisição de cliente muito alto (R$ 2.500), sem previsibilidade de vendas pelo digital.',
      impact: 'Com estratégia estruturada, projetamos redução de 60% no CPA e aumento de 3x na geração de leads qualificados em 6 meses. Potencial de R$ 150k em novos contratos mensais.',
      criticalEvent: 'O CEO deseja iniciar a nova estratégia antes do Q2 2026 para coincidir com o lançamento de um novo produto SaaS. Prazo limite: abril/2026.',
      decision: 'CEO Carlos Silva é o tomador de decisão direto. Não há comitê. Orçamento aprovado internamente para até R$ 15.000/mês em marketing. Decisão final prevista para primeira semana de abril.',
      contractedScope: 'Gestão de Tráfego Pago (Google Ads + Meta Ads), Social Media (Instagram + LinkedIn), Criação de Landing Pages, Relatórios Mensais de Performance.',
    },
  },
  {
    id: 'h2',
    clientName: 'Moda Nova Brasil',
    segment: 'Moda',
    createdBy: 'Sandro Notari',
    createdAt: '2026-03-22',
    status: 'approved_partial',
    approvals: [
      { userId: 'u-bruno', userName: 'Bruno', approved: true, approvedAt: '2026-03-23T10:00:00Z' },
      { userId: 'u-bruna', userName: 'Bruna', approved: false },
      { userId: 'u-gerson', userName: 'Gerson', approved: true, approvedAt: '2026-03-23T11:30:00Z' },
    ],
    totalLeaders: 3,
    stakeholderName: 'Ana Beatriz',
    razaoSocial: 'Moda Nova Brasil Ltda',
    cnpj: '98.765.432/0001-10',
    transcript: 'Reunião com Ana Beatriz da Moda Nova Brasil. E-commerce de moda feminina que fatura R$ 80k/mês. Busca escalar vendas para R$ 200k/mês com tráfego pago e social media.',
    spicedReport: {
      executiveSummary: 'E-commerce de moda feminina busca triplicar faturamento em 6 meses através de estratégia integrada de tráfego e social media.',
      situation: 'E-commerce ativo com 2 anos, faturamento R$ 80k/mês, 15k seguidores no Instagram, ROAS atual de 2.5x.',
      pain: 'Crescimento estagnado, dependência de tráfego pago sem diversificação, falta de conteúdo orgânico estratégico.',
      impact: 'Projeção de ROAS 5x e faturamento R$ 200k/mês em 6 meses com estratégia integrada.',
      criticalEvent: 'Black Friday 2026 como meta para estar com a operação a pleno vapor.',
      decision: 'Ana Beatriz é sócia e tomadora de decisão. Orçamento de R$ 20.000/mês para marketing.',
      contractedScope: 'Social Media, Gestão de Tráfego Pago, E-commerce Strategy, Criativos de Campanha.',
    },
  },
  {
    id: 'h3',
    clientName: 'Saúde Total Clínicas',
    segment: 'Saúde',
    createdBy: 'Sandro Notari',
    createdAt: '2026-03-20',
    status: 'approved_all',
    approvals: [
      { userId: 'u-bruno', userName: 'Bruno', approved: true, approvedAt: '2026-03-21T09:00:00Z' },
      { userId: 'u-bruna', userName: 'Bruna', approved: true, approvedAt: '2026-03-21T14:00:00Z' },
      { userId: 'u-gerson', userName: 'Gerson', approved: true, approvedAt: '2026-03-22T08:00:00Z' },
    ],
    totalLeaders: 3,
    stakeholderName: 'Dr. Roberto Almeida',
    razaoSocial: 'Saúde Total Clínicas ME',
    cnpj: '11.222.333/0001-44',
    transcript: 'Clínica médica com 3 unidades busca presença digital para atrair novos pacientes.',
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
    id: 'h4',
    clientName: 'Fit Pro Academia',
    segment: 'Saúde e Fitness',
    createdBy: 'Sandro Notari',
    createdAt: '2026-03-18',
    status: 'pending_review',
    approvals: [
      { userId: 'u-bruno', userName: 'Bruno', approved: true, approvedAt: '2026-03-19T10:00:00Z' },
      { userId: 'u-bruna', userName: 'Bruna', approved: false },
      { userId: 'u-gerson', userName: 'Gerson', approved: false },
    ],
    totalLeaders: 3,
    stakeholderName: 'Lucas Ferreira',
    razaoSocial: 'Fit Pro Academias Eireli',
    cnpj: '55.666.777/0001-88',
    transcript: 'Academia premium busca estratégia digital para aumentar matrículas e retenção.',
    spicedReport: {
      executiveSummary: 'Academia premium busca aumentar matrículas mensais de 30 para 80 com marketing digital.',
      situation: 'Academia com 2 unidades, 500 alunos ativos, taxa de churn de 8%/mês.',
      pain: 'Apenas 30 novas matrículas/mês, meta é 80. Marketing atual é apenas panfletagem.',
      impact: 'Com estratégia digital, projeção de 80 matrículas/mês e redução de churn para 4%.',
      criticalEvent: 'Janeiro/2027 é o pico sazonal - precisa estar operando antes.',
      decision: 'Lucas é sócio único. Orçamento R$ 8.000/mês.',
      contractedScope: 'Social Media, Tráfego Pago, Branding, Criativos.',
    },
  },
];

// ─── Column Config ──────────────────────────────────────────────────────────────

interface ColumnConfig {
  id: HandoffStatus;
  title: string;
  icon: React.ReactNode;
  color: string;
  borderColor: string;
  bgColor: string;
  dropBgColor: string;
}

const KANBAN_COLUMNS: ColumnConfig[] = [
  {
    id: 'pending_review',
    title: 'Aguardando Aprovação',
    icon: <Clock size={16} />,
    color: 'text-amber-400',
    borderColor: 'border-amber-500/30',
    bgColor: 'bg-amber-500/[0.03]',
    dropBgColor: 'bg-amber-500/[0.08]',
  },
  {
    id: 'approved_partial',
    title: 'Aprovação Parcial',
    icon: <AlertCircle size={16} />,
    color: 'text-galaxy-blue-light',
    borderColor: 'border-galaxy-blue/30',
    bgColor: 'bg-galaxy-blue/[0.03]',
    dropBgColor: 'bg-galaxy-blue/[0.08]',
  },
  {
    id: 'approved_all',
    title: 'Todos Aprovaram',
    icon: <CheckCircle2 size={16} />,
    color: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
    bgColor: 'bg-emerald-500/[0.03]',
    dropBgColor: 'bg-emerald-500/[0.08]',
  },
  {
    id: 'forwarded',
    title: 'Encaminhado',
    icon: <Send size={16} />,
    color: 'text-galaxy-pink-light',
    borderColor: 'border-galaxy-pink/30',
    bgColor: 'bg-galaxy-pink/[0.03]',
    dropBgColor: 'bg-galaxy-pink/[0.08]',
  },
];

// ─── Helpers ────────────────────────────────────────────────────────────────────

function computeStatus(item: HandoffItem): HandoffStatus {
  if (item.status === 'forwarded') return 'forwarded';
  const allApproved = item.approvals.every((a) => a.approved);
  const someApproved = item.approvals.some((a) => a.approved);
  if (allApproved) return 'approved_all';
  if (someApproved) return 'approved_partial';
  return 'pending_review';
}

// ─── API → HandoffItem mapper ────────────────────────────────────────────────────

function mapStatusFromApi(apiStatus: string): HandoffStatus {
  const map: Record<string, HandoffStatus> = {
    sent_to_leadership: 'pending_review',
    approved_partial: 'approved_partial',
    approved_all: 'approved_all',
    forwarded_to_coordinator: 'forwarded',
  };
  return map[apiStatus] ?? 'pending_review';
}

function mapApiToHandoff(raw: Record<string, unknown>): HandoffItem {
  const approvals = (raw.approvals as Record<string, unknown>[]) ?? [];
  return {
    id: raw.id as string,
    clientName: (raw.company_name as string) ?? 'Cliente sem nome',
    segment: '',
    createdBy: 'Aquisição',
    createdAt: raw.created_at as string,
    status: mapStatusFromApi(raw.status as string),
    approvals: approvals.map((a) => ({
      userId: a.user_id as string,
      userName: ((a.email as string) ?? '').split('@')[0],
      approved: true,
      approvedAt: a.approved_at as string,
    })),
    totalLeaders: 3, // Will be updated dynamically
    stakeholderName: (() => {
      const stk = raw.stakeholders ?? [];
      if (!Array.isArray(stk) || stk.length === 0) return '';
      const first = stk[0];
      return typeof first === 'string' ? first : (first as { name?: string }).name ?? '';
    })(),
    razaoSocial: raw.razao_social as string,
    cnpj: '',
    transcript: raw.transcript as string,
    recordingUrl: raw.recording_url as string,
    contractUrl: raw.contract_url as string,
    spicedReport: raw.spiced_report as HandoffItem['spicedReport'],
  };
}

// ─── Main Component ─────────────────────────────────────────────────────────────

export function CRMPage() {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [handoffs, setHandoffs] = useState<HandoffItem[]>(INITIAL_HANDOFFS);
  const [coordinators, setCoordinators] = useState<Coordinator[]>(MOCK_COORDINATORS);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loadingApi, setLoadingApi] = useState(true);

  // Modals
  const [detailItem, setDetailItem] = useState<HandoffItem | null>(null);
  const [forwardItem, setForwardItem] = useState<HandoffItem | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Pending drag that requires approval first
  const [pendingDrag, setPendingDrag] = useState<{ itemId: string; targetCol: HandoffStatus } | null>(null);

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
        // Fetch handoffs from API
        const res = await api.get<{ data: Record<string, unknown>[] }>('/handoffs/leadership');
        const apiHandoffs = (res.data.data ?? []).map(mapApiToHandoff);

        if (!cancelled) {
          // Merge: API handoffs first, then mocks that don't clash
          const apiIds = new Set(apiHandoffs.map(h => h.id));
          const merged = [
            ...apiHandoffs,
            ...INITIAL_HANDOFFS.filter(m => !apiIds.has(m.id)),
          ];
          setHandoffs(merged);
        }

        // Fetch coordinators
        const coordRes = await api.get<{ data: Record<string, unknown>[] }>('/users?role=coordenador');
        if (!cancelled && coordRes.data.data?.length) {
          setCoordinators(coordRes.data.data.map((u: Record<string, unknown>) => ({
            id: u.id as string,
            name: u.name as string,
            email: u.email as string,
          })));
        }
      } catch {
        // Keep mock data on API failure
      } finally {
        if (!cancelled) setLoadingApi(false);
      }
    }
    fetchData();
    // Poll every 15s for updates
    const interval = setInterval(fetchData, 15000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  // Clear error after 3s
  useEffect(() => {
    if (!errorMessage) return;
    const t = setTimeout(() => setErrorMessage(null), 4000);
    return () => clearTimeout(t);
  }, [errorMessage]);

  // Map current user to an approval userId (mock mapping)
  const currentApprovalId = user?.name?.toLowerCase().includes('bruno')
    ? 'u-bruno'
    : user?.name?.toLowerCase().includes('bruna')
    ? 'u-bruna'
    : user?.name?.toLowerCase().includes('gerson')
    ? 'u-gerson'
    : 'u-bruno'; // fallback for super_admin

  // ── Approval Logic ──────────────────────────────────────────────────────────

  function handleApprove(itemId: string) {
    // Call API to approve
    api.patch(`/handoffs/${itemId}/approve`).catch(() => {});

    setHandoffs((prev) => {
      const updated = prev.map((h) => {
        if (h.id !== itemId) return h;
        const newApprovals = h.approvals.map((a) =>
          a.userId === currentApprovalId
            ? { ...a, approved: true, approvedAt: new Date().toISOString() }
            : a
        );
        const newItem = { ...h, approvals: newApprovals };
        newItem.status = computeStatus(newItem);
        return newItem;
      });
      return updated;
    });

    // If there was a pending drag, check if we can complete it
    if (pendingDrag && pendingDrag.itemId === itemId) {
      setTimeout(() => {
        setHandoffs((prev) => {
          const item = prev.find((h) => h.id === itemId);
          if (!item) return prev;
          const computed = computeStatus(item);
          setPendingDrag(null);
          return prev.map((h) => (h.id === itemId ? { ...h, status: computed } : h));
        });
      }, 300);
    }

    setDetailItem(null);
  }

  // ── Forward Logic ───────────────────────────────────────────────────────────

  function handleForward(itemId: string, coordinator: Coordinator) {
    // Call API to forward
    api.post(`/handoffs/${itemId}/forward`, { coordinator_id: coordinator.id }).catch(() => {});

    setHandoffs((prev) =>
      prev.map((h) =>
        h.id === itemId
          ? { ...h, status: 'forwarded' as HandoffStatus, forwardedTo: coordinator.name, forwardedBy: user?.name ?? '' }
          : h
      )
    );

    // Notify coordinator via bell
    const addNotif = useNotificationStore.getState().addNotification;
    addNotif({
      id: `notif-forward-${itemId}-${Date.now()}`,
      type: 'handoff:forwarded',
      title: `Novo handoff: ${item?.clientName ?? 'Cliente'}`,
      message: `O handoff de ${item?.clientName} foi encaminhado para você por ${user?.name ?? 'Liderança'}. Acesse seu CRM para atribuir a um trio.`,
      created_at: new Date().toISOString(),
    });

    // Notify other leaders
    const leaders = item?.approvals.filter((a) => a.userId !== currentApprovalId) ?? [];
    leaders.forEach((leader) => {
      addNotif({
        id: `notif-fwd-leader-${leader.userId}-${Date.now()}`,
        type: 'handoff:forwarded',
        title: `Handoff encaminhado: ${item?.clientName ?? 'Cliente'}`,
        message: `${item?.clientName} foi encaminhado para ${coordinator.name} por ${user?.name ?? 'Liderança'}.`,
        created_at: new Date().toISOString(),
      });
    });

    setForwardItem(null);
  }

  // ── Drag Validation ─────────────────────────────────────────────────────────

  function validateColumnTransition(item: HandoffItem, targetCol: HandoffStatus): boolean {
    // Same column reorder = always ok
    if (item.status === targetCol) return true;

    // Already forwarded = can't move back
    if (item.status === 'forwarded') {
      setErrorMessage('Handoff já foi encaminhado e não pode ser movido.');
      return false;
    }

    const allApproved = item.approvals.every((a) => a.approved);
    const currentUserApproved = item.approvals.find((a) => a.userId === currentApprovalId)?.approved ?? false;

    // Moving FROM pending_review or approved_partial
    if (item.status === 'pending_review' || item.status === 'approved_partial') {
      // Must read + approve first
      if (!currentUserApproved) {
        setDetailItem(item);
        setPendingDrag({ itemId: item.id, targetCol });
        return false;
      }

      // Trying to go to approved_all but not all approved
      if ((targetCol === 'approved_all' || targetCol === 'forwarded') && !allApproved) {
        setErrorMessage(`Aguardando aprovação de todos os líderes. ${item.approvals.filter((a) => !a.approved).map((a) => a.userName).join(', ')} ainda não aprovaram.`);
        return false;
      }
    }

    // Trying to go to forwarded
    if (targetCol === 'forwarded') {
      if (!allApproved) {
        setErrorMessage('Todos os líderes precisam aprovar antes de encaminhar.');
        return false;
      }
      // Must select coordinator
      setForwardItem(item);
      return false;
    }

    return true;
  }

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);
      if (!over) return;

      const draggedItem = handoffs.find((h) => h.id === active.id);
      if (!draggedItem) return;

      // Determine target column
      let targetColumn: HandoffStatus | undefined;
      if (KANBAN_COLUMNS.some((c) => c.id === over.id)) {
        targetColumn = over.id as HandoffStatus;
      } else {
        const overItem = handoffs.find((h) => h.id === over.id);
        if (overItem) targetColumn = overItem.status;
      }

      if (!targetColumn) return;

      // Same column = reorder only
      if (draggedItem.status === targetColumn) {
        const colItems = handoffs.filter((h) => h.status === targetColumn);
        const oldIndex = colItems.findIndex((h) => h.id === active.id);
        const newIndex = colItems.findIndex((h) => h.id === over.id);
        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          const reordered = arrayMove(colItems, oldIndex, newIndex);
          const otherItems = handoffs.filter((h) => h.status !== targetColumn);
          setHandoffs([...otherItems, ...reordered]);
        }
        return;
      }

      // Cross-column = validate
      if (!validateColumnTransition(draggedItem, targetColumn)) return;

      // Valid transition
      setHandoffs((prev) =>
        prev.map((h) => (h.id === active.id ? { ...h, status: targetColumn! } : h))
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [handoffs, currentApprovalId]
  );

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
  }, []);

  // ── Card click handler (open handoff detail) ────────────────────────────────

  function handleCardClick(item: HandoffItem) {
    setDetailItem(item);
  }

  function handleForwardClick(item: HandoffItem) {
    if (!item.approvals.every((a) => a.approved)) {
      setErrorMessage('Todos os líderes precisam aprovar antes de encaminhar.');
      return;
    }
    setForwardItem(item);
  }

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
            <Kanban size={24} className="text-galaxy-pink-light" />
            CRM — Handoffs
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Gerencie os handoffs recebidos da aquisição
          </p>
        </div>
        <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-glass-border">
          <button
            onClick={() => setViewMode('kanban')}
            className={cn(
              'p-2 rounded-lg transition-all',
              viewMode === 'kanban' ? 'bg-galaxy-blue/15 text-galaxy-blue-light' : 'text-text-muted hover:text-text-primary'
            )}
            title="Kanban"
          >
            <Kanban size={16} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              'p-2 rounded-lg transition-all',
              viewMode === 'list' ? 'bg-galaxy-blue/15 text-galaxy-blue-light' : 'text-text-muted hover:text-text-primary'
            )}
            title="Lista"
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {KANBAN_COLUMNS.map((col) => {
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

      {/* Content */}
      {viewMode === 'kanban' ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="grid grid-cols-4 gap-4 min-h-[500px]">
            {KANBAN_COLUMNS.map((col) => {
              const items = handoffs.filter((h) => h.status === col.id);
              return (
                <KanbanColumn key={col.id} column={col} items={items} onCardClick={handleCardClick} onForwardClick={handleForwardClick} />
              );
            })}
          </div>
          <DragOverlay dropAnimation={{ duration: 200, easing: 'ease' }}>
            {activeItem ? (
              <div className="rotate-[2deg] scale-105 opacity-90">
                <HandoffCard item={activeItem} isDragging />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <ListView handoffs={handoffs} onCardClick={handleCardClick} onForwardClick={handleForwardClick} />
      )}

      {/* Handoff Detail Modal — Portal to body */}
      {createPortal(
        <AnimatePresence>
          {detailItem && (
            <HandoffDetailModal
              item={detailItem}
              currentApprovalId={currentApprovalId}
              onApprove={handleApprove}
              onClose={() => { setDetailItem(null); setPendingDrag(null); }}
            />
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Forward to Coordinator Modal — Portal to body */}
      {createPortal(
        <AnimatePresence>
          {forwardItem && (
            <ForwardModal
              item={forwardItem}
              coordinators={coordinators}
              onForward={handleForward}
              onClose={() => setForwardItem(null)}
            />
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}

// ─── Kanban Column ──────────────────────────────────────────────────────────────

function KanbanColumn({
  column,
  items,
  onCardClick,
  onForwardClick,
}: {
  column: ColumnConfig;
  items: HandoffItem[];
  onCardClick: (item: HandoffItem) => void;
  onForwardClick: (item: HandoffItem) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'rounded-2xl p-3 border transition-all duration-200 min-h-[400px]',
        column.borderColor,
        isOver ? column.dropBgColor : column.bgColor,
        isOver && 'ring-1 ring-white/10 scale-[1.01]'
      )}
    >
      <div className="flex items-center gap-2 mb-3 px-1">
        <span className={column.color}>{column.icon}</span>
        <span className="text-xs font-semibold text-text-secondary">{column.title}</span>
        <span className="ml-auto text-2xs font-medium text-text-muted bg-white/5 px-2 py-0.5 rounded-full">
          {items.length}
        </span>
      </div>
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {items.map((item) => (
            <SortableHandoffCard key={item.id} item={item} onCardClick={onCardClick} onForwardClick={onForwardClick} />
          ))}
        </div>
      </SortableContext>
      {items.length === 0 && (
        <div className={cn(
          'flex items-center justify-center h-32 rounded-xl border-2 border-dashed transition-colors',
          isOver ? 'border-white/20 bg-white/[0.02]' : 'border-white/5'
        )}>
          <p className="text-xs text-text-muted">
            {isOver ? 'Soltar aqui' : 'Arraste handoffs para cá'}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Sortable Card ──────────────────────────────────────────────────────────────

function SortableHandoffCard({
  item,
  onCardClick,
  onForwardClick,
}: {
  item: HandoffItem;
  onCardClick: (item: HandoffItem) => void;
  onForwardClick: (item: HandoffItem) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className={cn(isDragging && 'opacity-30')}>
      <HandoffCard
        item={item}
        dragHandleProps={{ ...attributes, ...listeners }}
        onCardClick={onCardClick}
        onForwardClick={onForwardClick}
      />
    </div>
  );
}

// ─── Handoff Card ───────────────────────────────────────────────────────────────

function HandoffCard({
  item,
  isDragging,
  dragHandleProps,
  onCardClick,
  onForwardClick,
}: {
  item: HandoffItem;
  isDragging?: boolean;
  dragHandleProps?: Record<string, unknown>;
  onCardClick?: (item: HandoffItem) => void;
  onForwardClick?: (item: HandoffItem) => void;
}) {
  const approvedCount = item.approvals.filter((a) => a.approved).length;

  return (
    <GlassCard
      padding="sm"
      className={cn(
        'transition-all group',
        isDragging ? 'shadow-glow-blue border-galaxy-blue/40 bg-bg-dark' : 'hover:border-galaxy-blue/30'
      )}
    >
      <div className="flex gap-2">
        <div
          {...dragHandleProps}
          className="flex items-center pt-0.5 cursor-grab active:cursor-grabbing text-text-muted hover:text-galaxy-blue-light transition-colors"
          title="Arrastar"
        >
          <GripVertical size={14} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <button onClick={() => onCardClick?.(item)} className="text-left min-w-0 flex-1 group/name">
              <p className="text-sm font-medium text-text-primary group-hover/name:text-galaxy-blue-light transition-colors cursor-pointer">
                {item.clientName}
              </p>
              <p className="text-2xs text-text-muted">{item.segment}</p>
            </button>
            <button
              onClick={() => onCardClick?.(item)}
              className="p-1 rounded text-text-muted hover:text-galaxy-blue-light hover:bg-galaxy-blue/10 transition-all flex-shrink-0"
              title="Ver handoff"
            >
              <Eye size={12} />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <ApprovalDots approvals={item.approvals} />
            <span className="text-2xs text-text-muted">{approvedCount}/{item.totalLeaders}</span>
          </div>
          {item.status === 'forwarded' && item.forwardedTo && (
            <div className="flex items-center gap-1.5 mt-2 text-2xs text-galaxy-pink-light">
              <Send size={10} />
              <span>Enviado para {item.forwardedTo}</span>
            </div>
          )}
          {item.status === 'approved_all' && (
            <GradientButton
              size="sm"
              className="w-full mt-3"
              leftIcon={<Send size={12} />}
              onClick={() => onForwardClick?.(item)}
            >
              Encaminhar
            </GradientButton>
          )}
        </div>
      </div>
    </GlassCard>
  );
}

// ─── List View ──────────────────────────────────────────────────────────────────

function ListView({
  handoffs,
  onCardClick,
  onForwardClick,
}: {
  handoffs: HandoffItem[];
  onCardClick: (item: HandoffItem) => void;
  onForwardClick: (item: HandoffItem) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs text-text-muted font-medium uppercase tracking-wider">
        <div className="col-span-3">Cliente</div>
        <div className="col-span-2">Segmento</div>
        <div className="col-span-2">Criado por</div>
        <div className="col-span-2">Aprovações</div>
        <div className="col-span-2">Status</div>
        <div className="col-span-1">Ações</div>
      </div>
      {handoffs.map((item, i) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.03 }}
        >
          <GlassCard padding="sm" className="grid grid-cols-12 gap-4 items-center">
            <div className="col-span-3">
              <button onClick={() => onCardClick(item)} className="text-left group/name">
                <p className="text-sm font-medium text-text-primary group-hover/name:text-galaxy-blue-light transition-colors cursor-pointer">{item.clientName}</p>
                <p className="text-2xs text-text-muted">{new Date(item.createdAt).toLocaleDateString('pt-BR')}</p>
              </button>
            </div>
            <div className="col-span-2">
              <span className="text-xs text-text-secondary">{item.segment}</span>
            </div>
            <div className="col-span-2">
              <span className="text-xs text-text-secondary">{item.createdBy}</span>
            </div>
            <div className="col-span-2">
              <ApprovalDots approvals={item.approvals} />
            </div>
            <div className="col-span-2">
              <StatusBadge status={item.status} />
            </div>
            <div className="col-span-1 flex gap-1">
              <button
                onClick={() => onCardClick(item)}
                className="p-1.5 rounded-lg text-text-muted hover:text-galaxy-blue-light hover:bg-galaxy-blue/10 transition-all"
                title="Ver handoff"
              >
                <Eye size={14} />
              </button>
              {item.status === 'approved_all' && (
                <button
                  onClick={() => onForwardClick(item)}
                  className="p-1.5 rounded-lg text-text-muted hover:text-galaxy-pink-light hover:bg-galaxy-pink/10 transition-all"
                  title="Encaminhar"
                >
                  <Send size={14} />
                </button>
              )}
            </div>
          </GlassCard>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Handoff Detail Modal ───────────────────────────────────────────────────────

function HandoffDetailModal({
  item,
  currentApprovalId,
  onApprove,
  onClose,
}: {
  item: HandoffItem;
  currentApprovalId: string;
  onApprove: (itemId: string) => void;
  onClose: () => void;
}) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'spiced' | 'transcript'>('spiced');

  const currentUserApproval = item.approvals.find((a) => a.userId === currentApprovalId);
  const hasApproved = currentUserApproval?.approved ?? false;

  return (
    <motion.div
      ref={backdropRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => e.target === backdropRef.current && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-3xl max-h-[85vh] overflow-hidden rounded-3xl glass-card-strong flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-glass-border">
          <div>
            <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <FileText size={20} className="text-galaxy-blue-light" />
              Handoff — {item.clientName}
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              Criado por {item.createdBy} em {new Date(item.createdAt).toLocaleDateString('pt-BR')}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-text-muted hover:text-text-primary transition-all">
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Project Info */}
          <div className="grid grid-cols-2 gap-4">
            <InfoField icon={<User size={14} />} label="Stakeholder" value={item.stakeholderName ?? '—'} />
            <InfoField icon={<Building2 size={14} />} label="Razão Social" value={item.razaoSocial ?? '—'} />
            <InfoField icon={<Shield size={14} />} label="CNPJ" value={item.cnpj ?? '—'} />
            <InfoField icon={<Calendar size={14} />} label="Segmento" value={item.segment} />
          </div>

          {/* Links */}
          {(item.recordingUrl || item.contractUrl) && (
            <div className="flex gap-3">
              {item.recordingUrl && (
                <a href={item.recordingUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-galaxy-blue-light hover:underline">
                  <ChevronRight size={12} /> Gravação de Venda
                </a>
              )}
              {item.contractUrl && (
                <a href={item.contractUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-galaxy-pink-light hover:underline">
                  <ChevronRight size={12} /> Contrato
                </a>
              )}
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-glass-border w-fit">
            <button
              onClick={() => setActiveTab('spiced')}
              className={cn('px-4 py-1.5 rounded-lg text-xs font-medium transition-all',
                activeTab === 'spiced' ? 'bg-galaxy-blue/15 text-galaxy-blue-light' : 'text-text-muted hover:text-text-primary'
              )}
            >
              Relatório SPICED
            </button>
            <button
              onClick={() => setActiveTab('transcript')}
              className={cn('px-4 py-1.5 rounded-lg text-xs font-medium transition-all',
                activeTab === 'transcript' ? 'bg-galaxy-blue/15 text-galaxy-blue-light' : 'text-text-muted hover:text-text-primary'
              )}
            >
              Transcrição
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'spiced' && item.spicedReport ? (
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
              <p className="text-sm text-text-secondary whitespace-pre-wrap leading-relaxed">
                {item.transcript ?? 'Nenhuma transcrição disponível.'}
              </p>
            </div>
          )}

          {/* Approvals Status */}
          <div className="rounded-xl bg-white/[0.02] border border-glass-border p-4">
            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
              <Users size={14} /> Status de Aprovação
            </h4>
            <div className="space-y-2">
              {item.approvals.map((a) => (
                <div key={a.userId} className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-2.5">
                    <div className={cn(
                      'w-7 h-7 rounded-full flex items-center justify-center text-2xs font-bold',
                      a.approved
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-white/5 text-text-muted border border-glass-border'
                    )}>
                      {a.userName.charAt(0)}
                    </div>
                    <span className="text-sm text-text-primary">{a.userName}</span>
                  </div>
                  {a.approved ? (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                      <UserCheck size={14} />
                      <span>Aprovado</span>
                      {a.approvedAt && (
                        <span className="text-text-muted ml-1">
                          ({new Date(a.approvedAt).toLocaleDateString('pt-BR')})
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-amber-400">Pendente</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer — Approve Button */}
        <div className="px-6 py-4 border-t border-glass-border">
          {hasApproved ? (
            <div className="flex items-center justify-center gap-2 text-sm text-emerald-400">
              <Check size={16} />
              <span>Você já aprovou este handoff</span>
            </div>
          ) : (
            <GradientButton
              className="w-full"
              leftIcon={<Check size={16} />}
              onClick={() => onApprove(item.id)}
            >
              Li e aprovo este handoff
            </GradientButton>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Forward Modal ──────────────────────────────────────────────────────────────

function ForwardModal({
  item,
  coordinators,
  onForward,
  onClose,
}: {
  item: HandoffItem;
  coordinators: Coordinator[];
  onForward: (itemId: string, coordinator: Coordinator) => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  const selectedCoordinator = coordinators.find((c) => c.id === selected);

  return (
    <motion.div
      ref={backdropRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => e.target === backdropRef.current && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-md rounded-3xl glass-card-strong overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-glass-border">
          <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
            <Send size={18} className="text-galaxy-pink-light" />
            Encaminhar Handoff
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-text-muted hover:text-text-primary transition-all">
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-text-secondary">
            Selecione o(a) coordenador(a) para receber o handoff de <strong className="text-text-primary">{item.clientName}</strong>:
          </p>

          <div className="space-y-2">
            {coordinators.map((coord) => (
              <button
                key={coord.id}
                onClick={() => setSelected(coord.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left',
                  selected === coord.id
                    ? 'border-galaxy-pink/40 bg-galaxy-pink/10 shadow-glow-pink-sm'
                    : 'border-glass-border hover:border-glass-border-strong hover:bg-white/[0.03]'
                )}
              >
                <div className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold',
                  selected === coord.id
                    ? 'bg-galaxy-pink/20 text-galaxy-pink-light'
                    : 'bg-white/5 text-text-secondary'
                )}>
                  {coord.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">{coord.name}</p>
                  <p className="text-2xs text-text-muted">{coord.email}</p>
                </div>
                {selected === coord.id && (
                  <Check size={16} className="ml-auto text-galaxy-pink-light" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-glass-border">
          <GradientButton
            className="w-full"
            disabled={!selectedCoordinator}
            leftIcon={<Send size={14} />}
            onClick={() => selectedCoordinator && onForward(item.id, selectedCoordinator)}
          >
            {selectedCoordinator ? `Enviar para ${selectedCoordinator.name}` : 'Selecione um coordenador'}
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

function SpicedSection({
  title,
  content,
  letter,
  color,
  highlight,
}: {
  title: string;
  content: string;
  letter?: string;
  color?: string;
  highlight?: boolean;
}) {
  return (
    <div className={cn(
      'rounded-xl border p-4',
      highlight
        ? 'bg-galaxy-blue/[0.05] border-galaxy-blue/20'
        : 'bg-white/[0.02] border-glass-border'
    )}>
      <h4 className="text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-2">
        {letter && (
          <span className={cn('w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold bg-white/5', color)}>
            {letter}
          </span>
        )}
        <span className={highlight ? 'text-galaxy-blue-light' : 'text-text-muted'}>{title}</span>
      </h4>
      <p className="text-sm text-text-secondary leading-relaxed">{content}</p>
    </div>
  );
}

function ApprovalDots({ approvals }: { approvals: Approval[] }) {
  return (
    <div className="flex items-center gap-1.5">
      {approvals.map((a) => (
        <div
          key={a.userId}
          title={`${a.userName}: ${a.approved ? 'Aprovado' : 'Pendente'}`}
          className={cn(
            'w-6 h-6 rounded-full flex items-center justify-center text-2xs font-bold transition-all',
            a.approved
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              : 'bg-white/5 text-text-muted border border-glass-border'
          )}
        >
          {a.userName.charAt(0)}
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: HandoffStatus }) {
  const config = {
    pending_review: { label: 'Aguardando', color: 'bg-amber-500/15 text-amber-400 border-amber-500/25' },
    approved_partial: { label: 'Parcial', color: 'bg-galaxy-blue/15 text-galaxy-blue-light border-galaxy-blue/25' },
    approved_all: { label: 'Aprovado', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' },
    forwarded: { label: 'Encaminhado', color: 'bg-galaxy-pink/15 text-galaxy-pink-light border-galaxy-pink/25' },
  }[status];

  return (
    <span className={cn('text-2xs px-2 py-0.5 rounded-full border font-medium', config.color)}>
      {config.label}
    </span>
  );
}
