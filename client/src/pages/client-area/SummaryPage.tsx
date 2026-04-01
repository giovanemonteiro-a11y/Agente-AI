import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useParams } from 'react-router-dom';
import {
  Sparkles,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
} from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { GradientButton } from '@/components/shared/GradientButton';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useAuth } from '@/hooks/useAuth';
import {
  useSummary,
  useGenerateSummary,
  useUpdateSummary,
  useApproveSummary,
} from '@/hooks/useSummary';
import type { SummaryJSON, BrandProfileJSON, KPI } from '@/types/summary';
import { cn } from '@/lib/utils';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function FieldSkeleton() {
  return (
    <div className="space-y-2 animate-pulse">
      <div className="h-3 bg-white/10 rounded w-1/3" />
      <div className="h-4 bg-white/[0.08] rounded w-full" />
      <div className="h-4 bg-white/[0.08] rounded w-4/5" />
    </div>
  );
}

function DocumentSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 7 }).map((_, i) => (
        <FieldSkeleton key={i} />
      ))}
    </div>
  );
}

// ── Inline editable field ─────────────────────────────────────────────────────

interface EditableFieldProps {
  label: string;
  value: string;
  canEdit: boolean;
  onSave: (newValue: string) => void;
  placeholder?: string;
}

function EditableField({ label, value, canEdit, onSave, placeholder }: EditableFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const handleBlur = useCallback(() => {
    setEditing(false);
    if (draft !== value) {
      onSave(draft);
    }
  }, [draft, value, onSave]);

  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">{label}</p>
      {canEdit && editing ? (
        <textarea
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={handleBlur}
          rows={3}
          placeholder={placeholder}
          className={cn(
            'w-full text-sm text-text-primary resize-none rounded-lg px-3 py-2',
            'bg-white/5 border border-glass-border',
            'focus:outline-none focus:ring-1 focus:ring-galaxy-blue/60',
            'shadow-[0_0_12px_rgba(99,102,241,0.15)]',
            'transition-all duration-200'
          )}
        />
      ) : (
        <p
          className={cn(
            'text-sm text-text-secondary leading-relaxed',
            canEdit && 'cursor-pointer hover:text-text-primary transition-colors duration-150 rounded px-1 -mx-1 hover:bg-white/5'
          )}
          onClick={() => {
            if (canEdit) {
              setDraft(value);
              setEditing(true);
            }
          }}
        >
          {value || <span className="italic text-text-muted">{placeholder ?? 'Não preenchido'}</span>}
        </p>
      )}
    </div>
  );
}

// ── KPI list editor ───────────────────────────────────────────────────────────

interface KPIEditorProps {
  kpis: KPI[];
  canEdit: boolean;
  onSave: (kpis: KPI[]) => void;
}

