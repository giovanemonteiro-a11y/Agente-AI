// ── Strategic System types (Phase 6) ─────────────────────────────────────────

export type StrategicSystemType =
  | 'content_arch'
  | 'format_proportion'
  | 'theme_proportion'
  | 'campaign_structure'
  | 'creatives_per_phase'
  | 'lead_funnel'
  | 'mql_funnel'
  | 'editorial_calendar'
  | 'copy_manual'
  | 'storytelling_storydoing'
  | 'graphic_approach';

export interface StrategicSystem {
  id: string;
  client_id: string;
  cohort_id: string | null;
  type: StrategicSystemType;
  scope: string | null;
  content_json: unknown; // typed per system type below
  created_at: string;
  updated_at: string;
}

// ── Per-type content shapes (used for rendering) ──────────────────────────────

export interface ContentArchPillar {
  name: string;
  description: string;
  content_types: string[];
  frequency: string;
}

export interface ContentArchFunnelStage {
  stage: 'awareness' | 'consideration' | 'conversion';
  content_types: string[];
  messages: string[];
}

export interface ContentArchContent {
  social_media: { pillars: ContentArchPillar[] };
  campaigns: { funnel_stages: ContentArchFunnelStage[] };
}

export interface FormatItem {
  format: string;
  percentage: number;
  rationale: string;
}

export interface FormatProportionContent {
  social_media: FormatItem[];
  campaigns: FormatItem[];
}

export interface ThemeItem {
  theme: string;
  percentage: number;
  description: string;
  examples: string[];
}

export type ThemeProportionContent = ThemeItem[];

export interface CampaignStructureItem {
  objective: string;
  funnel_stages: string[];
  audience_strategy: string;
  budget_distribution: string;
  timeline: string;
}

export type CampaignStructureContent = CampaignStructureItem[];

export interface CreativePerPhaseItem {
  phase: string;
  formats: string[];
  messages: string[];
  ctas: string[];
  audience_cohort: string;
  visual_tone: string;
}

export type CreativesPerPhaseContent = CreativePerPhaseItem[];

export interface LeadFunnelStage {
  stage: string;
  conversion_rate: string;
  actions: string[];
  drop_off_reasons?: string[];
  optimization_tips?: string[];
}

export interface LeadFunnelContent {
  stages: LeadFunnelStage[];
  total_journey: string;
}

export interface QualificationCriterion {
  criterion: string;
  weight: string;
  signals: string[];
}

export interface NurturingTouchpoint {
  touchpoint: string;
  timing: string;
  objective: string;
  channel: string;
}

export interface MqlFunnelContent {
  qualification_criteria: QualificationCriterion[];
  nurturing_touchpoints: NurturingTouchpoint[];
  handoff_process: string;
}

export interface WeeklyCalendarDay {
  day: string;
  content_type: string;
  theme: string;
  cohort: string;
  format: string;
  platform: string;
  responsible: string;
}

export interface MonthlyCalendarWeek {
  week: number;
  focus_theme: string;
  posts_count: number;
  key_dates: string[];
  campaign_alignment?: string;
}

export interface EditorialCalendarContent {
  weekly_model: WeeklyCalendarDay[];
  monthly_model: MonthlyCalendarWeek[];
}

export interface CopyExample {
  type: string;
  context?: string;
  example: string;
}

export interface CopyManualContent {
  voice_guidelines: string;
  headline_formulas: string[];
  cta_patterns: string[];
  vocabulary: { use: string[]; avoid: string[] };
  copy_examples: CopyExample[];
}

export interface StoryArc {
  hero: string;
  conflict: string;
  resolution: string;
}

export interface KeyStory {
  title: string;
  narrative: string;
  content_format?: string;
}

export interface StorydoingAction {
  action: string;
  objective: string;
  content_opportunity?: string;
}

export interface StorytellingStorydoingContent {
  brand_narrative: string;
  story_arc: StoryArc;
  key_stories: KeyStory[];
  storydoing_actions: StorydoingAction[];
}

export interface StylePerType {
  content_type: string;
  style: string;
  color_emphasis?: string;
  typography_emphasis?: string;
}

export interface GraphicApproachContent {
  visual_personality: string;
  color_guidelines: string;
  typography_suggestions: string;
  mood_board_references: string[];
  dos: string[];
  donts: string[];
  style_per_type: StylePerType[];
}

// ── Hub page list item shape (from GET /api/systems/:clientId) ────────────────

export interface SystemMetaItem {
  type: StrategicSystemType;
  scopeApplicable: boolean;
  generated: boolean;
  system: StrategicSystem | null;
}

// ── Display labels ─────────────────────────────────────────────────────────────

export const SYSTEM_LABELS: Record<StrategicSystemType, string> = {
  content_arch: 'Arquitetura de Conteúdo',
  format_proportion: 'Proporção Ideal de Formatos',
  theme_proportion: 'Proporção Ideal de Assuntos/Temas',
  campaign_structure: 'Estrutura de Campanhas',
  creatives_per_phase: 'Criativos por Fase do Funil',
  lead_funnel: 'Funil de Leads',
  mql_funnel: 'Funil de MQL',
  editorial_calendar: 'Calendário Editorial',
  copy_manual: 'Manual de Copy',
  storytelling_storydoing: 'Manual de Storytelling e Storydoing',
  graphic_approach: 'Abordagem Gráfica',
};

export const ALL_SYSTEM_TYPES: StrategicSystemType[] = [
  'content_arch',
  'format_proportion',
  'theme_proportion',
  'campaign_structure',
  'creatives_per_phase',
  'lead_funnel',
  'mql_funnel',
  'editorial_calendar',
  'copy_manual',
  'storytelling_storydoing',
  'graphic_approach',
];
