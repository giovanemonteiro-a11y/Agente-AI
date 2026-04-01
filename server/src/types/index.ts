export type UserRole = 'super_admin' | 'lideranca' | 'aquisicao' | 'coordenador' | 'account' | 'designer' | 'gestor_trafego' | 'tech_crm'
export type MeetingType = 'kickoff' | 'checkin'
export type ServiceScope = 'social_media' | 'trafego' | 'site_lp' | 'ecommerce' | 'branding' | 'miv'
export type DesignerScope = 'social_media' | 'campanha' | 'landing_page' | 'site' | 'ecommerce' | 'branding' | 'miv'
export type BriefingType = 'designer' | 'traffic' | 'account' | 'site'
export type StrategicSystemType =
  | 'empathy_map' | 'content_arch' | 'format_proportion' | 'theme_proportion'
  | 'campaign_structure' | 'creatives_per_phase' | 'lead_funnel' | 'mql_funnel'
  | 'editorial_calendar' | 'copy_manual' | 'storytelling_storydoing' | 'graphic_approach'
export type SprintSource = 'monday' | 'sheets'
export type BIType = 'individual' | 'global'

export interface JWTPayload {
  userId: string
  email: string
  role: UserRole
  must_reset_password?: boolean
  modules?: string[]
}

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload
    }
  }
}
