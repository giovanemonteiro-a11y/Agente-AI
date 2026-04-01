export type ServiceScope = 'social_media' | 'trafego' | 'site_lp' | 'ecommerce' | 'branding' | 'miv';
export type DesignerScope = 'social_media' | 'campanha' | 'landing_page' | 'site' | 'ecommerce' | 'branding' | 'miv';
export type ClientStatus = 'active' | 'paused' | 'churned';
export type ChurnSeverity = 'leve' | 'moderado' | 'severo' | 'preocupante';
export type ClientSource = 'handoff' | 'base' | 'portfolio';
export type ClientType = 'recorrente' | 'one_time';
export type ChurnProbability = 'baixa' | 'media' | 'alta' | 'critica';

export interface TeamAllocation {
  account?: { included: boolean; dedication: number };
  designer?: { included: boolean; dedication: number };
  gestor_trafego?: { included: boolean; dedication: number };
}

export interface MonetizationEntry {
  type: 'upsell' | 'crosssell' | 'downsell';
  description: string;
  date: string;
  value: number;
}

export interface ProjectCost {
  type: 'viagem' | 'materiais' | 'divulgacao' | 'eventos' | 'outro';
  description: string;
  value: number;
}

export interface ClientGoal {
  goal: string;
  achieved: boolean;
  metric?: string;
}

export interface Client {
  id: string;
  name: string;
  segment: string | null;
  services_scope: ServiceScope[];
  designer_scope: DesignerScope[];
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  start_date: string | null;
  status: ClientStatus;
  drive_folder_id: string | null;
  drive_folder_url: string | null;
  whatsapp_group_id: string | null;
  sheets_sprint_url: string | null;
  monday_board_id: string | null;
  created_at: string;

  // Coordinator ownership
  coordinator_id?: string | null;
  trio_id?: string | null;
  source?: ClientSource;

  // Extended company info
  razao_social?: string | null;
  cnpj?: string | null;
  stakeholder_name?: string | null;
  stakeholders?: string[];
  niche?: string | null;

  // Project info
  contract_url?: string | null;
  recording_url?: string | null;
  lt_days?: number | null;
  lt_start_date?: string | null;
  is_new?: boolean;
  new_until?: string | null;
  handoff_id?: string | null;

  // Financial info
  client_type?: ClientType;
  fee_value?: number | null;
  media_investment?: number | null;
  expected_margin?: number | null;
  contract_period?: string | null;

  // Client goals & KPIs
  client_goals?: ClientGoal[];
  roi_target?: number | null;
  roi_achieved?: number | null;
  roi_achieved_flag?: boolean;

  // Stakeholder updates
  stakeholder_updated?: boolean;
  planning_up_to_date?: boolean;
  fee_payment_up_to_date?: boolean;
  churn_probability?: ChurnProbability;

  // Team allocation
  team_allocation?: TeamAllocation;
  decision_maker?: string | null;

  // History
  monetization_history?: MonetizationEntry[];
  project_costs?: ProjectCost[];

  // Churn system
  churned_at?: string | null;
  churn_reason?: string | null;
  churn_severity?: ChurnSeverity | null;
  churn_detail?: string | null;

  // Tratativa system
  in_tratativa?: boolean;
  tratativa_reason?: string | null;
  tratativa_deadline?: string | null;
  tratativa_started_at?: string | null;
}

export interface CreateClientPayload {
  name: string;
  segment?: string;
  services_scope?: ServiceScope[];
  designer_scope?: DesignerScope[];
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  start_date?: string;
}

export interface CreateBaseClientPayload {
  name: string;
  razao_social?: string;
  cnpj?: string;
  stakeholders?: string[];
  niche?: string;
  start_date?: string;
  lt_days?: number;
  services_scope?: ServiceScope[];
  designer_scope?: DesignerScope[];
  contract_url?: string;
  whatsapp_group_id?: string;
  drive_folder_url?: string;
  client_type?: ClientType;
  fee_value?: number;
  media_investment?: number;
  expected_margin?: number;
  contract_period?: string;
  client_goals?: ClientGoal[];
  roi_target?: number;
  roi_achieved?: number;
  roi_achieved_flag?: boolean;
  stakeholder_updated?: boolean;
  planning_up_to_date?: boolean;
  fee_payment_up_to_date?: boolean;
  churn_probability?: ChurnProbability;
  team_allocation?: TeamAllocation;
  decision_maker?: string;
  trio_id?: string;
  monetization_history?: MonetizationEntry[];
  project_costs?: ProjectCost[];
  source?: ClientSource;
}

export interface UpdateClientPayload extends Partial<CreateClientPayload> {
  status?: ClientStatus;
  drive_folder_id?: string;
  drive_folder_url?: string;
  whatsapp_group_id?: string;
  sheets_sprint_url?: string;
  monday_board_id?: string;
}

export interface ChurnPayload {
  churn_reason: string;
  churn_severity: ChurnSeverity;
  churn_detail: string;
}

export interface TratativaPayload {
  tratativa_reason: string;
  tratativa_deadline: string;
}