function KPIEditor({ kpis, canEdit, onSave }: KPIEditorProps) {
  const [items, setItems] = useState<KPI[]>(kpis);

  const handleChange = (idx: number, field: keyof KPI, value: string) => {
    const updated = items.map((k, i) => (i === idx ? { ...k, [field]: value } : k));
    setItems(updated);
    onSave(updated);
  };

  const handleAdd = () => {
    const updated = [...items, { metric: '', target: '' }];
    setItems(updated);
    onSave(updated);
  };

  const handleRemove = (idx: number) => {
    const updated = items.filter((_, i) => i !== idx);
    setItems(updated);
    onSave(updated);
  };

  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">KPIs &amp; Metas</p>
      <div className="space-y-2">
        {items.map((kpi, idx) => (
          <div key={idx} className="flex items-start gap-2">
            {canEdit ? (
              <>
                <input
                  className={cn(
                    'flex-1 text-sm text-text-primary rounded-lg px-2 py-1',
                    'bg-white/5 border border-glass-border',
                    'focus:outline-none focus:ring-1 focus:ring-galaxy-blue/60'
                  )}
                  value={kpi.metric}
                  placeholder="Métrica"
                  onChange={(e) => handleChange(idx, 'metric', e.target.value)}
                />
                <input
                  className={cn(
                    'flex-1 text-sm text-text-primary rounded-lg px-2 py-1',
                    'bg-white/5 border border-glass-border',
                    'focus:outline-none focus:ring-1 focus:ring-galaxy-blue/60'
                  )}
                  value={kpi.target}
                  placeholder="Meta"
                  onChange={(e) => handleChange(idx, 'target', e.target.value)}
                />
                <button
                  onClick={() => handleRemove(idx)}
                  className="text-text-muted hover:text-red-400 transition-colors duration-150 mt-1"
                >
                  <Trash2 size={14} />
                </button>
              </>
            ) : (
              <p className="text-sm text-text-secondary">
                <span className="font-medium text-text-primary">{kpi.metric}</span>
                {kpi.target ? ` — ${kpi.target}` : ''}
              </p>
            )}
          </div>
        ))}
        {canEdit && (
          <button
            onClick={handleAdd}
            className="flex items-center gap-1 text-xs text-galaxy-blue-light hover:text-galaxy-blue transition-colors duration-150 mt-1"
          >
            <Plus size={12} />
            Adicionar KPI
          </button>
        )}
        {items.length === 0 && !canEdit && (
          <p className="text-sm italic text-text-muted">Nenhum KPI definido</p>
        )}
      </div>
    </div>
  );
}

// ── Empty states ──────────────────────────────────────────────────────────────

interface GenerateEmptyStateProps {
  onGenerate: () => void;
  isLoading: boolean;
}

function GenerateEmptyState({ onGenerate, isLoading }: GenerateEmptyStateProps) {
  return (
    <GlassCard variant="strong" className="flex flex-col items-center justify-center py-20 text-center">
      <Sparkles size={40} className="text-galaxy-blue-light mb-4" />
      <h2 className="text-lg font-semibold text-text-primary mb-2">
        One Page Summary &amp; Brand Profile
      </h2>
      <p className="text-text-secondary text-sm max-w-sm mb-6">
        Gere automaticamente os dois documentos estratégicos com IA, baseados nas transcrições de
        reuniões e estratégia do cliente.
      </p>
      <GradientButton onClick={onGenerate} isLoading={isLoading} leftIcon={<Sparkles size={16} />}>
        {isLoading ? 'Gerando com IA...' : 'Gerar One Page Summary com IA'}
      </GradientButton>
    </GlassCard>
  );
}

// ── One Page Summary card ─────────────────────────────────────────────────────

interface OnePagSummaryCardProps {
  data: SummaryJSON;
  canEdit: boolean;
  onSave: (patch: Partial<SummaryJSON>) => void;
  isGenerating: boolean;
}

function OnePagSummaryCard({ data, canEdit, onSave, isGenerating }: OnePagSummaryCardProps) {
  return (
    <GlassCard variant="strong" className="space-y-5 h-full">
      <h2 className="text-lg font-bold gradient-text">One Page Summary</h2>

      {isGenerating ? (
        <DocumentSkeleton />
      ) : (
        <>
          <EditableField
            label="Escopo Contratado"
            value={data.contracted_scope}
            canEdit={canEdit}
            onSave={(v) => onSave({ contracted_scope: v })}
          />
          <EditableField
            label="Necessidades do Cliente"
            value={data.client_needs}
            canEdit={canEdit}
            onSave={(v) => onSave({ client_needs: v })}
          />
          <KPIEditor
            kpis={data.kpis}
            canEdit={canEdit}
            onSave={(kpis) => onSave({ kpis })}
          />
          <EditableField
            label="Indicador de Sucesso Pessoal"
            value={data.success_indicator}
            canEdit={canEdit}
            onSave={(v) => onSave({ success_indicator: v })}
          />
          <EditableField
            label="Público-Alvo"
            value={data.target_audience}
            canEdit={canEdit}
            onSave={(v) => onSave({ target_audience: v })}
          />
          <EditableField
            label="Objetivos"
            value={data.objectives}
            canEdit={canEdit}
            onSave={(v) => onSave({ objectives: v })}
          />
          <EditableField
            label="Detalhes Adicionais"
            value={data.extra_details}
            canEdit={canEdit}
            onSave={(v) => onSave({ extra_details: v })}
          />
        </>
      )}
    </GlassCard>
  );
}

