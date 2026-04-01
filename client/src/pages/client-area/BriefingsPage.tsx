import { useState } from 'react';
import { motion } from 'framer-motion';
import { useParams } from 'react-router-dom';
import {
  ClipboardList,
  ChevronDown,
  ChevronUp,
  Send,
  ExternalLink,
  Sparkles,
  Loader2,
  CheckCircle,
  Clock,
  MessageCircle,
} from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { GradientButton } from '@/components/shared/GradientButton';
import { PageHeader } from '@/components/shared/PageHeader';
import { ModalOverlay } from '@/components/shared/ModalOverlay';
import { useAuth } from '@/hooks/useAuth';
import {
  useBriefings,
  useGenerateBriefing,
  useSendBriefing,
  usePushToMonday,
} from '@/hooks/useBriefing';
import { useWhatsAppMessages, useExtractDemands } from '@/hooks/useWhatsApp';
import type {
  Briefing,
  BriefingType,
  DesignerScope,
  DesignerBriefing,
  TrafficBriefing,
  AccountBriefing,
  SiteBriefing,
} from '@/types/briefing';
import type { ExtractedDemand } from '@/hooks/useWhatsApp';
import { cn } from '@/lib/utils';

// ── Constants ─────────────────────────────────────────────────────────────────

const BRIEFING_TABS: { label: string; value: BriefingType | 'all' }[] = [
  { label: 'Todos', value: 'all' },
  { label: 'Designer', value: 'designer' },
  { label: 'Traffic', value: 'traffic' },
  { label: 'Account', value: 'account' },
];

const DESIGNER_SCOPES: { label: string; value: DesignerScope }[] = [
  { label: 'Social Media', value: 'social_media' },
  { label: 'Campanha', value: 'campanha' },
  { label: 'Landing Page', value: 'landing_page' },
  { label: 'Site', value: 'site' },
  { label: 'Branding', value: 'branding' },
  { label: 'MIV', value: 'miv' },
];

const TYPE_BADGE: Record<BriefingType, string> = {
  designer: 'bg-purple-500/15 text-purple-300 border border-purple-500/25',
  traffic: 'bg-galaxy-blue/15 text-galaxy-blue-light border border-galaxy-blue/25',
  account: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25',
  site: 'bg-amber-500/15 text-amber-300 border border-amber-500/25',
};

const TYPE_LABEL: Record<BriefingType, string> = {
  designer: 'Designer',
  traffic: 'Traffic Manager',
  account: 'Account',
  site: 'Site',
};

// ── Helper: format date ───────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// ── Generate modal ────────────────────────────────────────────────────────────

interface GenerateModalProps {
  open: boolean;
  onClose: () => void;
  onGenerate: (type: BriefingType, scope?: DesignerScope) => void;
  isLoading: boolean;
}

