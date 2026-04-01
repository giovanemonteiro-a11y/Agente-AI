import { eventBus } from '../eventBus';
import { logger } from '../../utils/logger';

eventBus.on('briefing:sent', async ({ briefingId, clientId, type }) => {
  logger.info(`Handler: briefing:sent — briefingId=${briefingId}, clientId=${clientId}, type=${type}`);

  try {
    // TODO: Log to audit trail
    // TODO: Update Monday.com item status
    // TODO: Notify assigned team member
    logger.info(`Handler: briefing:sent completed for briefingId=${briefingId}`);
  } catch (error) {
    logger.error(`Handler: briefing:sent failed:`, error);
  }
});