// ── Brand Profile card ────────────────────────────────────────────────────────

interface BrandProfileCardProps {
  data: BrandProfileJSON;
  canEdit: boolean;
  onSave: (patch: Partial<BrandProfileJSON>) => void;
  isGenerating: boolean;
}

function BrandProfileCard({ data, canEdit, onSave, isGenerating }: BrandProfileCardProps) {
  return (
    <GlassCard variant="strong" className="space-y-5 h-full">
      <h2 className="text-lg font-bold gradient-text">Brand Profile</h2>

      {isGenerating ? (
        <DocumentSkeleton />
      ) : (
        <>
          <EditableField
            label="Posicionamento"
            value={data.positioning}
            canEdit={canEdit}
            onSave={(v) => onSave({ positioning: v })}
          />
          <EditableField
            label="Personalidade da Marca"
            value={data.personality}
            canEdit={canEdit}
            onSave={(v) => onSave({ personality: v })}
          />
          <EditableField
            label="Tom de Voz"
            value={data.tone_of_voice}
            canEdit={canEdit}
            onSave={(v) => onSave({ tone_of_voice: v })}
          />
          <EditableField
            label="Identidade Visual"
            value={data.visual_identity_notes}
            canEdit={canEdit}
            onSave={(v) => onSave({ visual_identity_notes: v })}
          />
          <EditableField
            label="Promessa da Marca"
            value={data.brand_promise}
            canEdit={canEdit}
            onSave={(v) => onSave({ brand_promise: v })}
          />
          <EditableField
            label="Diferenciais"
            value={data.differentiators}
            canEdit={canEdit}
            onSave={(v) => onSave({ differentiators: v })}
          />
          <EditableField
            label="Arquétipo"
            value={data.archetype ?? 'Não identificado'}
            canEdit={canEdit}
            onSave={(v) => onSave({ archetype: v || null })}
            placeholder="Não identificado"
          />
        </>
      )}
    </GlassCard>
  );
}

// ── Main SummaryPage ──────────────────────────────────────────────────────────

