import { SprintSource } from '../types/index';

export interface SyncSprintOptions {
  clientId: string;
  source: SprintSource;
  sourceUrl?: string;
  boardId?: string;
}

export async function listSprintData(_clientId?: string): Promise<unknown[]> {
  throw new Error('Not implemented');
}

export async function syncSprintData(_options: SyncSprintOptions): Promise<unknown> {
  throw new Error('Not implemented');
}

export async function getSprintDataById(_id: string): Promise<unknown> {
  throw new Error('Not implemented');
}
