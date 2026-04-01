import { BriefingType } from '../types/index';

export interface GenerateBriefingOptions {
  clientId: string;
  type: BriefingType;
  sprintIds?: string[];
  whatsappMessageIds?: string[];
  assignedToUserId?: string;
}

export async function listBriefings(_clientId?: string): Promise<unknown[]> {
  throw new Error('Not implemented');
}

export async function generateBriefing(_options: GenerateBriefingOptions): Promise<unknown> {
  throw new Error('Not implemented');
}

export async function createBriefing(_payload: Record<string, unknown>): Promise<unknown> {
  throw new Error('Not implemented');
}

export async function getBriefingById(_id: string): Promise<unknown> {
  throw new Error('Not implemented');
}

export async function updateBriefing(
  _id: string,
  _payload: Record<string, unknown>
): Promise<unknown> {
  throw new Error('Not implemented');
}

export async function sendBriefing(_id: string): Promise<void> {
  throw new Error('Not implemented');
}
