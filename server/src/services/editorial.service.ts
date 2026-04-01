export interface GenerateEditorialOptions {
  clientId: string;
  cohortIds?: string[];
}

export async function listEditorialLines(_clientId?: string): Promise<unknown[]> {
  throw new Error('Not implemented');
}

export async function generateEditorial(_options: GenerateEditorialOptions): Promise<unknown[]> {
  throw new Error('Not implemented');
}

export async function createEditorialLine(_payload: Record<string, unknown>): Promise<unknown> {
  throw new Error('Not implemented');
}

export async function getEditorialById(_id: string): Promise<unknown> {
  throw new Error('Not implemented');
}

export async function updateEditorialLine(
  _id: string,
  _payload: Record<string, unknown>
): Promise<unknown> {
  throw new Error('Not implemented');
}