export function SummaryPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const { hasRole } = useAuth();

  const canEdit = hasRole('account', 'super_admin', 'coordenador');
  const canApprove = hasRole('account', 'super_admin', 'coordenador');

  const { data: summary, isLoading, error } = useSummary(clientId);
  const generateMutation = useGenerateSummary(clientId);
  const updateMutation = useUpdateSummary(clientId);
  const approveMutation = useApproveSummary(clientId);

  const isGenerating = generateMutation.isPending;
  const isApproving = approveMutation.isPending;

  const handleGenerate = () => {
    generateMutation.mutate();
  };

  const handleSummaryPatch = useCallback(
    (patch: Partial<SummaryJSON>) => {
      if (!summary) return;
      // Optimistic local state update happens via hook
      const merged = { ...summary.summary_json, ...patch };
      updateMutation.debouncedUpdate({ summary_json: merged });
    },
    [summary, updateMutation]
  );

  const handleBrandProfilePatch = useCallback(
    (patch: Partial<BrandProfileJSON>) => {
      if (!summary) return;
      const merged = { ...summary.brand_profile_json, ...patch };
      updateMutation.debouncedUpdate({ brand_profile_json: merged });
    },
    [summary, updateMutation]
  );

  const handleApprove = () => {
    approveMutation.mutate();
  };

  const handleExportPDF = () => {
    window.print();
  };

  // Role-gated 403 from the hook
  const isForbidden =
    (error as { response?: { status?: number } } | null)?.response?.status === 403;

  // Build action buttons for PageHeader
  const headerActions = (
    <div className="flex items-center gap-2 flex-wrap print:hidden">
      {/* Approve / approved badge */}
      {summary && canApprove && !summary.approved_at && (
        <GradientButton
          onClick={handleApprove}
          isLoading={isApproving}
          size="sm"
        >
          Aprovar Documentos
        </GradientButton>
      )}
      {summary?.approved_at && (
        <StatusBadge
          variant="success"
          label={`Aprovado em ${formatDate(summary.approved_at)}`}
          dot={false}
        />
      )}

      {/* Generate button */}
      {canEdit && (
        <GradientButton
          variant="outline"
          size="sm"
          onClick={handleGenerate}
          isLoading={isGenerating}
          leftIcon={<Sparkles size={14} />}
          disabled={isGenerating}
        >
          {isGenerating ? 'Gerando com IA...' : 'Gerar com IA'}
        </GradientButton>
      )}

      {/* Export PDF */}
      {summary && (
        <GradientButton
          variant="ghost"
          size="sm"
          onClick={handleExportPDF}
          leftIcon={<Printer size={14} />}
        >
          Exportar PDF
        </GradientButton>
      )}
    </div>
  );

  return (
    <motion.div
      className="space-y-6 print:space-y-4"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* ── Top action bar ─────────────────────────────────────────────────── */}
      <PageHeader
        title="One Page Summary & Brand Profile"
        subtitle="Documentos estratégicos gerados por IA, editáveis e aprovados em conjunto"
        actions={headerActions}
        className="print:hidden"
      />

      {/* ── Auto-refreshed banner ───────────────────────────────────────────── */}
      {summary?.auto_refreshed && !summary.approved_at && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm print:hidden">
          <AlertTriangle size={16} className="flex-shrink-0" />
          Atualizado após check-in — revisar e aprovar novamente
        </div>
      )}

      {/* ── Loading / forbidden / empty states ────────────────────────────── */}
      {isForbidden && (
        <GlassCard variant="strong" className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-text-secondary text-sm">
            Aguardando geração do resumo pelo Account.
          </p>
        </GlassCard>
      )}

      {!isForbidden && isLoading && !summary && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GlassCard variant="strong" className="space-y-5">
            <DocumentSkeleton />
          </GlassCard>
          <GlassCard variant="strong" className="space-y-5">
            <DocumentSkeleton />
          </GlassCard>
        </div>
      )}

      {!isForbidden && !isLoading && !summary && !isGenerating && (
        canEdit ? (
          <GenerateEmptyState onGenerate={handleGenerate} isLoading={isGenerating} />
        ) : (
          <GlassCard variant="strong" className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-text-secondary text-sm">
              Aguardando geração do resumo pelo Account.
            </p>
          </GlassCard>
        )
      )}

      {/* ── Two-column layout ───────────────────────────────────────────────── */}
      {!isForbidden && (summary || isGenerating) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:grid-cols-2 print:gap-4">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            <OnePagSummaryCard
              data={
                summary?.summary_json ?? {
                  contracted_scope: '',
                  client_needs: '',
                  kpis: [],
                  success_indicator: '',
                  target_audience: '',
                  objectives: '',
                  extra_details: '',
                }
              }
              canEdit={canEdit}
              onSave={handleSummaryPatch}
              isGenerating={isGenerating && !summary}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut', delay: 0.07 }}
          >
            <BrandProfileCard
              data={
                summary?.brand_profile_json ?? {
                  positioning: '',
                  personality: '',
                  tone_of_voice: '',
                  visual_identity_notes: '',
                  brand_promise: '',
                  differentiators: '',
                  archetype: null,
                }
              }
              canEdit={canEdit}
              onSave={handleBrandProfilePatch}
              isGenerating={isGenerating && !summary}
            />
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
