export interface GenerateCohortsOptions {
  clientId: string;
  summaryId?: string;
  strategyId?: string;
  minCohorts?: number;
}

export interface CreateCohortPayload {
  client_id: string;
  characteristic_phrase: string;
  anthropological_description?: string;
  demographic_profile_json?: Record<string, unknown>;
  behavior_lifestyle?: string;
  audience_size?: string;
  reach_potential?: string;
  triggers?: string[];
  alternative_solutions?: string[];
  indicators?: string[];
  editorial_lines?: string[];
}

export async function listCohorts(_clientId?: string): Promise<unknown[]> {
  throw new Error('Not implemented');
}

export async function generateCohorts(_options: GenerateCohortsOptions): Promise<unknown[]> {
  throw new Error('Not implemented');
}

export async function createCohort(_payload: CreateCohortPayload): Promise<unknown> {
  throw new Error('Not implemented');
}

export async function getCohortById(_id: string): Promise<unknown> {
  throw new Error('Not implemented');
}

export async function updateCohort(
  _id: string,
  _payload: Partial<CreateCohortPayload>
): Promise<unknown> {
  throw new Error('Not implemented');
}

export async function deleteCohort(_id: string): Promise<void> {
  throw new Error('Not implemented');
}
