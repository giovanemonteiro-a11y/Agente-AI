import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target,
  ChevronUp,
  Sparkles,
  AlertTriangle,
  Info,
  History,
  RotateCcw,
} from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { GradientButton } from '@/components/shared/GradientButton';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useClient } from '@/hooks/useClient';
import { useAuth } from '@/hooks/useAuth';
import {
  useStrategy,
  useStrategyHistory,
  useSaveStrategy,
  useDetectGaps,
  useHighlights,
} from '@/hooks/useStrategy';
import type { Strategy, GapItem, HighlightItem } from '@/types/strategy';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

const FIELD_LABELS: Record<string, string> = {
  objectives: 'Objetivos',
  positioning: 'Posicionamento',
  differentials: 'Diferenciais',
  tone: 'Tom de Voz',
  products: 'Produtos / Serviços',
  expected_results: 'Resultados Esperados',
};

const FIELD_KEYS = [
  'objectives',
  'positioning',
  'differentials',
  'tone',
  'products',
  'expected_results',
] as const;

type FieldKey = (typeof FIELD_KEYS)[number];

type FormValues = Record<FieldKey, string>;

const EMPTY_FORM: FormValues = {
  objectives: '',
  positioning: '',
  differentials: '',
  tone: '',
  products: '',
  expected_results: '',
};

// ── Severity badge ────────────────────────────────────────────────────────────

function SeverityBadge({ severity }: { severity: GapItem['severity'] }) {
  const variantMap: Record<GapItem['severity'], 'error' | 'warning' | 'info'> = {
    high: 'error',
    medium: 'warning',
    low: 'info',
  };
  const labels: Record<GapItem['severity'], string> = {
    high: 'Alta',
    medium: 'Média',
    low: 'Baixa',
  };
  return (
    <StatusBadge variant={variantMap[severity]} label={labels[severity]} dot={false} />
  );
}

// ── Highlight card ────────────────────────────────────────────────────────────

function HighlightCard({ item }: { item: HighlightItem }) {
  return (
    <div className="p-3 rounded-xl bg-white/5 border border-glass-border space-y-1">
      <p className="text-text-primary text-sm italic">"{item.excerpt}"</p>
      <p className="text-text-muted text-xs">{item.relevance}</p>
      {item.meeting_type && (
        <StatusBadge
          variant="info"
          label={item.meeting_type === 'kickoff' ? 'Kickoff' : 'Check-in'}
          dot={false}
        />
      )}
    </div>
  );
}

// ── StrategyField ─────────────────────────────────────────────────────────────

interface StrategyFieldProps {
  fieldKey: FieldKey;
  value: string;
  onChange: (key: FieldKey, val: string) => void;
  clientId: string;
  readOnly?: boolean;
}

