import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Plus,
  ChevronDown,
  ChevronUp,
  Loader2,
  X,
  BarChart2,
} from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { GradientButton } from '@/components/shared/GradientButton';
import { PageHeader } from '@/components/shared/PageHeader';
import { ModalOverlay } from '@/components/shared/ModalOverlay';
import { GlassInput } from '@/components/shared/GlassInput';
import { useAuth } from '@/hooks/useAuth';
import { useReports, useCreateReport } from '@/hooks/useReport';
import type { CampaignReport } from '@/types/report';
import type { CreateReportPayload } from '@/hooks/useReport';
import { cn } from '@/lib/utils';

// -- Helpers ------------------------------------------------------------------

function formatCurrency(value: number | null | undefined): string {
  if (value == null) return '\u2014';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatPercent(value: number | null | undefined, decimals = 2): string {
  if (value == null) return '\u2014';
  return `${value.toFixed(decimals)}%`;
}

function formatNumber(value: number | null | undefined): string {
  if (value == null) return '\u2014';
  return new Intl.NumberFormat('pt-BR').format(value);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR');
}

// -- Metric pill --------------------------------------------------------------

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.08] min-w-[80px]">
      <span className="text-xs text-text-muted mb-0.5">{label}</span>
      <span className="text-sm font-semibold text-text-primary">{value}</span>
    </div>
  );
}

// -- Extra metrics key-value editor -------------------------------------------

interface KVPair {
  key: string;
  value: string;
}

interface KVEditorProps {
  pairs: KVPair[];
  onChange: (pairs: KVPair[]) => void;
}

