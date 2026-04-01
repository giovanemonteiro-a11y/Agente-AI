import { Job } from 'bull';
import { sheetsSyncQueue } from './queue';
import { extractSprintDataFromSheet } from '../services/sheets.service';
import { query } from '../config/database';
import { logger } from '../utils/logger';

export interface SheetsSyncJobData {
  clientId: string;
  spreadsheetId: string;
  accessToken?: string;
}

async function upsertSprintData(
  clientId: string,
  rows: Record<string, unknown>[]
): Promise<number> {
  if (rows.length === 0) return 0;

  let upserted = 0;

  for (const row of rows) {
    try {
      // Use a task name / title field as natural key if available, else use all data
      const taskName =
        (row['task'] as string | undefined) ??
        (row['name'] as string | undefined) ??
        (row['tarefa'] as string | undefined) ??
        (row['titulo'] as string | undefined) ??
        null;

      if (taskName) {
        await query(
          `INSERT INTO sprint_data (client_id, task_name, data_json, source, created_at, updated_at)
           VALUES ($1, $2, $3, 'sheets', NOW(), NOW())
           ON CONFLICT (client_id, task_name, source)
           DO UPDATE SET data_json = EXCLUDED.data_json, updated_at = NOW()`,
          [clientId, taskName, JSON.stringify(row)]
        );
      } else {
        // No natural key — always insert
        await query(
          `INSERT INTO sprint_data (client_id, task_name, data_json, source, created_at, updated_at)
           VALUES ($1, $2, $3, 'sheets', NOW(), NOW())`,
          [clientId, `row-${Date.now()}-${upserted}`, JSON.stringify(row)]
        );
      }

      upserted++;
    } catch (err) {
      logger.warn(`Failed to upsert sprint row for client ${clientId}:`, err);
    }
  }

  return upserted;
}

sheetsSyncQueue.process(async (job: Job<SheetsSyncJobData>) => {
  const { clientId, spreadsheetId, accessToken } = job.data;

  // Skip silently if Sheets integration is not configured
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY && !accessToken) {
    logger.info(`Sheets sync skipped for client ${clientId} — Google Sheets not configured`);
    return { clientId, rowsFound: 0, rowsUpserted: 0, skipped: true };
  }

  logger.info(`Starting Sheets sync for client ${clientId}`);

  try {
    const data = await extractSprintDataFromSheet(spreadsheetId, accessToken);

    logger.info(`Sheets sync found ${data.length} rows for client ${clientId}`);

    const upserted = await upsertSprintData(clientId, data);

    logger.info(`Sheets sync upserted ${upserted} rows for client ${clientId}`);

    return { clientId, rowsFound: data.length, rowsUpserted: upserted };
  } catch (error) {
    logger.error(`Sheets sync failed for client ${clientId}:`, error);
    throw error;
  }
});

sheetsSyncQueue.on('completed', (job) => {
  logger.info(`Sheets sync job ${job.id} completed`);
});

sheetsSyncQueue.on('failed', (job, err) => {
  logger.error(`Sheets sync job ${job?.id} failed:`, err);
});

export async function enqueueSheetsSync(data: SheetsSyncJobData): Promise<string> {
  const job = await sheetsSyncQueue.add(data);
  return String(job.id);
}
