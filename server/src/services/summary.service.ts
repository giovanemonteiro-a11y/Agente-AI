export interface GenerateSummaryOptions {
  clientId: string;
  strategyId?: string;
  meetingIds?: string[];
  forceRegenerate?: boolean;
}

export async function getSummaryByClient(_clientId: string): Promise<unknown> {
  throw new Error('Not implemented');
}

export async function generateSummary(_options: GenerateSummaryOptions): Promise<unknown> {
  throw new Error('Not implemented');
}

export async function updateSummary(
  _id: string,
  _summaryJson: Record<string, unknown>,
  _brandProfileJson?: Record<string, unknown>
): Promise<unknown> {
  throw new Error('Not implemented');
}

export async function approveSummary(_id: string, _approvedBy: string): Promise<void> {
  throw new Error('Not implemented');
}
