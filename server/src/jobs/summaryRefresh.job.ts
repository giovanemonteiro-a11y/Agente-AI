import { Job } from 'bull';
import { summaryRefreshQueue } from './queue';
import { logger } from '../utils/logger';

export interface SummaryRefreshJobData {
  clientId: string;
  triggeredBy?: string;
}

summaryRefreshQueue.process(async (job: Job<SummaryRefreshJobData>) => {
  const { clientId } = job.data;

  logger.info(`Starting summary refresh for client ${clientId}`);

  try {
    // TODO: Implement summary refresh logic
    logger.info(`Summary refresh complete for client ${clientId}`);
    return { clientId };
  } catch (error) {
    logger.error(`Summary refresh failed for client ${clientId}:`, error);
    throw error;
  }
});

export async function enqueueSummaryRefresh(data: SummaryRefreshJobData): Promise<string> {
  const job = await summaryRefreshQueue.add(data);
  return String(job.id);
}