function GenerateModal({ open, onClose, onGenerate, isLoading }: GenerateModalProps) {
  const [selectedType, setSelectedType] = useState<BriefingType>('designer');
  const [selectedScope, setSelectedScope] = useState<DesignerScope>('social_media');

  const types: { label: string; value: BriefingType }[] = [
    { label: 'Designer', value: 'designer' },
    { label: 'Traffic Manager', value: 'traffic' },
    { label: 'Account', value: 'account' },
  ];

  const handleGenerate = () => {
    onGenerate(selectedType, selectedType === 'designer' ? selectedScope : undefined);
  };

  return (
    <ModalOverlay open={open} onClose={onClose} title="Gerar Briefing" maxWidth="max-w-sm">
      <div className="space-y-5">
        {/* Type selector */}
        <div className="space-y-2">
          <label className="text-sm text-text-secondary">Papel</label>
          <div className="grid grid-cols-3 gap-2">
            {types.map((t) => (
              <button
                key={t.value}
                onClick={() => setSelectedType(t.value)}
                className={cn(
                  'py-2 px-3 rounded-lg text-sm font-medium border transition-all duration-150',
                  selectedType === t.value
                    ? 'border-galaxy-blue bg-galaxy-blue/20 text-galaxy-blue-light'
                    : 'border-white/10 text-text-secondary hover:border-white/20 hover:text-text-primary'
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scope selector — only for designer */}
        {selectedType === 'designer' && (
          <div className="space-y-2">
            <label className="text-sm text-text-secondary">Escopo</label>
            <div className="grid grid-cols-2 gap-2">
              {DESIGNER_SCOPES.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setSelectedScope(s.value)}
                  className={cn(
                    'py-2 px-3 rounded-lg text-sm font-medium border transition-all duration-150',
                    selectedScope === s.value
                      ? 'border-purple-500/60 bg-purple-500/15 text-purple-300'
                      : 'border-white/10 text-text-secondary hover:border-white/20 hover:text-text-primary'
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-1">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-xl text-sm text-text-secondary border border-white/10 hover:border-white/20 transition-colors"
          >
            Cancelar
          </button>
          <GradientButton
            className="flex-1"
            onClick={handleGenerate}
            isLoading={isLoading}
            leftIcon={!isLoading ? <Sparkles size={14} /> : undefined}
          >
            Gerar
          </GradientButton>
        </div>
      </div>
    </ModalOverlay>
  );
}

// ── Designer briefing content ─────────────────────────────────────────────────

function DesignerContent({ content }: { content: DesignerBriefing }) {
  return (
    <div className="space-y-4 text-sm">
      <div>
        <p className="text-text-muted text-xs uppercase tracking-wide mb-1">Objetivo</p>
        <p className="text-text-secondary">{content.objective}</p>
      </div>
      {content.target_cohort && (
        <div>
          <p className="text-text-muted text-xs uppercase tracking-wide mb-1">Coorte-alvo</p>
          <p className="text-text-secondary">{content.target_cohort}</p>
        </div>
      )}
      {content.deliverables?.length > 0 && (
        <div>
          <p className="text-text-muted text-xs uppercase tracking-wide mb-2">Entregas</p>
          <div className="rounded-lg overflow-hidden border border-white/5">
            <table className="w-full text-xs">
              <thead className="bg-white/5">
                <tr>
                  <th className="text-left px-3 py-2 text-text-muted font-medium">Item</th>
                  <th className="text-left px-3 py-2 text-text-muted font-medium">Formato</th>
                  <th className="text-left px-3 py-2 text-text-muted font-medium">Dimensões</th>
                  <th className="text-right px-3 py-2 text-text-muted font-medium">Qtd</th>
                </tr>
              </thead>
              <tbody>
                {content.deliverables.map((d, i) => (
                  <tr key={i} className="border-t border-white/5">
                    <td className="px-3 py-2 text-text-secondary">{d.item}</td>
                    <td className="px-3 py-2 text-text-secondary">{d.format}</td>
                    <td className="px-3 py-2 text-text-secondary">{d.dimensions}</td>
                    <td className="px-3 py-2 text-text-secondary text-right">{d.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-text-muted text-xs uppercase tracking-wide mb-1">Tom Visual</p>
          <p className="text-text-secondary">{content.tone_and_style}</p>
        </div>
        <div>
          <p className="text-text-muted text-xs uppercase tracking-wide mb-1">Prazo sugerido</p>
          <p className="text-text-secondary">{content.deadline_suggestion}</p>
        </div>
      </div>
      {content.visual_references?.length > 0 && (
        <div>
          <p className="text-text-muted text-xs uppercase tracking-wide mb-1">
            Referências visuais
          </p>
          <ul className="list-disc list-inside space-y-0.5">
            {content.visual_references.map((r, i) => (
              <li key={i} className="text-text-secondary">
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}
      {content.copy_references?.length > 0 && (
        <div>
          <p className="text-text-muted text-xs uppercase tracking-wide mb-1">
            Referências de copy
          </p>
          <ul className="list-disc list-inside space-y-0.5">
            {content.copy_references.map((r, i) => (
              <li key={i} className="text-text-secondary">
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}
      {content.additional_notes && (
        <div>
          <p className="text-text-muted text-xs uppercase tracking-wide mb-1">Notas</p>
          <p className="text-text-secondary">{content.additional_notes}</p>
        </div>
      )}
    </div>
  );
}

// ── Traffic briefing content ──────────────────────────────────────────────────

function TrafficContent({ content }: { content: TrafficBriefing }) {
  return (
    <div className="space-y-4 text-sm">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-text-muted text-xs uppercase tracking-wide mb-1">Objetivo</p>
          <p className="text-text-secondary capitalize">{content.objective}</p>
        </div>
        <div>
          <p className="text-text-muted text-xs uppercase tracking-wide mb-1">
            Orçamento sugerido
          </p>
          <p className="text-text-secondary">{content.budget_suggestion}</p>
        </div>
      </div>
      {content.platforms?.length > 0 && (
        <div>
          <p className="text-text-muted text-xs uppercase tracking-wide mb-1">Plataformas</p>
          <div className="flex flex-wrap gap-2">
            {content.platforms.map((p, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded-full bg-white/5 text-text-secondary text-xs border border-white/10"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      )}
      {content.audience_segments?.length > 0 && (
        <div>
          <p className="text-text-muted text-xs uppercase tracking-wide mb-2">
            Segmentos de audiência
          </p>
          <div className="space-y-2">
            {content.audience_segments.map((seg, i) => (
              <div key={i} className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
                <p className="font-medium text-text-primary text-xs">{seg.name}</p>
                {seg.cohort_reference && (
                  <p className="text-text-muted text-xs mt-0.5">
                    Coorte: {seg.cohort_reference}
                  </p>
                )}
                <p className="text-text-secondary text-xs mt-1">{seg.targeting_criteria}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {content.funnel_stages?.length > 0 && (
        <div>
          <p className="text-text-muted text-xs uppercase tracking-wide mb-2">Funil</p>
          <div className="space-y-2">
            {content.funnel_stages.map((stage, i) => (
              <div key={i} className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-text-primary text-xs font-medium">{stage.stage}</p>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-galaxy-blue/15 text-galaxy-blue-light border border-galaxy-blue/25">
                    {stage.cta}
                  </span>
                </div>
                <p className="text-text-secondary text-xs">{stage.message}</p>
                <p className="text-text-muted text-xs mt-1">{stage.creative_specs}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {content.success_metrics?.length > 0 && (
        <div>
          <p className="text-text-muted text-xs uppercase tracking-wide mb-2">Métricas de sucesso</p>
          <div className="grid grid-cols-2 gap-2">
            {content.success_metrics.map((m, i) => (
              <div key={i} className="p-2 rounded-lg bg-white/[0.03] border border-white/5">
                <p className="text-text-secondary text-xs">{m.metric}</p>
                <p className="text-emerald-400 text-xs font-medium mt-0.5">{m.target}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {content.additional_notes && (
        <div>
          <p className="text-text-muted text-xs uppercase tracking-wide mb-1">Notas</p>
          <p className="text-text-secondary">{content.additional_notes}</p>
        </div>
      )}
    </div>
  );
}

// ── Account briefing content ──────────────────────────────────────────────────

const URGENCY_BADGE: Record<string, string> = {
  high: 'bg-red-500/15 text-red-400 border border-red-500/25',
  medium: 'bg-amber-500/15 text-amber-400 border border-amber-500/25',
  low: 'bg-white/5 text-text-muted border border-white/10',
};

const URGENCY_LABEL: Record<string, string> = {
  high: 'Alta',
  medium: 'Média',
  low: 'Baixa',
};

function AccountContent({ content }: { content: AccountBriefing }) {
  return (
    <div className="space-y-4 text-sm">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-text-muted text-xs uppercase tracking-wide mb-1">Período</p>
          <p className="text-text-secondary">{content.period}</p>
        </div>
        <div>
          <p className="text-text-muted text-xs uppercase tracking-wide mb-1">Status do cliente</p>
          <p className="text-text-secondary">{content.client_status}</p>
        </div>
      </div>
      {content.priorities?.length > 0 && (
        <div>
          <p className="text-text-muted text-xs uppercase tracking-wide mb-2">Prioridades</p>
          <div className="space-y-2">
            {content.priorities.map((p, i) => (
              <div
                key={i}
                className="flex items-start justify-between gap-3 p-2.5 rounded-lg bg-white/[0.03] border border-white/5"
              >
                <p className="text-text-secondary text-xs flex-1">{p.item}</p>
                <span
                  className={cn(
                    'text-xs px-2 py-0.5 rounded-full shrink-0',
                    URGENCY_BADGE[p.urgency] ?? URGENCY_BADGE.low
                  )}
                >
                  {URGENCY_LABEL[p.urgency] ?? p.urgency}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      {content.pending_decisions?.length > 0 && (
        <div>
          <p className="text-text-muted text-xs uppercase tracking-wide mb-1">
            Decisões pendentes
          </p>
          <ul className="list-disc list-inside space-y-0.5">
            {content.pending_decisions.map((d, i) => (
              <li key={i} className="text-text-secondary text-xs">
                {d}
              </li>
            ))}
          </ul>
        </div>
      )}
      {content.checkin_prep?.length > 0 && (
        <div>
          <p className="text-text-muted text-xs uppercase tracking-wide mb-1">Prep check-in</p>
          <ul className="list-disc list-inside space-y-0.5">
            {content.checkin_prep.map((q, i) => (
              <li key={i} className="text-text-secondary text-xs">
                {q}
              </li>
            ))}
          </ul>
        </div>
      )}
      {content.team_coordination?.length > 0 && (
        <div>
          <p className="text-text-muted text-xs uppercase tracking-wide mb-2">
            Coordenação de equipe
          </p>
          <div className="space-y-2">
            {content.team_coordination.map((tc, i) => (
              <div key={i} className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5">
                <p className="text-text-primary text-xs font-medium">{tc.team_member_role}</p>
                <p className="text-text-secondary text-xs mt-0.5">{tc.action_needed}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {content.risks_and_opportunities && (
        <div>
          <p className="text-text-muted text-xs uppercase tracking-wide mb-1">
            Riscos e oportunidades
          </p>
          <p className="text-text-secondary">{content.risks_and_opportunities}</p>
        </div>
      )}
      {content.additional_notes && (
        <div>
          <p className="text-text-muted text-xs uppercase tracking-wide mb-1">Notas</p>
          <p className="text-text-secondary">{content.additional_notes}</p>
        </div>
      )}
    </div>
  );
}

// ── Site briefing content ─────────────────────────────────────────────────────

function SiteContent({ content }: { content: SiteBriefing }) {
  return (
    <div className="space-y-4 text-sm">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-text-muted text-xs uppercase tracking-wide mb-1">Objetivo</p>
          <p className="text-text-secondary">{content.objective}</p>
        </div>
        <div>
          <p className="text-text-muted text-xs uppercase tracking-wide mb-1">Público-alvo</p>
          <p className="text-text-secondary">{content.target_audience}</p>
        </div>
      </div>
      {content.structure?.length > 0 && (
        <div>
          <p className="text-text-muted text-xs uppercase tracking-wide mb-2">Estrutura</p>
          <div className="space-y-2">
            {content.structure.map((s, i) => (
              <div key={i} className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5">
                <p className="text-text-primary text-xs font-medium">{s.section}</p>
                <p className="text-text-secondary text-xs mt-0.5">{s.content_needed}</p>
                {s.notes && <p className="text-text-muted text-xs mt-0.5">{s.notes}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-text-muted text-xs uppercase tracking-wide mb-1">Prazo sugerido</p>
          <p className="text-text-secondary">{content.deadline_suggestion}</p>
        </div>
      </div>
      {content.additional_notes && (
        <div>
          <p className="text-text-muted text-xs uppercase tracking-wide mb-1">Notas</p>
          <p className="text-text-secondary">{content.additional_notes}</p>
        </div>
      )}
    </div>
  );
}

// ── Briefing preview (compact, 2-3 fields) ────────────────────────────────────

function BriefingPreview({ briefing }: { briefing: Briefing }) {
  const c = briefing.content_json as unknown as Record<string, unknown>;
  const objective =
    (c.objective as string | undefined) ??
    (c.client_status as string | undefined) ??
    '';
  const secondary =
    (c.period as string | undefined) ??
    (c.budget_suggestion as string | undefined) ??
    (c.tone_and_style as string | undefined) ??
    (c.target_audience as string | undefined) ??
    '';

  return (
    <div className="space-y-1 text-sm">
      {objective && (
        <p className="text-text-secondary line-clamp-2">{objective}</p>
      )}
      {secondary && (
        <p className="text-text-muted text-xs line-clamp-1">{secondary}</p>
      )}
    </div>
  );
}

// ── Expanded briefing content router ─────────────────────────────────────────

function BriefingExpandedContent({ briefing }: { briefing: Briefing }) {
  switch (briefing.type) {
    case 'designer':
      return <DesignerContent content={briefing.content_json as DesignerBriefing} />;
    case 'traffic':
      return <TrafficContent content={briefing.content_json as TrafficBriefing} />;
    case 'account':
      return <AccountContent content={briefing.content_json as AccountBriefing} />;
    case 'site':
      return <SiteContent content={briefing.content_json as SiteBriefing} />;
    default:
      return (
        <pre className="text-xs text-text-secondary whitespace-pre-wrap">
          {JSON.stringify(briefing.content_json, null, 2)}
        </pre>
      );
  }
}

// ── Briefing card ─────────────────────────────────────────────────────────────

interface BriefingCardProps {
  briefing: Briefing;
  canManage: boolean;
  onSend: (id: string) => void;
  isSending: boolean;
  onPushMonday: (id: string) => void;
  isPushingMonday: boolean;
}

function BriefingCard({
  briefing,
  canManage,
  onSend,
  isSending,
  onPushMonday,
  isPushingMonday,
}: BriefingCardProps) {
  const [expanded, setExpanded] = useState(false);
  const content = briefing.content_json as unknown as Record<string, unknown>;
  const title = (content.title as string | undefined) ?? TYPE_LABEL[briefing.type];

  return (
    <GlassCard className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={cn(
              'text-xs font-medium px-2 py-0.5 rounded-full',
              TYPE_BADGE[briefing.type]
            )}
          >
            {TYPE_LABEL[briefing.type]}
          </span>
          <h3 className="text-text-primary font-medium text-sm">{title}</h3>
        </div>
        <span className="text-text-muted text-xs shrink-0">{formatDate(briefing.created_at)}</span>
      </div>

      {/* Status */}
      <div className="flex items-center gap-2">
        {briefing.sent_at ? (
          <span className="flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">
            <CheckCircle size={11} />
            Enviado em {formatDate(briefing.sent_at)}
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full bg-white/5 text-text-muted">
            <Clock size={11} />
            Não enviado
          </span>
        )}
        {briefing.monday_task_id && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-galaxy-blue/10 text-galaxy-blue-light border border-galaxy-blue/20">
            Monday #{briefing.monday_task_id.slice(-6)}
          </span>
        )}
      </div>

      {/* Preview */}
      {!expanded && <BriefingPreview briefing={briefing} />}

      {/* Expanded content */}
      {expanded && (
        <div className="pt-2 border-t border-white/5">
          <BriefingExpandedContent briefing={briefing} />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap pt-1">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors"
        >
          {expanded ? (
            <>
              <ChevronUp size={13} />
              Recolher
            </>
          ) : (
            <>
              <ChevronDown size={13} />
              Ver completo
            </>
          )}
        </button>

        {canManage && !briefing.sent_at && (
          <GradientButton
            variant="outline"
            size="sm"
            isLoading={isSending}
            leftIcon={!isSending ? <Send size={12} /> : undefined}
            onClick={() => onSend(briefing.id)}
          >
            Enviar
          </GradientButton>
        )}

        {canManage && !briefing.monday_task_id && (
          <GradientButton
            variant="ghost"
            size="sm"
            isLoading={isPushingMonday}
            leftIcon={!isPushingMonday ? <ExternalLink size={12} /> : undefined}
            onClick={() => onPushMonday(briefing.id)}
          >
            Enviar para Monday.com
          </GradientButton>
        )}
      </div>
    </GlassCard>
  );
}

// ── WhatsApp Demands section ──────────────────────────────────────────────────

const URGENCY_DEMAND_BADGE: Record<string, string> = {
  high: 'bg-red-500/15 text-red-400 border border-red-500/25',
  medium: 'bg-amber-500/15 text-amber-400 border border-amber-500/25',
  low: 'bg-white/5 text-text-muted border border-white/10',
};

const URGENCY_DEMAND_LABEL: Record<string, string> = {
  high: 'Alta',
  medium: 'Média',
  low: 'Baixa',
};

interface WhatsAppDemandsSectionProps {
  clientId: string;
  canExtract: boolean;
}

function WhatsAppDemandsSection({ clientId, canExtract }: WhatsAppDemandsSectionProps) {
  const [open, setOpen] = useState(false);
  const { data: messages = [], isLoading } = useWhatsAppMessages(clientId, 20);
  const extractMutation = useExtractDemands(clientId);

  // Collect all extracted demands from the messages
  const allDemands: ExtractedDemand[] = [];
  for (const msg of messages) {
    if (Array.isArray(msg.extracted_demands_json)) {
      for (const d of msg.extracted_demands_json as ExtractedDemand[]) {
        allDemands.push(d);
      }
    }
  }

  // Deduplicate by description
  const seenDescriptions = new Set<string>();
  const demands = allDemands.filter((d) => {
    if (seenDescriptions.has(d.description)) return false;
    seenDescriptions.add(d.description);
    return true;
  });

  // Also surface demands from the last extraction mutation result
  const latestDemands =
    extractMutation.data && extractMutation.data.length > 0 ? extractMutation.data : demands;

  return (
    <div className="border border-white/10 rounded-2xl overflow-hidden">
      {/* Header — collapsible toggle */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 bg-white/[0.03] hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <MessageCircle size={16} className="text-emerald-400" />
          <span className="text-sm font-medium text-text-primary">
            Demandas Extraídas do WhatsApp
          </span>
          {latestDemands.length > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
              {latestDemands.length}
            </span>
          )}
        </div>
        {open ? (
          <ChevronUp size={15} className="text-text-muted" />
        ) : (
          <ChevronDown size={15} className="text-text-muted" />
        )}
      </button>

      {open && (
        <div className="p-5 space-y-4">
          {/* Extract button */}
          {canExtract && (
            <div className="flex items-center justify-between gap-4">
              <p className="text-text-secondary text-xs">
                {messages.length} mensagem{messages.length !== 1 ? 's' : ''} carregada
                {messages.length !== 1 ? 's' : ''}
              </p>
              <GradientButton
                size="sm"
                isLoading={extractMutation.isPending}
                leftIcon={!extractMutation.isPending ? <Sparkles size={13} /> : undefined}
                onClick={() => extractMutation.mutate()}
              >
                Extrair Demandas
              </GradientButton>
            </div>
          )}

          {/* Loading state */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={20} className="animate-spin text-text-muted" />
            </div>
          ) : latestDemands.length === 0 ? (
            <p className="text-text-secondary text-sm text-center py-6">
              {canExtract
                ? 'Nenhuma demanda extraída ainda. Clique em "Extrair Demandas" para analisar as mensagens.'
                : 'Nenhuma demanda extraída ainda.'}
            </p>
          ) : (
            <div className="space-y-2">
              {latestDemands.map((demand, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-text-secondary text-sm leading-snug">{demand.description}</p>
                    {demand.type && (
                      <p className="text-text-muted text-xs mt-1 capitalize">{demand.type}</p>
                    )}
                  </div>
                  <span
                    className={cn(
                      'text-xs px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap',
                      URGENCY_DEMAND_BADGE[demand.urgency] ?? URGENCY_DEMAND_BADGE.low
                    )}
                  >
                    {URGENCY_DEMAND_LABEL[demand.urgency] ?? demand.urgency}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function BriefingsPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const { isSuperAdmin, isAccount, isDesigner, isGestorTrafego, isCoordenador } = useAuth();

  const canManage = isSuperAdmin || isAccount || isCoordenador;

  // Determine which tab the user is allowed to see by default
  const defaultTab: BriefingType | 'all' = isDesigner
    ? 'designer'
    : isGestorTrafego
    ? 'traffic'
    : 'all';

  const [activeTab, setActiveTab] = useState<BriefingType | 'all'>(defaultTab);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [pushingId, setPushingId] = useState<string | null>(null);

  const typeFilter = activeTab !== 'all' ? activeTab : undefined;

  const { data: briefings = [], isLoading, error } = useBriefings(clientId, typeFilter);
  const generateMutation = useGenerateBriefing(clientId);
  const sendMutation = useSendBriefing(clientId);
  const pushMutation = usePushToMonday(clientId);

  const handleGenerate = (type: BriefingType, scope?: DesignerScope) => {
    generateMutation.mutate(
      { type, designerScope: scope },
      {
        onSuccess: () => {
          setShowGenerateModal(false);
        },
      }
    );
  };

  const handleSend = (briefingId: string) => {
    setSendingId(briefingId);
    sendMutation.mutate(briefingId, {
      onSettled: () => setSendingId(null),
    });
  };

  const handlePushMonday = (briefingId: string) => {
    setPushingId(briefingId);
    pushMutation.mutate(
      { briefingId },
      {
        onSettled: () => setPushingId(null),
      }
    );
  };

  // Build visible tabs based on role
  const visibleTabs = BRIEFING_TABS.filter((tab) => {
    if (canManage || isSuperAdmin) return true;
    if (isDesigner) return tab.value === 'all' || tab.value === 'designer';
    if (isGestorTrafego) return tab.value === 'all' || tab.value === 'traffic';
    return false;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <PageHeader
        title="Briefings"
        subtitle="Briefings gerados por IA por papel — designer, tráfego e account"
        actions={
          canManage ? (
            <GradientButton
              leftIcon={<Sparkles size={14} />}
              onClick={() => setShowGenerateModal(true)}
            >
              Gerar Briefing
            </GradientButton>
          ) : undefined
        }
      />

      {/* Tab filter bar */}
      <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/5 w-fit">
        {visibleTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              'px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-150',
              activeTab === tab.value
                ? 'bg-galaxy-blue/20 text-galaxy-blue-light shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-text-muted" />
        </div>
      ) : error ? (
        <GlassCard className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-text-secondary text-sm">Erro ao carregar briefings.</p>
        </GlassCard>
      ) : briefings.length === 0 ? (
        <GlassCard className="flex flex-col items-center justify-center py-20 text-center">
          <ClipboardList size={36} className="text-text-muted mb-4" />
          {canManage ? (
            <>
              <h2 className="text-base font-semibold text-text-primary mb-2">
                Nenhum briefing gerado
              </h2>
              <p className="text-text-secondary text-sm max-w-sm mb-4">
                Gere o primeiro briefing para este cliente usando o contexto de sprint, WhatsApp e
                estratégia.
              </p>
              <GradientButton
                leftIcon={<Sparkles size={14} />}
                onClick={() => setShowGenerateModal(true)}
              >
                Gerar Briefing
              </GradientButton>
            </>
          ) : (
            <>
              <h2 className="text-base font-semibold text-text-primary mb-2">
                Nenhum briefing disponível
              </h2>
              <p className="text-text-secondary text-sm max-w-sm">
                Nenhum briefing foi gerado para você ainda.
              </p>
            </>
          )}
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {briefings.map((briefing) => (
            <BriefingCard
              key={briefing.id}
              briefing={briefing}
              canManage={canManage}
              onSend={handleSend}
              isSending={sendingId === briefing.id && sendMutation.isPending}
              onPushMonday={handlePushMonday}
              isPushingMonday={pushingId === briefing.id && pushMutation.isPending}
            />
          ))}
        </div>
      )}

      {/* WhatsApp Demands section */}
      {clientId && (
        <WhatsAppDemandsSection
          clientId={clientId}
          canExtract={canManage}
        />
      )}

      {/* Generate modal */}
      <GenerateModal
        open={showGenerateModal}
        onClose={() => !generateMutation.isPending && setShowGenerateModal(false)}
        onGenerate={handleGenerate}
        isLoading={generateMutation.isPending}
      />
    </motion.div>
  );
}
