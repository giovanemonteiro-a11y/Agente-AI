export interface Strategy {
  id: string;
  client_id: string;
  version: number;
  objectives: string;
  positioning: string;
  differentials: string;
  tone: string;
  products: string;
  expected_results: string;
  created_by: string;
  created_at: string;
}

export interface CreateStrategyPayload {
  objectives: string;
  positioning: string;
  differentials: string;
  tone: string;
  products: string;
  expected_results: string;
}

export interface GapItem {
  field: string;
  severity: 'high' | 'medium' | 'low';
  suggested_question: string;
}

export interface HighlightItem {
  excerpt: string;
  relevance: string;
  meeting_type: 'kickoff' | 'checkin' | null;
  recorded_at: string | null;
}
