import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import * as whatsappService from '../services/whatsapp.service';
import * as whatsappRepo from '../repositories/whatsapp.repository';

// ── GET /api/webhooks/whatsapp — Meta webhook verification ─────────────────────

export const verifyWebhook = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const mode = req.query['hub.mode'] as string | undefined;
  const token = req.query['hub.verify_token'] as string | undefined;
  const challenge = req.query['hub.challenge'] as string | undefined;

  const result = whatsappService.verifyWebhook(mode, token, challenge);

  if (result.valid) {
    // Meta expects the challenge returned as plain text
    res.status(200).send(result.challenge);
    return;
  }

  res.status(403).json({ error: 'Forbidden' });
});

// ── POST /api/webhooks/whatsapp — incoming message (no auth) ──────────────────

export const receiveWebhook = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // Always acknowledge immediately — Meta requires 200 within 20s
  res.status(200).json({ status: 'received' });

  // Process asynchronously after responding
  try {
    await whatsappService.processIncomingMessage(
      req.body as whatsappService.IncomingWebhookPayload
    );
  } catch (_err) {
    // Errors are logged inside the service; do not re-throw after response is sent
  }
});

// ── GET /api/whatsapp/:clientId/messages — list messages (authenticated) ──────

export const listMessages = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { clientId } = req.params;
  const limit = parseInt((req.query.limit as string) ?? '20', 10);

  const messages = await whatsappRepo.findByClientId(clientId, limit);

  res.json({ data: messages, total: messages.length });
});

// ── POST /api/whatsapp/:clientId/extract-demands — trigger extraction ─────────

export const extractDemands = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { clientId } = req.params;

  const demands = await whatsappService.extractDemands(clientId);

  res.json({ data: demands, total: demands.length });
});
