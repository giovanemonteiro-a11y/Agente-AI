import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../middleware/errorHandler';
import {
  createInstance,
  getConnectionStatus,
  getQRCode,
  listGroups,
  processEvolutionWebhook,
  isEvolutionConfigured,
} from '../services/whatsapp-evolution.service';
import { logger } from '../utils/logger';

// ── GET /api/evolution/status ───────────────────────────────────────────────

export const getStatus = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  if (!isEvolutionConfigured()) {
    res.status(200).json({ configured: false, connected: false, message: 'Evolution API not configured. Set EVOLUTION_API_URL and EVOLUTION_API_KEY.' });
    return;
  }

  const status = await getConnectionStatus();
  res.status(200).json({ configured: true, ...status });
});

// ── POST /api/evolution/connect ─────────────────────────────────────────────

export const connect = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  if (!isEvolutionConfigured()) {
    throw new AppError('Evolution API not configured', 500);
  }

  // Try to get QR code for existing instance, or create new one
  try {
    const qr = await getQRCode();
    res.status(200).json({ qrcode: qr.qrcode, message: 'Scan this QR code with WhatsApp' });
  } catch {
    // Instance may not exist yet, create it
    const instance = await createInstance();
    res.status(201).json(instance);
  }
});

// ── GET /api/evolution/groups ───────────────────────────────────────────────

export const getGroups = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const status = await getConnectionStatus();
  if (!status.connected) {
    throw new AppError('WhatsApp not connected. Use POST /api/evolution/connect first.', 400);
  }

  const groups = await listGroups();
  res.status(200).json({ data: groups, total: groups.length });
});

// ── POST /api/webhooks/evolution ────────────────────────────────────────────
// Webhook endpoint for Evolution API — no authentication required (called by Evolution)

export const evolutionWebhook = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  logger.info('Evolution webhook received:', req.body?.event);
  await processEvolutionWebhook(req.body);
  res.status(200).json({ received: true });
});
