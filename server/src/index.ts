import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { app } from './app';
import { pool } from './config/database';
import { logger } from './utils/logger';
import { closeAllQueues } from './jobs/queue';

// Import job processors — side-effect: registers Bull process() handlers
import './jobs/transcription.job';
import './jobs/driveSync.job';
import './jobs/sheetsSync.job';
import './jobs/biRefresh.job';
import './jobs/summaryRefresh.job';

// Import event handlers — side-effect: registers eventBus listeners
import './events/handlers/onMeetingTranscribed';
import './events/handlers/onSummaryApproved';
import './events/handlers/onBriefingSent';
import './events/handlers/onReportUploaded';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

async function bootstrap(): Promise<void> {
  // Test database connection — warn but don't crash if unavailable
  try {
    await pool.query('SELECT 1');
    logger.info('Database connected');
  } catch (err) {
    logger.warn('Database not available, starting without DB:', (err as Error).message);
  }

  app.listen(PORT, () => {
    logger.info(
      `Server running on http://localhost:${PORT} in ${process.env.NODE_ENV ?? 'development'} mode`
    );
  });
}

// ─── Graceful shutdown ────────────────────────────────────────────────────────

async function shutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal} — shutting down gracefully`);
  try {
    await closeAllQueues();
    await pool.end();
  } catch (err) {
    logger.error('Error during shutdown:', err);
  }
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

bootstrap().catch((err) => {
  logger.error('Fatal error during bootstrap:', err);
  process.exit(1);
});
