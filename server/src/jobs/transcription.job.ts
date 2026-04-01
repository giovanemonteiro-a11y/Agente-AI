import { Job } from 'bull';
import { transcriptionQueue } from './queue';
import { transcribeAudioFile } from '../services/transcription.service';
import { updateMeetingTranscript, updateMeetingStatus } from '../repositories/meetings.repository';
import { logger } from '../utils/logger';
import { eventBus } from '../events/eventBus';
import fs from 'fs';
import path from 'path';

export interface TranscriptionJobData {
  meetingId: string;
  filePath: string;
  clientId: string;
}

transcriptionQueue.process(async (job: Job<TranscriptionJobData>) => {
  const { meetingId, filePath, clientId } = job.data;

  logger.info(`Starting transcription for meeting ${meetingId}`);

  try {
    await updateMeetingStatus(meetingId, 'transcribing');

    // transcribeAudioFile handles the case where OpenAI is not configured
    // by returning a mock transcript string instead of throwing.
    const result = await transcribeAudioFile(filePath);

    await updateMeetingTranscript(meetingId, result.text);

    eventBus.emit('meeting:transcribed', { meetingId, clientId });

    logger.info(`Transcription complete for meeting ${meetingId}`);

    // Clean up the uploaded temp file after successful transcription
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        logger.info(`Cleaned up temp file: ${path.basename(filePath)}`);
      }
    } catch (cleanupErr) {
      logger.warn(`Could not delete temp file ${filePath}:`, cleanupErr);
    }

    return { meetingId, textLength: result.text.length };
  } catch (error) {
    logger.error(`Transcription failed for meeting ${meetingId}:`, error);
    try {
      await updateMeetingStatus(meetingId, 'failed');
    } catch (statusErr) {
      logger.error(`Could not update meeting status to failed for ${meetingId}:`, statusErr);
    }
    throw error;
  }
});

transcriptionQueue.on('completed', (job) => {
  logger.info(`Transcription job ${job.id} completed`);
});

transcriptionQueue.on('failed', (job, err) => {
  logger.error(`Transcription job ${job?.id} failed:`, err);
});

/**
 * Enqueue a transcription job.
 * Falls back gracefully if Bull/Redis is unavailable (the fallback queue handles it).
 */
export async function enqueueTranscription(data: TranscriptionJobData): Promise<string> {
  try {
    const job = await transcriptionQueue.add(data, { priority: 1 });
    return String(job.id);
  } catch (err) {
    logger.warn(`Failed to enqueue transcription job — running inline:`, err);
    // Direct async fallback (fire-and-forget)
    setImmediate(async () => {
      try {
        await updateMeetingStatus(data.meetingId, 'transcribing');
        const result = await transcribeAudioFile(data.filePath);
        await updateMeetingTranscript(data.meetingId, result.text);
        eventBus.emit('meeting:transcribed', { meetingId: data.meetingId, clientId: data.clientId });
      } catch (fallbackErr) {
        logger.error(`Inline transcription fallback failed for ${data.meetingId}:`, fallbackErr);
        try {
          await updateMeetingStatus(data.meetingId, 'failed');
        } catch { /* ignore */ }
      }
    });
    return 'inline-fallback';
  }
}
