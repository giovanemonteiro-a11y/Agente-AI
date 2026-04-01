import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from 'react-router-dom';
import {
  Users2,
  Sparkles,
  Brain,
  Eye,
  Ear,
  MessageCircle,
  HeartCrack,
  TrendingUp,
  Loader2,
  UserX,
} from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { GradientButton } from '@/components/shared/GradientButton';
import { PageHeader } from '@/components/shared/PageHeader';
import { useAuth } from '@/hooks/useAuth';
import {
  useCohorts,
  useGenerateCohorts,
  useUpdateCohort,
  useGenerateEmpathyMap,
} from '@/hooks/useCohort';
import type { Cohort, EmpathyMap } from '@/types/cohort';
import { cn } from '@/lib/utils';

// ── Empathy map quadrant config ───────────────────────────────────────────────

const EMPATHY_QUADRANTS: Array<{
  key: keyof EmpathyMap;
  label: string;
  icon: React.ElementType;
  borderColor: string;
  iconColor: string;
}> = [
  {
    key: 'pensa_sente',
    label: 'O que pensa/sente',
    icon: Brain,
    borderColor: 'border-l-purple-500',
    iconColor: 'text-purple-400',
  },
  {
    key: 've',
    label: 'O que vê',
    icon: Eye,
    borderColor: 'border-l-blue-500',
    iconColor: 'text-blue-400',
  },
  {
    key: 'ouve',
    label: 'O que ouve',
    icon: Ear,
    borderColor: 'border-l-teal-500',
    iconColor: 'text-teal-400',
  },
  {
    key: 'fala_faz',
    label: 'O que fala/faz',
    icon: MessageCircle,
    borderColor: 'border-l-green-500',
    iconColor: 'text-green-400',
  },
  {
    key: 'dores',
    label: 'Dores',
    icon: HeartCrack,
    borderColor: 'border-l-red-500',
    iconColor: 'text-red-400',
  },
  {
    key: 'ganhos',
    label: 'Ganhos',
    icon: TrendingUp,
    borderColor: 'border-l-emerald-500',
    iconColor: 'text-emerald-400',
  },
];

// ── Demographic chip ──────────────────────────────────────────────────────────

function DemographicChip({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex flex-col gap-0.5 bg-white/5 border border-glass-border rounded-full px-3 py-1.5 text-xs">
      <span className="text-text-muted font-medium uppercase tracking-wider text-[10px]">
        {label}
      </span>
      <span className="text-text-secondary">{value}</span>
    </span>
  );
}

// ── String array renderer ─────────────────────────────────────────────────────

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-galaxy-blue-light/60 shrink-0" />
          {item}
        </li>
      ))}
    </ul>
  );
}

// ── Section block ─────────────────────────────────────────────────────────────

function SectionBlock({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider">{label}</h4>
      {children}
    </div>
  );
}

// ── Empathy map quadrant ──────────────────────────────────────────────────────

function EmpathyQuadrant({
  quadrant,
  value,
  canEdit,
  onEdit,
}: {
  quadrant: (typeof EMPATHY_QUADRANTS)[number];
  value: string;
  canEdit: boolean;
  onEdit: (val: string) => void;
}) {
  const Icon = quadrant.icon;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const handleBlur = () => {
    setEditing(false);
    if (draft !== value) onEdit(draft);
  };

  return (
    <GlassCard
      variant="strong"
      padding="sm"
      className={cn('border-l-4', quadrant.borderColor)}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon size={16} className={quadrant.iconColor} />
        <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
          {quadrant.label}
        </span>
      </div>
      {canEdit && editing ? (
        <textarea
          className="w-full bg-transparent text-sm text-text-primary resize-none outline-none border border-glass-border rounded-lg p-2 min-h-[80px]"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={handleBlur}
          autoFocus
        />
      ) : (
        <p
          className={cn(
            'text-sm text-text-secondary leading-relaxed',
            canEdit && 'cursor-pointer hover:text-text-primary transition-colors'
          )}
          onClick={() => canEdit && setEditing(true)}
        >
          {value}
        </p>
      )}
    </GlassCard>
  );
}

// ── Empathy map tab ───────────────────────────────────────────────────────────

