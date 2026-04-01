import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from 'react-router-dom';
import {
  Layers,
  ChevronDown,
  ChevronUp,
  Sparkles,
  CheckCircle2,
  Clock,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { GradientButton } from '@/components/shared/GradientButton';
import { PageHeader } from '@/components/shared/PageHeader';
import { useAuth } from '@/hooks/useAuth';
import {
  useStrategicSystems,
  useGenerateSystem,
  useGenerateAllSystems,
} from '@/hooks/useStrategicSystems';
import {
  SYSTEM_LABELS,
  type StrategicSystemType,
  type SystemMetaItem,
  type ContentArchContent,
  type FormatProportionContent,
  type ThemeProportionContent,
  type CampaignStructureContent,
  type CreativesPerPhaseContent,
  type LeadFunnelContent,
  type MqlFunnelContent,
  type EditorialCalendarContent,
  type CopyManualContent,
  type StorytellingStorydoingContent,
  type GraphicApproachContent,
} from '@/types/strategicSystem';
import { cn } from '@/lib/utils';

// ── Content renderers ─────────────────────────────────────────────────────────

function ContentArchRenderer({ data }: { data: ContentArchContent }) {
  return (
    <div className="space-y-6">
      {/* Social Media Pillars */}
      <div>
        <h4 className="text-sm font-semibold text-text-primary mb-3">Pilares — Redes Sociais</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {data.social_media?.pillars?.map((pillar, i) => (
            <div key={i} className="bg-white/5 rounded-lg p-3 border border-glass-border">
              <div className="font-semibold text-xs text-galaxy-blue-light mb-1">{pillar.name}</div>
              <p className="text-xs text-text-secondary mb-2">{pillar.description}</p>
              <div className="flex flex-wrap gap-1 mb-1">
                {pillar.content_types?.map((ct, j) => (
                  <span key={j} className="px-1.5 py-0.5 rounded text-[10px] bg-galaxy-blue/10 text-galaxy-blue-light border border-galaxy-blue/20">
                    {ct}
                  </span>
                ))}
              </div>
              <div className="text-[10px] text-text-muted">{pillar.frequency}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Campaign Funnel Stages */}
      <div>
        <h4 className="text-sm font-semibold text-text-primary mb-3">Estágios do Funil — Campanhas</h4>
        <div className="space-y-3">
          {data.campaigns?.funnel_stages?.map((stage, i) => {
            const stageColors: Record<string, string> = {
              awareness: 'border-purple-500/30 bg-purple-500/5',
              consideration: 'border-blue-500/30 bg-blue-500/5',
              conversion: 'border-green-500/30 bg-green-500/5',
            };
            const color = stageColors[stage.stage] ?? 'border-glass-border bg-white/5';
            return (
              <div key={i} className={cn('rounded-lg p-3 border', color)}>
                <div className="text-xs font-semibold text-text-primary capitalize mb-2">{stage.stage}</div>
                <div className="flex flex-wrap gap-1 mb-2">
                  {stage.content_types?.map((ct, j) => (
                    <span key={j} className="px-1.5 py-0.5 rounded text-[10px] bg-white/10 text-text-secondary border border-glass-border">
                      {ct}
                    </span>
                  ))}
                </div>
                <ul className="space-y-1">
                  {stage.messages?.map((msg, j) => (
                    <li key={j} className="text-xs text-text-secondary flex items-start gap-1.5">
                      <span className="text-text-muted mt-0.5">–</span> {msg}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function FormatProportionRenderer({ data }: { data: FormatProportionContent }) {
  const Section = ({ title, items }: { title: string; items: typeof data.social_media }) => (
    <div>
      <h4 className="text-sm font-semibold text-text-primary mb-3">{title}</h4>
      <div className="space-y-2">
        {items?.map((item, i) => (
          <div key={i} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-primary font-medium">{item.format}</span>
              <span className="text-galaxy-blue-light font-bold">{item.percentage}%</span>
            </div>
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-galaxy-blue to-galaxy-purple rounded-full"
                style={{ width: `${item.percentage}%` }}
              />
            </div>
            <p className="text-[10px] text-text-muted">{item.rationale}</p>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Section title="Redes Sociais" items={data.social_media} />
      <Section title="Campanhas Pagas" items={data.campaigns} />
    </div>
  );
}

function ThemeProportionRenderer({ data }: { data: ThemeProportionContent }) {
  return (
    <div className="space-y-3">
      {data?.map((item, i) => (
        <div key={i} className="bg-white/5 rounded-lg p-3 border border-glass-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-text-primary">{item.theme}</span>
            <span className="text-lg font-bold text-galaxy-blue-light">{item.percentage}%</span>
          </div>
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-gradient-to-r from-galaxy-blue to-galaxy-purple rounded-full"
              style={{ width: `${item.percentage}%` }}
            />
          </div>
          <p className="text-xs text-text-secondary mb-2">{item.description}</p>
          <div className="flex flex-wrap gap-1">
            {item.examples?.map((ex, j) => (
              <span key={j} className="px-1.5 py-0.5 rounded text-[10px] bg-galaxy-blue/10 text-galaxy-blue-light border border-galaxy-blue/20">
                {ex}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function CampaignStructureRenderer({ data }: { data: CampaignStructureContent }) {
  return (
    <div className="space-y-3">
      {data?.map((item, i) => (
        <div key={i} className="bg-white/5 rounded-lg p-4 border border-glass-border">
          <div className="text-sm font-semibold text-text-primary mb-3">{item.objective}</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-text-muted uppercase tracking-wide text-[10px]">Etapas do funil</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {item.funnel_stages?.map((stage, j) => (
                  <span key={j} className="px-1.5 py-0.5 rounded bg-galaxy-purple/10 text-galaxy-purple-light border border-galaxy-purple/20 text-[10px]">
                    {stage}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <span className="text-text-muted uppercase tracking-wide text-[10px]">Distribuição de verba</span>
              <p className="mt-1 text-text-secondary">{item.budget_distribution}</p>
            </div>
            <div>
              <span className="text-text-muted uppercase tracking-wide text-[10px]">Estratégia de audiência</span>
              <p className="mt-1 text-text-secondary">{item.audience_strategy}</p>
            </div>
            <div>
              <span className="text-text-muted uppercase tracking-wide text-[10px]">Timeline</span>
              <p className="mt-1 text-text-secondary">{item.timeline}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CreativesPerPhaseRenderer({ data }: { data: CreativesPerPhaseContent }) {
  const phaseColors = ['border-purple-500/30', 'border-blue-500/30', 'border-green-500/30'];
  return (
    <div className="space-y-4">
      {data?.map((item, i) => (
        <div key={i} className={cn('bg-white/5 rounded-lg p-4 border', phaseColors[i] ?? 'border-glass-border')}>
          <div className="text-sm font-bold text-text-primary mb-3">{item.phase}</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-text-muted uppercase tracking-wide text-[10px]">Formatos</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {item.formats?.map((f, j) => (
                  <span key={j} className="px-1.5 py-0.5 rounded bg-white/10 text-text-secondary border border-glass-border text-[10px]">
                    {f}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <span className="text-text-muted uppercase tracking-wide text-[10px]">CTAs</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {item.ctas?.map((cta, j) => (
                  <span key={j} className="px-1.5 py-0.5 rounded bg-galaxy-blue/10 text-galaxy-blue-light border border-galaxy-blue/20 text-[10px]">
                    {cta}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <span className="text-text-muted uppercase tracking-wide text-[10px]">Mensagens-chave</span>
              <ul className="mt-1 space-y-1">
                {item.messages?.map((msg, j) => (
                  <li key={j} className="text-text-secondary flex items-start gap-1">
                    <span className="text-text-muted">–</span> {msg}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="mb-2">
                <span className="text-text-muted uppercase tracking-wide text-[10px]">Coorte alvo</span>
                <p className="mt-1 text-text-secondary">{item.audience_cohort}</p>
              </div>
              <div>
                <span className="text-text-muted uppercase tracking-wide text-[10px]">Tom visual</span>
                <p className="mt-1 text-text-secondary">{item.visual_tone}</p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function LeadFunnelRenderer({ data }: { data: LeadFunnelContent }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-text-secondary bg-white/5 rounded-lg p-3 border border-glass-border">
        {data.total_journey}
      </p>
      <div className="relative">
        {data.stages?.map((stage, i) => {
          const width = Math.max(50, 100 - i * 10);
          return (
            <div key={i} className="flex flex-col items-center mb-2">
              <div
                className="rounded-lg p-3 bg-gradient-to-r from-galaxy-blue/15 to-galaxy-purple/15 border border-glass-border"
                style={{ width: `${width}%` }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-text-primary">{stage.stage}</span>
                  <span className="text-[10px] text-galaxy-blue-light font-bold">{stage.conversion_rate}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {stage.actions?.map((action, j) => (
                    <span key={j} className="text-[10px] text-text-secondary px-1.5 py-0.5 rounded bg-white/5 border border-glass-border">
                      {action}
                    </span>
                  ))}
                </div>
              </div>
              {i < (data.stages?.length ?? 0) - 1 && (
                <div className="w-0.5 h-3 bg-glass-border" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MqlFunnelRenderer({ data }: { data: MqlFunnelContent }) {
  return (
    <div className="space-y-5">
      {/* Qualification Criteria */}
      <div>
        <h4 className="text-sm font-semibold text-text-primary mb-3">Critérios de Qualificação</h4>
        <div className="space-y-2">
          {data.qualification_criteria?.map((crit, i) => {
            const weightColor =
              crit.weight === 'Alto' ? 'text-green-400 border-green-500/30 bg-green-500/10' :
              crit.weight === 'Médio' ? 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10' :
              'text-gray-400 border-glass-border bg-white/5';
            return (
              <div key={i} className="bg-white/5 rounded-lg p-3 border border-glass-border">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-text-primary">{crit.criterion}</span>
                  <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded border', weightColor)}>
                    {crit.weight}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {crit.signals?.map((signal, j) => (
                    <span key={j} className="text-[10px] text-text-secondary px-1.5 py-0.5 rounded bg-white/5 border border-glass-border">
                      {signal}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Nurturing Touchpoints */}
      <div>
        <h4 className="text-sm font-semibold text-text-primary mb-3">Touchpoints de Nutrição</h4>
        <div className="space-y-2">
          {data.nurturing_touchpoints?.map((tp, i) => (
            <div key={i} className="flex gap-3 items-start">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-galaxy-blue/20 border border-galaxy-blue/40 flex items-center justify-center text-[10px] font-bold text-galaxy-blue-light">
                {i + 1}
              </div>
              <div className="flex-1 bg-white/5 rounded-lg p-2.5 border border-glass-border">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-text-primary">{tp.touchpoint}</span>
                  <span className="text-[10px] text-text-muted">{tp.timing}</span>
                </div>
                <p className="text-xs text-text-secondary">{tp.objective}</p>
                <span className="mt-1 inline-block text-[10px] px-1.5 py-0.5 rounded bg-galaxy-purple/10 text-galaxy-purple-light border border-galaxy-purple/20">
                  {tp.channel}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Handoff Process */}
      <div>
        <h4 className="text-sm font-semibold text-text-primary mb-2">Processo de Handoff para Vendas</h4>
        <p className="text-sm text-text-secondary bg-white/5 rounded-lg p-3 border border-glass-border">
          {data.handoff_process}
        </p>
      </div>
    </div>
  );
}

function EditorialCalendarRenderer({ data }: { data: EditorialCalendarContent }) {
  return (
    <div className="space-y-6">
      {/* Weekly Model */}
      <div>
        <h4 className="text-sm font-semibold text-text-primary mb-3">Modelo Semanal</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-glass-border">
                {['Dia', 'Tipo', 'Tema', 'Formato', 'Plataforma', 'Responsável'].map((col) => (
                  <th key={col} className="text-left py-2 px-2 text-text-muted font-medium text-[10px] uppercase tracking-wide">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.weekly_model?.map((day, i) => (
                <tr key={i} className={cn('border-b border-glass-border/50', i % 2 === 0 ? 'bg-white/[0.02]' : '')}>
                  <td className="py-2 px-2 font-semibold text-text-primary">{day.day}</td>
                  <td className="py-2 px-2 text-text-secondary">{day.content_type}</td>
                  <td className="py-2 px-2 text-text-secondary max-w-[180px]">{day.theme}</td>
                  <td className="py-2 px-2">
                    <span className="px-1.5 py-0.5 rounded bg-white/5 border border-glass-border text-text-secondary text-[10px]">
                      {day.format}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-text-secondary">{day.platform}</td>
                  <td className="py-2 px-2 text-text-muted">{day.responsible}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly Model */}
      <div>
        <h4 className="text-sm font-semibold text-text-primary mb-3">Modelo Mensal</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {data.monthly_model?.map((week, i) => (
            <div key={i} className="bg-white/5 rounded-lg p-3 border border-glass-border">
              <div className="text-xs font-bold text-galaxy-blue-light mb-1">Semana {week.week}</div>
              <p className="text-xs font-semibold text-text-primary mb-2">{week.focus_theme}</p>
              <div className="flex items-center gap-1 mb-2">
                <span className="text-[10px] text-text-muted">Posts:</span>
                <span className="text-[10px] font-bold text-text-primary">{week.posts_count}</span>
              </div>
              {week.campaign_alignment && (
                <p className="text-[10px] text-text-muted italic">{week.campaign_alignment}</p>
              )}
              {week.key_dates?.length > 0 && (
                <div className="mt-2">
                  {week.key_dates.map((d, j) => (
                    <div key={j} className="text-[10px] text-text-muted">• {d}</div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CopyManualRenderer({ data }: { data: CopyManualContent }) {
  return (
    <div className="space-y-5">
      {/* Voice Guidelines */}
      <div>
        <h4 className="text-sm font-semibold text-text-primary mb-2">Diretrizes de Voz</h4>
        <div className="bg-white/5 rounded-lg p-3 border border-glass-border text-sm text-text-secondary whitespace-pre-line">
          {data.voice_guidelines}
        </div>
      </div>

      {/* Headline Formulas */}
      <div>
        <h4 className="text-sm font-semibold text-text-primary mb-2">Fórmulas de Headline</h4>
        <div className="space-y-1.5">
          {data.headline_formulas?.map((formula, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              <span className="text-galaxy-blue-light font-bold flex-shrink-0">{i + 1}.</span>
              <span className="text-text-secondary">{formula}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Patterns */}
      <div>
        <h4 className="text-sm font-semibold text-text-primary mb-2">Padrões de CTA</h4>
        <div className="flex flex-wrap gap-2">
          {data.cta_patterns?.map((cta, i) => (
            <span key={i} className="px-2 py-1 rounded-lg text-xs bg-galaxy-blue/10 text-galaxy-blue-light border border-galaxy-blue/20">
              {cta}
            </span>
          ))}
        </div>
      </div>

      {/* Vocabulary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="text-sm font-semibold text-green-400 mb-2">Vocabulário: Use</h4>
          <div className="flex flex-wrap gap-1">
            {data.vocabulary?.use?.map((word, i) => (
              <span key={i} className="px-1.5 py-0.5 rounded text-[10px] bg-green-500/10 text-green-400 border border-green-500/20">
                {word}
              </span>
            ))}
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-red-400 mb-2">Vocabulário: Evite</h4>
          <div className="flex flex-wrap gap-1">
            {data.vocabulary?.avoid?.map((word, i) => (
              <span key={i} className="px-1.5 py-0.5 rounded text-[10px] bg-red-500/10 text-red-400 border border-red-500/20">
                {word}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Copy Examples */}
      <div>
        <h4 className="text-sm font-semibold text-text-primary mb-2">Exemplos de Copy</h4>
        <div className="space-y-3">
          {data.copy_examples?.map((ex, i) => (
            <div key={i} className="bg-white/5 rounded-lg p-3 border border-glass-border">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-galaxy-purple/10 text-galaxy-purple-light border border-galaxy-purple/20 uppercase tracking-wide">
                  {ex.type}
                </span>
                {ex.context && (
                  <span className="text-[10px] text-text-muted">{ex.context}</span>
                )}
              </div>
              <p className="text-xs text-text-secondary whitespace-pre-line">{ex.example}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StorytellingStorydoingRenderer({ data }: { data: StorytellingStorydoingContent }) {
  return (
    <div className="space-y-5">
      {/* Brand Narrative */}
      <div>
        <h4 className="text-sm font-semibold text-text-primary mb-2">Narrativa Central da Marca</h4>
        <div className="bg-white/5 rounded-lg p-3 border border-glass-border text-sm text-text-secondary whitespace-pre-line">
          {data.brand_narrative}
        </div>
      </div>

      {/* Story Arc */}
      {data.story_arc && (
        <div>
          <h4 className="text-sm font-semibold text-text-primary mb-3">Arco Narrativo</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { label: 'Herói', value: data.story_arc.hero, color: 'border-galaxy-blue/30 bg-galaxy-blue/5' },
              { label: 'Conflito', value: data.story_arc.conflict, color: 'border-red-500/30 bg-red-500/5' },
              { label: 'Resolução', value: data.story_arc.resolution, color: 'border-green-500/30 bg-green-500/5' },
            ].map((arc, i) => (
              <div key={i} className={cn('rounded-lg p-3 border', arc.color)}>
                <div className="text-[10px] font-bold uppercase tracking-wide text-text-muted mb-1">{arc.label}</div>
                <p className="text-xs text-text-secondary">{arc.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Stories */}
      <div>
        <h4 className="text-sm font-semibold text-text-primary mb-3">Histórias-Chave</h4>
        <div className="space-y-3">
          {data.key_stories?.map((story, i) => (
            <div key={i} className="bg-white/5 rounded-lg p-3 border border-glass-border">
              <div className="text-xs font-bold text-galaxy-blue-light mb-2">{story.title}</div>
              <p className="text-xs text-text-secondary mb-2 whitespace-pre-line">{story.narrative}</p>
              {story.content_format && (
                <p className="text-[10px] text-text-muted italic">{story.content_format}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Storydoing Actions */}
      <div>
        <h4 className="text-sm font-semibold text-text-primary mb-3">Ações de Storydoing</h4>
        <div className="space-y-2">
          {data.storydoing_actions?.map((action, i) => (
            <div key={i} className="flex gap-3 items-start">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-galaxy-purple/20 border border-galaxy-purple/40 flex items-center justify-center text-[10px] font-bold text-galaxy-purple-light">
                {i + 1}
              </div>
              <div className="flex-1 bg-white/5 rounded-lg p-2.5 border border-glass-border">
                <div className="text-xs font-semibold text-text-primary mb-1">{action.action}</div>
                <p className="text-xs text-text-secondary mb-1">{action.objective}</p>
                {action.content_opportunity && (
                  <p className="text-[10px] text-text-muted italic">{action.content_opportunity}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function GraphicApproachRenderer({ data }: { data: GraphicApproachContent }) {
  return (
    <div className="space-y-5">
      {/* Visual Personality */}
      <div>
        <h4 className="text-sm font-semibold text-text-primary mb-2">Personalidade Visual</h4>
        <div className="bg-white/5 rounded-lg p-3 border border-glass-border text-sm text-text-secondary whitespace-pre-line">
          {data.visual_personality}
        </div>
      </div>

      {/* Color & Typography */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="text-sm font-semibold text-text-primary mb-2">Diretrizes de Cor</h4>
          <p className="text-xs text-text-secondary bg-white/5 rounded-lg p-3 border border-glass-border">
            {data.color_guidelines}
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-text-primary mb-2">Tipografia</h4>
          <p className="text-xs text-text-secondary bg-white/5 rounded-lg p-3 border border-glass-border">
            {data.typography_suggestions}
          </p>
        </div>
      </div>

      {/* Mood Board */}
      {data.mood_board_references?.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-text-primary mb-2">Referências de Mood Board</h4>
          <div className="flex flex-wrap gap-2">
            {data.mood_board_references.map((ref, i) => (
              <span key={i} className="px-2 py-1 rounded-lg text-xs bg-white/5 text-text-secondary border border-glass-border">
                {ref}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Dos and Don'ts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="text-sm font-semibold text-green-400 mb-2">Pode fazer</h4>
          <ul className="space-y-1">
            {data.dos?.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-text-secondary">
                <CheckCircle2 size={12} className="text-green-400 mt-0.5 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-red-400 mb-2">Não fazer</h4>
          <ul className="space-y-1">
            {data.donts?.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-text-secondary">
                <AlertTriangle size={12} className="text-red-400 mt-0.5 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Style per content type */}
      {data.style_per_type?.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-text-primary mb-3">Estilo por Tipo de Conteúdo</h4>
          <div className="space-y-2">
            {data.style_per_type.map((item, i) => (
              <div key={i} className="bg-white/5 rounded-lg p-3 border border-glass-border">
                <div className="text-xs font-bold text-galaxy-blue-light mb-1">{item.content_type}</div>
                <p className="text-xs text-text-secondary mb-1">{item.style}</p>
                <div className="flex gap-3 text-[10px] text-text-muted">
                  {item.color_emphasis && <span>Cor: {item.color_emphasis}</span>}
                  {item.typography_emphasis && <span>Tipografia: {item.typography_emphasis}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── System content dispatcher ─────────────────────────────────────────────────

function SystemContent({ type, contentJson }: { type: StrategicSystemType; contentJson: unknown }) {
  if (!contentJson) return null;

  switch (type) {
    case 'content_arch':
      return <ContentArchRenderer data={contentJson as ContentArchContent} />;
    case 'format_proportion':
      return <FormatProportionRenderer data={contentJson as FormatProportionContent} />;
    case 'theme_proportion':
      return <ThemeProportionRenderer data={contentJson as ThemeProportionContent} />;
    case 'campaign_structure':
      return <CampaignStructureRenderer data={contentJson as CampaignStructureContent} />;
    case 'creatives_per_phase':
      return <CreativesPerPhaseRenderer data={contentJson as CreativesPerPhaseContent} />;
    case 'lead_funnel':
      return <LeadFunnelRenderer data={contentJson as LeadFunnelContent} />;
    case 'mql_funnel':
      return <MqlFunnelRenderer data={contentJson as MqlFunnelContent} />;
    case 'editorial_calendar':
      return <EditorialCalendarRenderer data={contentJson as EditorialCalendarContent} />;
    case 'copy_manual':
      return <CopyManualRenderer data={contentJson as CopyManualContent} />;
    case 'storytelling_storydoing':
      return <StorytellingStorydoingRenderer data={contentJson as StorytellingStorydoingContent} />;
    case 'graphic_approach':
      return <GraphicApproachRenderer data={contentJson as GraphicApproachContent} />;
    default:
      return <pre className="text-xs text-text-muted">{JSON.stringify(contentJson, null, 2)}</pre>;
  }
}

// ── Accordion item ────────────────────────────────────────────────────────────

function SystemAccordionItem({
  item,
  isOpen,
  onToggle,
  isGenerating,
  onGenerate,
  canGenerate,
}: {
  item: SystemMetaItem;
  isOpen: boolean;
  onToggle: () => void;
  isGenerating: boolean;
  onGenerate: () => void;
  canGenerate: boolean;
}) {
  const { type, scopeApplicable, generated, system } = item;
  const label = SYSTEM_LABELS[type];

  return (
    <div className={cn('border rounded-xl overflow-hidden transition-all', isOpen ? 'border-galaxy-blue/40' : 'border-glass-border')}>
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          {generated ? (
            <CheckCircle2 size={14} className="text-green-400 flex-shrink-0" />
          ) : (
            <Clock size={14} className="text-text-muted flex-shrink-0" />
          )}
          <span className={cn('text-sm font-medium', generated ? 'text-text-primary' : 'text-text-secondary')}>
            {label}
          </span>
          {!scopeApplicable && (
            <span className="text-[10px] px-1.5 py-0.5 rounded border border-yellow-500/30 bg-yellow-500/10 text-yellow-400">
              Fora do escopo
            </span>
          )}
          {generated && !isOpen && (
            <span className="text-[10px] px-1.5 py-0.5 rounded border border-green-500/30 bg-green-500/10 text-green-400">
              Gerado
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {canGenerate && scopeApplicable && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onGenerate();
              }}
              disabled={isGenerating}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all border',
                isGenerating
                  ? 'opacity-50 cursor-not-allowed border-glass-border text-text-muted'
                  : 'border-galaxy-blue/40 text-galaxy-blue-light hover:bg-galaxy-blue/10'
              )}
            >
              {isGenerating ? (
                <Loader2 size={10} className="animate-spin" />
              ) : (
                <Sparkles size={10} />
              )}
              {generated ? 'Regenerar' : 'Gerar'}
            </button>
          )}
          {isOpen ? <ChevronUp size={14} className="text-text-muted" /> : <ChevronDown size={14} className="text-text-muted" />}
        </div>
      </button>

      {/* Content */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-4 py-4 border-t border-glass-border">
              {isGenerating ? (
                <div className="flex items-center justify-center py-8 gap-2 text-text-muted">
                  <Loader2 size={16} className="animate-spin" />
                  <span className="text-sm">Gerando {label}...</span>
                </div>
              ) : generated && system?.content_json ? (
                <SystemContent type={type} contentJson={system.content_json} />
              ) : (
                <div className="text-center py-8 text-text-muted">
                  <p className="text-sm">Este sistema ainda não foi gerado.</p>
                  {canGenerate && scopeApplicable && (
                    <p className="text-xs mt-1">Clique em "Gerar" para criar com IA.</p>
                  )}
                  {!scopeApplicable && (
                    <p className="text-xs mt-1">Este sistema não se aplica ao escopo de serviços do cliente.</p>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── SystemsPage ───────────────────────────────────────────────────────────────

export function SystemsPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const { user } = useAuth();
  const canGenerate = user?.role === 'super_admin' || user?.role === 'account' || user?.role === 'coordenador';

  const { data: systems, isLoading, error } = useStrategicSystems(clientId);
  const generateSystem = useGenerateSystem(clientId);
  const generateAll = useGenerateAllSystems(clientId);

  const [openItems, setOpenItems] = useState<Set<StrategicSystemType>>(new Set());
  const [generatingType, setGeneratingType] = useState<StrategicSystemType | null>(null);

  const toggleItem = (type: StrategicSystemType) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  const handleGenerate = async (type: StrategicSystemType) => {
    setGeneratingType(type);
    if (!openItems.has(type)) {
      setOpenItems((prev) => new Set([...prev, type]));
    }
    try {
      await generateSystem.mutateAsync(type);
    } finally {
      setGeneratingType(null);
    }
  };

  const handleGenerateAll = async () => {
    await generateAll.mutateAsync();
  };

  const generatedCount = systems?.filter((s) => s.generated).length ?? 0;
  const totalApplicable = systems?.filter((s) => s.scopeApplicable).length ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex-1 min-h-0 overflow-y-auto"
    >
      <div className="p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <PageHeader
            title="Sistemas Estratégicos"
            subtitle={
              systems
                ? `${generatedCount} de ${totalApplicable} sistemas gerados`
                : 'Carregando sistemas...'
            }
            actions={
              canGenerate ? (
                <GradientButton
                  onClick={handleGenerateAll}
                  disabled={generateAll.isPending}
                  className="flex items-center gap-2 text-sm"
                >
                  {generateAll.isPending ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Sparkles size={14} />
                  )}
                  Gerar Todos os Sistemas
                </GradientButton>
              ) : undefined
            }
          />
        </div>

        {/* Generate All Result */}
        {generateAll.isSuccess && (
          <GlassCard className="mb-4 p-3">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 size={14} className="text-green-400" />
              <span className="text-text-primary">
                Geração concluída: {generateAll.data.summary.success} sucesso,{' '}
                {generateAll.data.summary.error} erros,{' '}
                {generateAll.data.summary.skipped} fora do escopo.
              </span>
            </div>
          </GlassCard>
        )}

        {generateAll.isError && (
          <GlassCard className="mb-4 p-3">
            <div className="flex items-center gap-2 text-sm">
              <AlertTriangle size={14} className="text-red-400" />
              <span className="text-red-400">Erro ao gerar sistemas. Tente novamente.</span>
            </div>
          </GlassCard>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-20 gap-2 text-text-muted">
            <Loader2 size={18} className="animate-spin" />
            <span>Carregando sistemas estratégicos...</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <GlassCard className="p-4">
            <div className="flex items-center gap-2 text-red-400">
              <AlertTriangle size={16} />
              <span className="text-sm">Erro ao carregar sistemas. Tente recarregar a página.</span>
            </div>
          </GlassCard>
        )}

        {/* Systems Accordion */}
        {systems && (
          <div className="space-y-2">
            {systems.map((item) => (
              <SystemAccordionItem
                key={item.type}
                item={item}
                isOpen={openItems.has(item.type)}
                onToggle={() => toggleItem(item.type)}
                isGenerating={generatingType === item.type || (generateAll.isPending && item.scopeApplicable && !item.generated)}
                onGenerate={() => handleGenerate(item.type)}
                canGenerate={canGenerate}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
