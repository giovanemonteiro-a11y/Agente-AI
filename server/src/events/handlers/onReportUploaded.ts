import { eventBus } from '../eventBus';
import { enqueueBIRefresh } from '../../jobs/biRefresh.job';
import { logger } from '../../utils/logger';

eventBus.on('report:uploaded', async ({ reportId, clientId }) => {
  logger.info(`Handler: report:uploaded — reportId=${reportId}, clientId=${clientId}`);

  try {
    // Trigger BI refresh for the client
    await enqueueBIRefresh({ type: 'individual', clientId });

    // Also trigger global BI refresh
    await enqueueBIRefresh({ type: 'global' });

    logger.info(`Handler: report:uploaded completed for reportId=${reportId}`);
  } catch (error) {
    logger.error(`Handler: report:uploaded failed:`, error);
  }
});
