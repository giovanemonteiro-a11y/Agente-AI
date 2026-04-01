import { eventBus } from '../eventBus';
import { logger } from '../../utils/logger';
import { findByClientId, upsert, resetApproval } from '../../repositories/summaries.repository';
import { findClientById } from '../../repositories/clients.repository';
import { findLatestByClientId } from '../../repositories/strategies.repository';
import { findMeetingsByClientId } from '../../repositories/meetings.repository';
import { generateSummary, assembleContext, PromptContext } from '../../services/ai/ai.service';
import { pushNotificationToUser } from '../../services/notification.service';
import { insertNotification } from '../../repositories/notifications.repository';

// Find the account user assigned to a client — naive approach: look in clients table
async function findAccountUserIdByClientId(clientId: string): Promise<string | null> {
  const client = (await findClientById(clientId)) as
    | { account_user_id?: string | null }
    | null
    | undefined;
  return client?.account_user_id ?? null;
}

eventBus.on('meeting:transcribed', async ({ meetingId, clientId }) => {
  logger.info(`Handler: meeting:transcribed — meetingId=${meetingId}, clientId=${clientId}`);

  try {
    // 1. Check if an approved summary exists for this client
    const existing = await findByClientId(clientId);

    if (!existing) {
      // No summary yet — Account must generate first
      logger.info(
        `Handler: meeting:transcribed — no summary found for client ${clientId}, skipping auto-refresh`
      );
      return;
    }

    if (!existing.approved_at) {
      // Not yet approved — skip auto-refresh
      logger.info(
        `Handler: meeting:transcribed — summary not approved for client ${clientId}, skipping auto-refresh`
      );
      return;
    }

    // 2. Re-generate summary with new transcripts context
    const client = (await findClientById(clientId)) as
      | { id: string; name: string; segment?: string; services_scope?: string[] }
      | null
      | undefined;

    if (!client) {
      logger.warn(`Handler: meeting:transcribed — client ${clientId} not found`);
      return;
    }

    const strategy = await findLatestByClientId(clientId);
    const meetings = (await findMeetingsByClientId(clientId)) as Array<{
      transcript_text?: string | null;
    }>;
    const meetingTranscripts = meetings
      .filter((m) => m.transcript_text)
      .map((m) => m.transcript_text as string);

    const context: PromptContext = {
      clientName: client.name,
      clientSegment: client.segment,
      clientServicesScope: client.services_scope,
      strategy: strategy
        ? {
            objectives: strategy.objectives,
            positioning: strategy.positioning,
            differentials: strategy.differentials,
            tone: strategy.tone,
            products: strategy.products,
            expectedResults: strategy.expected_results,
          }
        : undefined,
      meetingTranscripts,
    };

    const { summary: summaryJson, brand_profile: brandProfileJson } =
      await generateSummary(context);

    // 3. Upsert with auto_refreshed = true and reset approval
    await upsert({
      clientId,
      summaryJson: summaryJson as unknown as Record<string, unknown>,
      brandProfileJson: brandProfileJson as unknown as Record<string, unknown>,
      strategyId: strategy?.id,
      autoRefreshed: true,
    });

    await resetApproval(clientId);

    logger.info(`Handler: meeting:transcribed — summary auto-refreshed for client ${clientId}`);

    // 4. Notify the account user
    const accountUserId = await findAccountUserIdByClientId(clientId);
    if (accountUserId) {
      const notificationData = {
        type: 'summary_auto_refreshed',
        title: 'Summary auto-refreshed — please review',
        message: `The One Page Summary for this client was automatically updated after a new check-in transcription. Please review and re-approve.`,
        data_json: { clientId, meetingId },
      };

      try {
        await insertNotification({ user_id: accountUserId, ...notificationData });
        pushNotificationToUser(accountUserId, notificationData);
      } catch (notifErr) {
        logger.warn(`Handler: meeting:transcribed — failed to create notification:`, notifErr);
      }
    }

    logger.info(`Handler: meeting:transcribed completed for meetingId=${meetingId}`);
  } catch (error) {
    logger.error(`Handler: meeting:transcribed failed:`, error);
  }
});
