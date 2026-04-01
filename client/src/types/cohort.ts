export interface DemographicProfile {
  ageRange: string;
  gender: string;
  location: string;
  income: string;
  education: string;
  occupation: string;
  familySituation: string;
}

export interface EmpathyMap {
  id?: string;
  cohort_id?: string;
  pensa_sente: string;
  ve: string;
  ouve: string;
  fala_faz: string;
  dores: string;
  ganhos: string;
}

export interface Cohort {
  id: string;
  client_id: string;
  characteristic_phrase: string;
  anthropological_description: string;
  demographic_profile_json: DemographicProfile;
  behavior_lifestyle: string;
  audience_size: string;
  reach_potential: string;
  triggers: string[];
  alternative_solutions: string[];
  indicators: string[];
  editorial_lines: string[];
  empathy_map?: EmpathyMap | null;
  created_at: string;
  updated_at: string;
}

export interface CohortsListResponse {
  data: Cohort[];
  scopeNotApplicable: boolean;
}

export interface StrategicSystemRow {
  id: string;
  client_id: string;
  cohort_id: string | null;
  type: string;
  scope: string | null;
  content_json: EmpathyMap;
  created_at: string;
  updated_at: string;
}
