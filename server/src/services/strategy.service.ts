export interface CreateStrategyPayload {
  client_id: string;
  objectives?: string;
  positioning?: string;
  differentials?: string;
  tone?: string;
  products?: string;
  expected_results?: string;
  created_by: string;
}

export async function listStrategies(_clientId?: string): Promise<unknown[]> {
  throw new Error('Not implemented');
}

export async function createStrategy(_payload: CreateStrategyPayload): Promise<unknown> {
  throw new Error('Not implemented');
}

export async function getStrategyById(_id: string): Promise<unknown> {
  throw new Error('Not implemented');
}

export async function updateStrategy(
  _id: string,
  _payload: Partial<CreateStrategyPayload>
): Promise<unknown> {
  throw new Error('Not implemented');
}

export async function getLatestStrategyForClient(_clientId: string): Promise<unknown> {
  throw new Error('Not implemented');
}
