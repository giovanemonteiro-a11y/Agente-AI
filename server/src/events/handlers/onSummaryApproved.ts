import { eventBus } from '../eventBus';
import { logger } from '../../utils/logger';

// When a summary is approved, SM/DG/GT access is unlocked automatically because
// the controller's GET handler checks `approved_at` from the DB.
// No additional DB mutations are required here.

eventBus.on('summary:approved', async ({ summaryId, clientId, approvedBy }) => {
  logger.info(
    `Handler: summary:approved — summaryId=${summaryId}, clientId=${clientId}, approvedBy=${approvedBy}`
  );

  try {
    // Access for restricted roles (social_media, designer, gestor_trafego) is
    // unlocked automatically: the GET /api/summary/:clientId endpoint checks
    // approved_at on the DB row and will now allow access.
    //
    // Future extension point:
    // - Trigger cohort generation pipeline
    // - Send in-app notifications to SM/DG/GT team members
    // - Log approval event to audit trail

    logger.info(`Handler: summary:approved completed for summaryId=${summaryId}`);
  } catch (error) {
    logger.error(`Handler: summary:approved failed:`, error);
  }
});
