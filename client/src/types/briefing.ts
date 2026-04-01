export type BriefingType = 'designer' | 'traffic' | 'account' | 'site';

export type DesignerScope =
  | 'social_media'
  | 'campanha'
  | 'landing_page'
  | 'site'
  | 'branding'
  | 'miv';

// ── Role-specific content shapes ──────────────────────────────────────────────

export interface DesignerBriefing {
  title: string;
  scope_type: DesignerScope | string;
  objective: string;
  target_cohort: string;
  visual_references: string[];
  deliverables: {
    item: string;
    format: string;
    dimensions: string;
    quantity: number;
  }[];
  tone_and_style: string;
  copy_references: string[];
  deadline_suggestion: string;
  additional_notes: string;
}

export interface TrafficBriefing {
  title: string;
  objective: 'awareness' | 'leads' | 'conversion' | 'retargeting' | string;
  budget_suggestion: string;
  audience_segments: {
    name: string;
    cohort_reference: string;
    targeting_criteria: string;
  }[];
  funnel_stages: {
    stage: string;
    message: string;
    creative_specs: string;
    cta: string;
  }[];
  platforms: string[];
  copy_variants: {
    stage: string;
    headline: string;
    body: string;
    cta: string;
  }[];
  success_metrics: {
    metric: string;
    target: string;
  }[];
  additional_notes: string;
}

export interface AccountBriefing {
  title: string;
  period: string;
  client_status: string;
  priorities: {
    item: string;
    urgency: 'high' | 'medium' | 'low';
  }[];
  pending_decisions: string[];
  checkin_prep: string[];
  team_coordination: {
    team_member_role: string;
    action_needed: string;
  }[];
  risks_and_opportunities: string;
  additional_notes: string;
}

export interface SiteBriefing {
  title: string;
  objective: string;
  target_audience: string;
  structure: {
    section: string;
    content_needed: string;
    notes: string;
  }[];
  seo_keywords: string[];
  design_references: string[];
  technical_requirements: string[];
  copy_outline: string;
  deadline_suggestion: string;
  additional_notes: string;
}

// ── Main Briefing entity ──────────────────────────────────────────────────────

export interface Briefing {
  id: string;
  client_id: string;
  type: BriefingType;
  content_json: DesignerBriefing | TrafficBriefing | AccountBriefing | SiteBriefing;
  source_sprints: string | null;
  source_whatsapp: string | null;
  assigned_to_user_id: string | null;
  sent_at: string | null;
  monday_task_id: string | null;
  created_at: string;
}

export interface GenerateBriefingPayload {
  type: BriefingType;
  designerScope?: DesignerScope;
}