function EmpathyMapTab({
  cohort,
  clientId,
  canEdit,
}: {
  cohort: Cohort;
  clientId: string;
  canEdit: boolean;
}) {
  const generateEmpathyMap = useGenerateEmpathyMap(clientId, cohort.id);
  const empathyMap = cohort.empathy_map;

  if (!empathyMap) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center gap-4">
        <Brain size={36} className="text-text-muted" />
        <p className="text-text-secondary text-sm">Mapa de empatia ainda não gerado para esta coorte.</p>
        {canEdit && (
          <GradientButton
            onClick={() => generateEmpathyMap.mutate()}
            disabled={generateEmpathyMap.isPending}
            className="text-sm"
          >
            {generateEmpathyMap.isPending ? (
              <>
                <Loader2 size={14} className="animate-spin mr-2" />
                Gerando...
              </>
            ) : (
              <>
                <Sparkles size={14} className="mr-2" />
                Gerar Mapa de Empatia
              </>
            )}
          </GradientButton>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {canEdit && (
        <div className="flex justify-end">
          <button
            onClick={() => generateEmpathyMap.mutate()}
            disabled={generateEmpathyMap.isPending}
            className="flex items-center gap-1.5 text-xs text-text-muted hover:text-galaxy-blue-light transition-colors"
          >
            {generateEmpathyMap.isPending ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Sparkles size={12} />
            )}
            Regenerar
          </button>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {EMPATHY_QUADRANTS.map((quadrant) => (
          <EmpathyQuadrant
            key={quadrant.key}
            quadrant={quadrant}
            value={empathyMap[quadrant.key] as string}
            canEdit={canEdit}
            onEdit={(_val) => {
              // Inline edit of empathy map fields is handled via the cohort update flow
              // Future: wire to a dedicated PATCH for empathy maps
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ── Cohort card ───────────────────────────────────────────────────────────────

function CohortCard({
  cohort,
  index,
  clientId,
  canEdit,
}: {
  cohort: Cohort;
  index: number;
  clientId: string;
  canEdit: boolean;
}) {
  const [activeTab, setActiveTab] = useState<'perfil' | 'empatia'>('perfil');
  const updateCohort = useUpdateCohort(clientId);

  const demo = cohort.demographic_profile_json;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.08 }}
    >
      <GlassCard variant="default" padding="lg" className="space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 flex-1">
            <span className="text-xs font-bold text-galaxy-blue-light uppercase tracking-widest">
              Coorte {index + 1}
            </span>
            <h2 className="text-xl font-bold gradient-text leading-snug">
              {cohort.characteristic_phrase}
            </h2>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-glass-border pb-1">
          {(['perfil', 'empatia'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-4 py-1.5 text-sm font-medium rounded-t-lg transition-colors',
                activeTab === tab
                  ? 'text-galaxy-blue-light border-b-2 border-galaxy-blue-light -mb-px'
                  : 'text-text-muted hover:text-text-secondary'
              )}
            >
              {tab === 'perfil' ? 'Perfil' : 'Mapa de Empatia'}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'perfil' ? (
            <motion.div
              key="perfil"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Anthropological description */}
              <p className="text-text-secondary text-sm leading-relaxed">
                {cohort.anthropological_description}
              </p>

              {/* Demographics chips */}
              <div className="flex flex-wrap gap-2">
                {demo.gender && <DemographicChip label="Gênero" value={demo.gender} />}
                {demo.ageRange && <DemographicChip label="Idade" value={demo.ageRange} />}
                {demo.education && <DemographicChip label="Escolaridade" value={demo.education} />}
                {demo.familySituation && (
                  <DemographicChip label="Família" value={demo.familySituation} />
                )}
                {demo.location && <DemographicChip label="Região" value={demo.location} />}
                {demo.income && <DemographicChip label="Renda" value={demo.income} />}
                {demo.occupation && (
                  <DemographicChip label="Ocupação" value={demo.occupation} />
                )}
              </div>

              {/* 2-col grid sections */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <SectionBlock label="Comportamento & Lifestyle">
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {cohort.behavior_lifestyle}
                  </p>
                </SectionBlock>

                <SectionBlock label="Tamanho do Público">
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {cohort.audience_size}
                  </p>
                </SectionBlock>

                <SectionBlock label="Potencial de Alcance">
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {cohort.reach_potential}
                  </p>
                </SectionBlock>

                <SectionBlock label="Gatilhos">
                  <BulletList items={cohort.triggers} />
                </SectionBlock>

                <SectionBlock label="Soluções Alternativas">
                  <BulletList items={cohort.alternative_solutions} />
                </SectionBlock>

                <SectionBlock label="Indicadores / Referências">
                  <BulletList items={cohort.indicators} />
                </SectionBlock>
              </div>

              {/* Full-width editorial lines */}
              <SectionBlock label="Linhas Editoriais">
                <BulletList items={cohort.editorial_lines} />
              </SectionBlock>
            </motion.div>
          ) : (
            <motion.div
              key="empatia"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <EmpathyMapTab cohort={cohort} clientId={clientId} canEdit={canEdit} />
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>
    </motion.div>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function CohortSkeleton({ index }: { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.06 }}
    >
      <GlassCard variant="default" padding="lg" className="space-y-4 animate-pulse">
        <div className="h-3 w-16 bg-white/10 rounded" />
        <div className="h-6 w-3/4 bg-white/10 rounded" />
        <div className="h-px bg-white/5" />
        <div className="space-y-2">
          <div className="h-4 bg-white/5 rounded w-full" />
          <div className="h-4 bg-white/5 rounded w-5/6" />
          <div className="h-4 bg-white/5 rounded w-4/6" />
        </div>
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 w-24 bg-white/5 rounded-full" />
          ))}
        </div>
      </GlassCard>
    </motion.div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function CohortsPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const { isSuperAdmin, isAccount, isCoordenador } = useAuth();
  const canEdit = isSuperAdmin || isAccount || isCoordenador;

  const { data: cohortsResponse, isLoading } = useCohorts(clientId);
  const generateCohorts = useGenerateCohorts(clientId);

  const cohorts = cohortsResponse?.data ?? [];
  const scopeNotApplicable = cohortsResponse?.scopeNotApplicable ?? false;

  const isGenerating = generateCohorts.isPending;

  // ── Scope not applicable ──────────────────────────────────────────────────

  if (!isLoading && scopeNotApplicable) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        <CohortPageHeader
          cohortCount={0}
          canEdit={false}
          isGenerating={false}
          onGenerate={() => {}}
        />
        <GlassCard className="flex flex-col items-center justify-center py-20 text-center gap-4">
          <UserX size={40} className="text-text-muted" />
          <h2 className="text-lg font-semibold text-text-primary">
            Escopo não aplicável
          </h2>
          <p className="text-text-secondary text-sm max-w-sm">
            Este cliente não possui escopo para cohorts. O sistema de cohorts está disponível apenas
            para clientes com <strong>social_media</strong> ou <strong>trafego</strong> no escopo de
            serviços.
          </p>
        </GlassCard>
      </motion.div>
    );
  }

  // ── Loading ───────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        <CohortPageHeader
          cohortCount={0}
          canEdit={canEdit}
          isGenerating={false}
          onGenerate={() => {}}
        />
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <CohortSkeleton key={i} index={i} />
          ))}
        </div>
      </motion.div>
    );
  }

  // ── Empty state ───────────────────────────────────────────────────────────

  if (cohorts.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        <CohortPageHeader
          cohortCount={0}
          canEdit={canEdit}
          isGenerating={isGenerating}
          onGenerate={() => generateCohorts.mutate()}
        />
        <GlassCard className="flex flex-col items-center justify-center py-20 text-center gap-4">
          <Users2 size={40} className="text-text-muted" />
          <h2 className="text-lg font-semibold text-text-primary">
            Nenhum cohort gerado ainda
          </h2>
          {canEdit ? (
            <>
              <p className="text-text-secondary text-sm max-w-sm">
                Gere os cohorts com IA para criar perfis antropológicos detalhados do público-alvo
                com base nas transcrições e estratégia do cliente.
              </p>
              <GradientButton
                onClick={() => generateCohorts.mutate()}
                disabled={isGenerating}
                className="mt-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={16} className="animate-spin mr-2" />
                    Gerando cohorts...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} className="mr-2" />
                    Gerar Cohorts com IA
                  </>
                )}
              </GradientButton>
            </>
          ) : (
            <p className="text-text-secondary text-sm max-w-sm">
              Aguardando geração dos cohorts pela equipe de account.
            </p>
          )}
        </GlassCard>
      </motion.div>
    );
  }

  // ── Cohorts list ──────────────────────────────────────────────────────────

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <CohortPageHeader
        cohortCount={cohorts.length}
        canEdit={canEdit}
        isGenerating={isGenerating}
        onGenerate={() => generateCohorts.mutate()}
      />

      {isGenerating && (
        <GlassCard className="flex items-center gap-3 py-4">
          <Loader2 size={18} className="animate-spin text-galaxy-blue-light" />
          <p className="text-text-secondary text-sm">
            Gerando cohorts com IA... isso pode levar alguns instantes.
          </p>
        </GlassCard>
      )}

      <div className="space-y-6">
        {cohorts.map((cohort, index) => (
          <CohortCard
            key={cohort.id}
            cohort={cohort}
            index={index}
            clientId={clientId ?? ''}
            canEdit={canEdit}
          />
        ))}
      </div>
    </motion.div>
  );
}

// ── Page header ───────────────────────────────────────────────────────────────

function CohortPageHeader({
  cohortCount,
  canEdit,
  isGenerating,
  onGenerate,
}: {
  cohortCount: number;
  canEdit: boolean;
  isGenerating: boolean;
  onGenerate: () => void;
}) {
  return (
    <PageHeader
      title="Sistema de Cohorts"
      subtitle="Perfis antropológicos detalhados do público-alvo com mapas de empatia"
      actions={
        <div className="flex items-center gap-3">
          {cohortCount > 0 && (
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-galaxy-blue/15 text-galaxy-blue-light border border-galaxy-blue/20">
              {cohortCount} cohort{cohortCount !== 1 ? 's' : ''}
            </span>
          )}
          {canEdit && (
            <GradientButton onClick={onGenerate} disabled={isGenerating} className="shrink-0">
              {isGenerating ? (
                <>
                  <Loader2 size={16} className="animate-spin mr-2" />
                  Gerando...
                </>
              ) : (
                <>
                  <Sparkles size={16} className="mr-2" />
                  Gerar Cohorts com IA
                </>
              )}
            </GradientButton>
          )}
        </div>
      }
    />
  );
}