function StrategyField({ fieldKey, value, onChange, clientId, readOnly }: StrategyFieldProps) {
  const [showHighlights, setShowHighlights] = useState(false);
  const { data: highlights, isFetching, refetch } = useHighlights(clientId, fieldKey);

  const handleToggleHighlights = useCallback(async () => {
    const next = !showHighlights;
    setShowHighlights(next);
    if (next && !highlights) {
      await refetch();
    }
  }, [showHighlights, highlights, refetch]);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-text-primary">
        {FIELD_LABELS[fieldKey]}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(fieldKey, e.target.value)}
        readOnly={readOnly}
        rows={3}
        className="w-full rounded-xl px-3 py-2 text-sm text-text-primary placeholder-text-muted
          bg-white/5 border border-glass-border resize-none
          focus:outline-none focus:border-galaxy-blue/50 focus:ring-1 focus:ring-galaxy-blue/30
          transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ minHeight: '80px', fieldSizing: 'content' } as React.CSSProperties}
        placeholder={readOnly ? '—' : `Descreva ${FIELD_LABELS[fieldKey].toLowerCase()}...`}
      />

      {!readOnly && (
        <button
          type="button"
          onClick={handleToggleHighlights}
          className="inline-flex items-center gap-1 text-xs text-galaxy-blue-light hover:text-galaxy-blue transition-colors"
        >
          <Sparkles size={11} />
          {showHighlights ? 'Ocultar' : 'Ver'} destaques da transcrição
        </button>
      )}

      <AnimatePresence>
        {showHighlights && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-2 pt-1">
              {isFetching ? (
                <div className="flex items-center gap-2 text-xs text-text-muted py-2">
                  <LoadingSpinner size="sm" />
                  Buscando destaques...
                </div>
              ) : highlights && highlights.length > 0 ? (
                highlights.map((h, i) => <HighlightCard key={i} item={h} />)
              ) : (
                <p className="text-xs text-text-muted py-2">
                  Nenhum destaque encontrado para este campo.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Version history row ───────────────────────────────────────────────────────

interface VersionRowProps {
  strategy: Strategy;
  onRestore: (s: Strategy) => void;
}

function VersionRow({ strategy, onRestore }: VersionRowProps) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-glass-border last:border-0">
      <div className="flex items-center gap-3">
        <span className="text-xs font-mono font-semibold text-galaxy-blue-light bg-galaxy-blue/10 px-2 py-0.5 rounded">
          v{strategy.version}
        </span>
        <span className="text-xs text-text-muted">{formatDate(strategy.created_at)}</span>
      </div>
      <button
        type="button"
        onClick={() => onRestore(strategy)}
        className="inline-flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary transition-colors"
      >
        <RotateCcw size={11} />
        Restaurar
      </button>
    </div>
  );
}

// ── Main StrategyPage ─────────────────────────────────────────────────────────

export function StrategyPage() {
  const { selectedClientId } = useClient();
  const { hasRole } = useAuth();
  const canEdit = hasRole('super_admin', 'account', 'coordenador');

  const { data: latestStrategy, isLoading } = useStrategy(selectedClientId ?? undefined);
  const { data: history = [] } = useStrategyHistory(selectedClientId ?? undefined);
  const saveMutation = useSaveStrategy(selectedClientId ?? undefined);
  const gapsMutation = useDetectGaps(selectedClientId ?? undefined);

  const [form, setForm] = useState<FormValues>(EMPTY_FORM);

  // Sync form once when the strategy data is first loaded
  useEffect(() => {
    if (latestStrategy) {
      setForm({
        objectives: latestStrategy.objectives ?? '',
        positioning: latestStrategy.positioning ?? '',
        differentials: latestStrategy.differentials ?? '',
        tone: latestStrategy.tone ?? '',
        products: latestStrategy.products ?? '',
        expected_results: latestStrategy.expected_results ?? '',
      });
    }
    // Only run when latestStrategy.id changes (new client or new save)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latestStrategy?.id]);

  const [gaps, setGaps] = useState<GapItem[] | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const handleFieldChange = useCallback((key: FieldKey, val: string) => {
    setForm((prev) => ({ ...prev, [key]: val }));
  }, []);

  const handleSave = async () => {
    if (!selectedClientId) return;
    await saveMutation.mutateAsync(form);
  };

  const handleDetectGaps = async () => {
    if (!selectedClientId) return;
    const detected = await gapsMutation.mutateAsync(form);
    setGaps(detected);
  };

  const handleRestore = (s: Strategy) => {
    setForm({
      objectives: s.objectives ?? '',
      positioning: s.positioning ?? '',
      differentials: s.differentials ?? '',
      tone: s.tone ?? '',
      products: s.products ?? '',
      expected_results: s.expected_results ?? '',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!selectedClientId) {
    return (
      <motion.div
        className="space-y-6"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <PageHeader
          title="Estratégia"
          subtitle="Posicionamento, diferenciais e objetivos SMART"
        />
        <GlassCard className="flex flex-col items-center justify-center py-20 text-center">
          <Target size={40} className="text-text-muted mb-4" />
          <p className="text-text-secondary text-sm">Selecione um cliente para ver a estratégia.</p>
        </GlassCard>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <PageHeader
        title="Estratégia"
        subtitle="Posicionamento, diferenciais e objetivos SMART"
      />

      {/* Two-column layout */}
      <div className="flex gap-6 items-start">
        {/* LEFT COLUMN — Strategy form */}
        <div className="flex-1 min-w-0 space-y-4">
          <GlassCard variant="strong" className="space-y-5">
            {FIELD_KEYS.map((key) => (
              <StrategyField
                key={key}
                fieldKey={key}
                value={form[key]}
                onChange={handleFieldChange}
                clientId={selectedClientId}
                readOnly={!canEdit}
              />
            ))}

            {canEdit && (
              <div className="flex items-center justify-between pt-2 border-t border-glass-border">
                <div className="flex items-center gap-3">
                  <GradientButton
                    variant="ghost"
                    size="sm"
                    onClick={handleDetectGaps}
                    isLoading={gapsMutation.isPending}
                    leftIcon={<AlertTriangle size={14} />}
                  >
                    Verificar Lacunas
                  </GradientButton>

                  {latestStrategy && (
                    <span className="text-xs text-text-muted">
                      v{latestStrategy.version} • {formatDate(latestStrategy.created_at)}
                      {history.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setShowHistory((p) => !p)}
                          className="ml-2 text-galaxy-blue-light hover:underline"
                        >
                          Histórico
                        </button>
                      )}
                    </span>
                  )}
                </div>

                <GradientButton
                  variant="gradient"
                  size="sm"
                  onClick={handleSave}
                  isLoading={saveMutation.isPending}
                >
                  Salvar Versão
                </GradientButton>
              </div>
            )}
          </GlassCard>

          {/* Version history */}
          <AnimatePresence>
            {showHistory && history.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <GlassCard>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <History size={14} className="text-text-muted" />
                      <span className="text-sm font-medium text-text-primary">
                        Histórico de Versões
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowHistory(false)}
                      className="text-text-muted hover:text-text-primary transition-colors"
                    >
                      <ChevronUp size={16} />
                    </button>
                  </div>
                  <div>
                    {history.map((s) => (
                      <VersionRow key={s.id} strategy={s} onRestore={handleRestore} />
                    ))}
                  </div>
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT COLUMN — Gaps panel */}
        <div className="w-80 flex-shrink-0 space-y-4">
          <AnimatePresence mode="wait">
            {gaps === null ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <GlassCard className="flex flex-col items-center justify-center py-10 text-center space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-galaxy-blue/10 flex items-center justify-center">
                    <Sparkles size={20} className="text-galaxy-blue-light" />
                  </div>
                  <p className="text-text-secondary text-sm max-w-xs">
                    Clique em &apos;Verificar Lacunas&apos; para analisar a estratégia com IA
                  </p>
                </GlassCard>
              </motion.div>
            ) : gaps.length === 0 ? (
              <motion.div
                key="no-gaps"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <GlassCard className="flex flex-col items-center justify-center py-10 text-center space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <Info size={20} className="text-emerald-400" />
                  </div>
                  <p className="text-emerald-400 text-sm font-medium">
                    Nenhuma lacuna detectada!
                  </p>
                  <p className="text-text-muted text-xs">
                    A estratégia parece completa e consistente.
                  </p>
                </GlassCard>
              </motion.div>
            ) : (
              <motion.div
                key="gaps"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-text-primary">
                    Lacunas Detectadas
                  </span>
                  <StatusBadge variant="error" label={String(gaps.length)} dot={false} />
                </div>

                {gaps.map((gap, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <GlassCard padding="sm" className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-text-primary">
                          {FIELD_LABELS[gap.field] ?? gap.field}
                        </span>
                        <SeverityBadge severity={gap.severity} />
                      </div>
                      <p className="text-xs text-text-secondary leading-relaxed">
                        {gap.suggested_question}
                      </p>
                    </GlassCard>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