function KVEditor({ pairs, onChange }: KVEditorProps) {
  const addRow = () => onChange([...pairs, { key: '', value: '' }]);
  const removeRow = (i: number) => onChange(pairs.filter((_, idx) => idx !== i));
  const updateRow = (i: number, field: 'key' | 'value', val: string) => {
    const next = [...pairs];
    next[i] = { ...next[i], [field]: val };
    onChange(next);
  };

  return (
    <div className="space-y-2">
      {pairs.map((pair, i) => (
        <div key={i} className="flex items-center gap-2">
          <GlassInput
            className="flex-1"
            placeholder="M\u00e9trica"
            value={pair.key}
            onChange={(e) => updateRow(i, 'key', e.target.value)}
          />
          <GlassInput
            className="flex-1"
            placeholder="Valor"
            value={pair.value}
            onChange={(e) => updateRow(i, 'value', e.target.value)}
          />
          <button
            onClick={() => removeRow(i)}
            className="p-1 text-text-muted hover:text-red-400 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      ))}
      <button
        onClick={addRow}
        className="text-xs text-galaxy-blue-light hover:underline flex items-center gap-1"
      >
        <Plus size={12} />
        Adicionar m\u00e9trica
      </button>
    </div>
  );
}

// -- New Report Modal ---------------------------------------------------------

interface NewReportModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateReportPayload) => void;
  isLoading: boolean;
}

const EMPTY_FORM: CreateReportPayload = {
  campaign_name: '',
  period_start: '',
  period_end: '',
  roi: null,
  roas: null,
  cpa: null,
  ctr: null,
  cpm: null,
  impressions: null,
  conversions: null,
  spend: null,
  extra_metrics_json: null,
};

function NewReportModal({ open, onClose, onSubmit, isLoading }: NewReportModalProps) {
  const [form, setForm] = useState<CreateReportPayload>(EMPTY_FORM);
  const [extraPairs, setExtraPairs] = useState<KVPair[]>([]);

  const set = (field: keyof CreateReportPayload, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const setNum = (field: keyof CreateReportPayload, raw: string) => {
    const n = raw === '' ? null : parseFloat(raw);
    set(field, isNaN(n as number) ? null : n);
  };

  const handleSubmit = () => {
    if (!form.campaign_name || !form.period_start || !form.period_end) return;

    const extra: Record<string, string | number> = {};
    for (const { key, value } of extraPairs) {
      if (key.trim()) {
        const num = parseFloat(value);
        extra[key.trim()] = isNaN(num) ? value : num;
      }
    }

    onSubmit({
      ...form,
      extra_metrics_json: Object.keys(extra).length > 0 ? extra : null,
    });
  };

  return (
    <ModalOverlay open={open} onClose={onClose} title="Novo Relat\u00f3rio de Campanha">
      <div className="space-y-4">
        {/* Campaign name */}
        <GlassInput
          label="Nome da campanha *"
          placeholder="Ex: Campanha Black Friday 2024"
          value={form.campaign_name}
          onChange={(e) => set('campaign_name', e.target.value)}
        />

        {/* Period */}
        <div className="grid grid-cols-2 gap-3">
          <GlassInput
            label="In\u00edcio do per\u00edodo *"
            type="date"
            value={form.period_start}
            onChange={(e) => set('period_start', e.target.value)}
          />
          <GlassInput
            label="Fim do per\u00edodo *"
            type="date"
            value={form.period_end}
            onChange={(e) => set('period_end', e.target.value)}
          />
        </div>

        {/* Core metrics grid */}
        <div>
          <p className="text-xs font-medium text-text-secondary mb-2 uppercase tracking-wide">M\u00e9tricas</p>
          <div className="grid grid-cols-2 gap-3">
            {(
              [
                { field: 'roi' as const, label: 'ROI (%)', placeholder: '150' },
                { field: 'roas' as const, label: 'ROAS', placeholder: '4.5' },
                { field: 'cpa' as const, label: 'CPA (R$)', placeholder: '50.00' },
                { field: 'ctr' as const, label: 'CTR (%)', placeholder: '2.5' },
                { field: 'cpm' as const, label: 'CPM (R$)', placeholder: '15.00' },
                { field: 'spend' as const, label: 'Investimento (R$)', placeholder: '5000' },
                { field: 'impressions' as const, label: 'Impress\u00f5es', placeholder: '100000' },
                { field: 'conversions' as const, label: 'Convers\u00f5es', placeholder: '200' },
              ] as const
            ).map(({ field, label, placeholder }) => (
              <GlassInput
                key={field}
                label={label}
                type="number"
                step="any"
                placeholder={placeholder}
                value={form[field] ?? ''}
                onChange={(e) => setNum(field, e.target.value)}
              />
            ))}
          </div>
        </div>

        {/* Extra metrics */}
        <div>
          <p className="text-xs font-medium text-text-secondary mb-2 uppercase tracking-wide">
            M\u00e9tricas adicionais
          </p>
          <KVEditor pairs={extraPairs} onChange={setExtraPairs} />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-xl text-sm text-text-secondary border border-white/10 hover:border-white/20 transition-colors"
          >
            Cancelar
          </button>
          <GradientButton
            className="flex-1"
            onClick={handleSubmit}
            isLoading={isLoading}
            disabled={!form.campaign_name || !form.period_start || !form.period_end}
          >
            Salvar Relat\u00f3rio
          </GradientButton>
        </div>
      </div>
    </ModalOverlay>
  );
}

// -- Report card --------------------------------------------------------------

function ReportCard({ report }: { report: CampaignReport }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <GlassCard className="p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-text-primary font-semibold text-sm">{report.campaign_name}</h3>
          <p className="text-text-muted text-xs mt-0.5">
            {formatDate(report.period_start)} — {formatDate(report.period_end)}
          </p>
        </div>
        <span className="text-text-muted text-xs shrink-0">{formatDate(report.created_at)}</span>
      </div>

      {/* Key metrics row */}
      <div className="flex flex-wrap gap-2">
        {report.roi != null && <MetricPill label="ROI" value={formatPercent(report.roi)} />}
        {report.roas != null && <MetricPill label="ROAS" value={`${report.roas.toFixed(2)}x`} />}
        {report.cpa != null && <MetricPill label="CPA" value={formatCurrency(report.cpa)} />}
        {report.spend != null && <MetricPill label="Invest." value={formatCurrency(report.spend)} />}
        {report.ctr != null && <MetricPill label="CTR" value={formatPercent(report.ctr)} />}
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="pt-3 border-t border-white/5 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            {report.cpm != null && (
              <div>
                <p className="text-text-muted text-xs mb-0.5">CPM</p>
                <p className="text-text-secondary text-sm">{formatCurrency(report.cpm)}</p>
              </div>
            )}
            {report.impressions != null && (
              <div>
                <p className="text-text-muted text-xs mb-0.5">Impress\u00f5es</p>
                <p className="text-text-secondary text-sm">{formatNumber(report.impressions)}</p>
              </div>
            )}
            {report.conversions != null && (
              <div>
                <p className="text-text-muted text-xs mb-0.5">Convers\u00f5es</p>
                <p className="text-text-secondary text-sm">{formatNumber(report.conversions)}</p>
              </div>
            )}
          </div>

          {/* Extra metrics */}
          {report.extra_metrics_json && Object.keys(report.extra_metrics_json).length > 0 && (
            <div>
              <p className="text-text-muted text-xs mb-2 uppercase tracking-wide">M\u00e9tricas adicionais</p>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(report.extra_metrics_json).map(([key, val]) => (
                  <div key={key} className="flex justify-between gap-2 p-2 rounded-lg bg-white/[0.03] border border-white/5">
                    <span className="text-text-muted text-xs">{key}</span>
                    <span className="text-text-secondary text-xs font-medium">{String(val)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Toggle */}
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
            Ver todas as m\u00e9tricas
          </>
        )}
      </button>
    </GlassCard>
  );
}

// -- Main page ----------------------------------------------------------------

export function ReportsPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const { isSuperAdmin, isGestorTrafego, isCoordenador } = useAuth();
  const canCreate = isSuperAdmin || isGestorTrafego || isCoordenador;

  const [showModal, setShowModal] = useState(false);

  const { data: reports = [], isLoading, error } = useReports(clientId);
  const createMutation = useCreateReport(clientId);

  const handleCreate = (payload: CreateReportPayload) => {
    createMutation.mutate(payload, {
      onSuccess: () => setShowModal(false),
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <PageHeader
        title="Relat\u00f3rios de Campanha"
        subtitle="Performance de campanhas e m\u00e9tricas de resultado"
        actions={
          canCreate ? (
            <GradientButton
              leftIcon={<Plus size={14} />}
              onClick={() => setShowModal(true)}
            >
              Novo Relat\u00f3rio
            </GradientButton>
          ) : undefined
        }
      />

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-text-muted" />
        </div>
      ) : error ? (
        <GlassCard className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-text-secondary text-sm">Erro ao carregar relat\u00f3rios.</p>
        </GlassCard>
      ) : reports.length === 0 ? (
        <GlassCard className="flex flex-col items-center justify-center py-20 text-center">
          <TrendingUp size={40} className="text-text-muted mb-4" />
          <h2 className="text-lg font-semibold text-text-primary mb-2">
            Nenhum relat\u00f3rio ainda
          </h2>
          <p className="text-text-secondary text-sm max-w-sm mb-4">
            {canCreate
              ? 'Adicione o primeiro relat\u00f3rio de campanha para este cliente.'
              : 'Nenhum relat\u00f3rio de campanha dispon\u00edvel ainda.'}
          </p>
          {canCreate && (
            <GradientButton leftIcon={<Plus size={14} />} onClick={() => setShowModal(true)}>
              Novo Relat\u00f3rio
            </GradientButton>
          )}
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-4">
            <GlassCard className="p-4 text-center">
              <p className="text-text-muted text-xs mb-1">Total de Relat\u00f3rios</p>
              <p className="text-2xl font-bold text-text-primary">{reports.length}</p>
            </GlassCard>
            <GlassCard className="p-4 text-center">
              <p className="text-text-muted text-xs mb-1">Total Investido</p>
              <p className="text-xl font-bold text-text-primary">
                {formatCurrency(reports.reduce((s, r) => s + (r.spend ?? 0), 0))}
              </p>
            </GlassCard>
            <GlassCard className="p-4 text-center">
              <p className="text-text-muted text-xs mb-1">ROAS M\u00e9dio</p>
              <p className="text-xl font-bold text-text-primary">
                {(() => {
                  const withROAS = reports.filter((r) => r.roas != null);
                  if (!withROAS.length) return '\u2014';
                  const avg = withROAS.reduce((s, r) => s + (r.roas ?? 0), 0) / withROAS.length;
                  return `${avg.toFixed(2)}x`;
                })()}
              </p>
            </GlassCard>
          </div>

          {/* Report cards */}
          <div className="flex items-center gap-2 mb-1">
            <BarChart2 size={15} className="text-text-muted" />
            <p className="text-xs text-text-muted uppercase tracking-wide">Relat\u00f3rios</p>
          </div>
          {reports.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))}
        </div>
      )}

      {/* New report modal */}
      <NewReportModal
        open={showModal}
        onClose={() => !createMutation.isPending && setShowModal(false)}
        onSubmit={handleCreate}
        isLoading={createMutation.isPending}
      />
    </motion.div>
  );
}
