import { Job } from 'bull';
import { biRefreshQueue } from './queue';
import { logger } from '../utils/logger';
import { refreshBI } from '../services/bi.service';

export interface BIRefreshJobData {
  type: 'individual' | 'global';
  clientId?: string;
}

biRefreshQueue.process(async (job: Job<BIRefreshJobData>) => {
  const { type, clientId } = job.data;

  logger.info(`Starting BI refresh: type=${type}, clientId=${clientId ?? 'global'}`);

  try {
    await refreshBI({ type, clientId });
    logger.info(`BI refresh complete: type=${type}`);
    return { type, clientId };
  } catch (error) {
    logger.error(`BI refresh failed:`, error);
    throw error;
  }
});

export async function enqueueBIRefresh(data: BIRefreshJobData): Promise<string> {
  const job = await biRefreshQueue.add(data);
  return String(job.id);
}
