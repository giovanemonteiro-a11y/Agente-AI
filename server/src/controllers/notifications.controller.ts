import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { query } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { sseClients } from '../services/notification.service';

// ─── List notifications for the authenticated user ──────────────────────────────

export const listNotifications = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) throw new AppError('Unauthorized', 401);

  const limit = Math.min(Number(req.query.limit) || 30, 100);
  const offset = Number(req.query.offset) || 0;

  const result = await query(
    `SELECT id, user_id, type, title, message, data_json, read_at, created_at
     FROM notifications
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [req.user.userId, limit, offset]
  );

  const countResult = await query(
    'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND read_at IS NULL',
    [req.user.userId]
  );

  res.status(200).json({
    data: result.rows,
    unreadCount: parseInt(countResult.rows[0].count, 10),
  });
});

// ─── Mark one notification as read ──────────────────────────────────────────────

export const markAsRead = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) throw new AppError('Unauthorized', 401);

  const { id } = req.params;

  const result = await query(
    `UPDATE notifications SET read_at = NOW()
     WHERE id = $1 AND user_id = $2 AND read_at IS NULL
     RETURNING id`,
    [id, req.user.userId]
  );

  if (result.rowCount === 0) {
    throw new AppError('Notification not found or already read', 404);
  }

  res.status(200).json({ message: 'Marked as read' });
});

// ─── Mark all as read ───────────────────────────────────────────────────────────

export const markAllAsRead = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) throw new AppError('Unauthorized', 401);

  await query(
    'UPDATE notifications SET read_at = NOW() WHERE user_id = $1 AND read_at IS NULL',
    [req.user.userId]
  );

  res.status(200).json({ message: 'All marked as read' });
});

// ─── SSE Stream ─────────────────────────────────────────────────────────────────

export const streamNotifications = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) throw new AppError('Unauthorized', 401);

  const userId = req.user.userId;

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  // Register this client
  sseClients.set(userId, res);

  // Send initial ping
  res.write('event: ping\ndata: {}\n\n');

  // Keep alive
  const keepAlive = setInterval(() => {
    res.write('event: ping\ndata: {}\n\n');
  }, 30000);

  req.on('close', () => {
    clearInterval(keepAlive);
    sseClients.delete(userId);
  });
});
