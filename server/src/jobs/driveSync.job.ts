import { Job } from 'bull';
import { driveSyncQueue } from './queue';
import { listFilesInFolder } from '../services/drive.service';
import { findMeetingsByRecordingUrl, insertMeeting } from '../repositories/meetings.repository';
import { enqueueTranscription } from './transcription.job';
import { logger } from '../utils/logger';
import path from 'path';

export interface DriveSyncJobData {
  clientId: string;
  folderId: string;
  accessToken?: string;
}

const AUDIO_VIDEO_EXTENSIONS = new Set([
  '.mp3', '.mp4', '.m4a', '.wav', '.ogg', '.webm', '.mpeg', '.mpga', '.mov', '.avi', '.mkv',
]);

function isAudioVideoFile(filename: string): boolean {
  return AUDIO_VIDEO_EXTENSIONS.has(path.extname(filename).toLowerCase());
}

driveSyncQueue.process(async (job: Job<DriveSyncJobData>) => {
  const { clientId, folderId, accessToken } = job.data;

  logger.info(`Starting Drive sync for client ${clientId}, folder ${folderId}`);

  try {
    const files = await listFilesInFolder(folderId, accessToken);

    const audioVideoFiles = files.filter((f) => isAudioVideoFile(f.name));

    logger.info(
      `Drive sync found ${files.length} total files, ${audioVideoFiles.length} audio/video for client ${clientId}`
    );

    let queued = 0;

    for (const file of audioVideoFiles) {
      if (!file.webViewLink) continue;

      // Check whether we already have a meeting record for this Drive file
      const existing = await findMeetingsByRecordingUrl(file.webViewLink);
      if (existing) {
        logger.debug(`Drive sync: file ${file.name} already in meetings table — skipping`);
        continue;
      }

      // Create a pending meeting record
      const meeting = await insertMeeting({
        client_id: clientId,
        type: 'checkin',
        recorded_at: file.createdTime ?? new Date().toISOString(),
        recording_url: file.webViewLink,
        drive_file_id: file.id,
        processing_status: 'pending',
        participants: [],
      });

      const meetingRecord = meeting as { id: string };

      // Enqueue for transcription using the Drive web-view URL as the file path
      // (The transcription service must be able to handle a URL or local path;
      //  for Drive files the transcript will use the Drive file id as a reference.)
      await enqueueTranscription({
        meetingId: meetingRecord.id,
        filePath: file.webViewLink,
        clientId,
      });

      queued++;
      logger.info(`Drive sync: queued transcription for new file ${file.name} (meeting ${meetingRecord.id})`);
    }

    logger.info(`Drive sync complete for client ${clientId}: ${queued} new files queued`);
    return { clientId, filesFound: audioVideoFiles.length, queued };
  } catch (error) {
    logger.error(`Drive sync failed for client ${clientId}:`, error);
    throw error;
  }
});

driveSyncQueue.on('completed', (job) => {
  logger.info(`Drive sync job ${job.id} completed`);
});

driveSyncQueue.on('failed', (job, err) => {
  logger.error(`Drive sync job ${job?.id} failed:`, err);
});

/**
 * Enqueue a one-time Drive sync for a specific client folder.
 */
export async function enqueueDriveSync(data: DriveSyncJobData): Promise<string> {
  try {
    const job = await driveSyncQueue.add(data);
    return String(job.id);
  } catch (err) {
    logger.warn(`Failed to enqueue drive sync job:`, err);
    return 'enqueue-failed';
  }
}

/**
 * Schedule recurring Drive sync every 15 minutes for a client folder.
 * Safe to call multiple times — Bull deduplicates by repeat key.
 */
export async function scheduleDriveSync(data: DriveSyncJobData): Promise<void> {
  try {
    await driveSyncQueue.add(data, {
      repeat: { cron: '*/15 * * * *' },
      jobId: `drive-sync-${data.clientId}`, // stable id prevents duplicates
    });
    logger.info(`Scheduled recurring Drive sync for client ${data.clientId} (every 15 min)`);
  } catch (err) {
    logger.warn(`Could not schedule recurring Drive sync for client ${data.clientId}:`, err);
  }
}
