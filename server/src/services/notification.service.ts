import { Response } from 'express';
import { query } from '../config/database';
import { findUsersByRole } from '../repositories/users.repository';
import { logger } from '../utils/logger';

// ─── SSE Client Registry ────────────────────────────────────────────────────────
// userId → Express Response object for the SSE stream
export const sseClients = new Map<string, Response>();

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface CreateNotificationPayload {
  user_id: string;
  type: string;
  title: string;
  message?: string;
  data_json?: Record<string, unknown>;
}

// ─── Create a notification + push via SSE ───────────────────────────────────────

export async function createNotification(payload: CreateNotificationPayload): Promise<unknown> {
  const { user_id, type, title, message, data_json } = payload;

  const result = await query(
    `INSERT INTO notifications (user_id, type, title, message, data_json)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, user_id, type, title, message, data_json, read_at, created_at`,
    [user_id, type, title, message ?? null, data_json ? JSON.stringify(data_json) : null]
  );

  const notification = result.rows[0];

  // Push via SSE if connected
  pushNotificationToUser(user_id, notification);

  logger.info(`[Notification] Created "${type}" for user ${user_id}: ${title}`);
  return notification;
}

// ─── List notifications ─────────────────────────────────────────────────────────

export async function listNotifications(userId: string, limit = 30, offset = 0): Promise<unknown[]> {
  const result = await query(
    `SELECT id, user_id, type, title, message, data_json, read_at, created_at
     FROM notifications WHERE user_id = $1
     ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );
  return result.rows;
}

// ─── Mark as read ───────────────────────────────────────────────────────────────

export async function markNotificationAsRead(id: string): Promise<void> {
  await query('UPDATE notifications SET read_at = NOW() WHERE id = $1 AND read_at IS NULL', [id]);
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  await query('UPDATE notifications SET read_at = NOW() WHERE user_id = $1 AND read_at IS NULL', [userId]);
}

// ─── Unread count ───────────────────────────────────────────────────────────────

export async function getUnreadCount(userId: string): Promise<number> {
  const result = await query<{ count: string }>(
    'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND read_at IS NULL',
    [userId]
  );
  return parseInt(result.rows[0].count, 10);
}

// ─── SSE Push ───────────────────────────────────────────────────────────────────

export function pushNotificationToUser(userId: string, data: unknown): void {
  const client = sseClients.get(userId);
  if (client) {
    try {
      client.write(`event: notification\ndata: ${JSON.stringify(data)}\n\n`);
    } catch {
      sseClients.delete(userId);
    }
  }
}

// ─── Bulk notify by role ────────────────────────────────────────────────────────

export async function notifyAllLeaders(
  type: string,
  title: string,
  message?: string,
  data_json?: Record<string, unknown>
): Promise<void> {
  const leaders = await findUsersByRole('lideranca');
  for (const leader of leaders) {
    await createNotification({ user_id: leader.id, type, title, message, data_json });
  }
  logger.info(`[Notification] Notified ${leaders.length} leaders: "${title}"`);
}

export async function notifyByRole(
  role: string,
  type: string,
  title: string,
  message?: string,
  data_json?: Record<string, unknown>
): Promise<void> {
  const users = await findUsersByRole(role);
  for (const u of users) {
    await createNotification({ user_id: u.id, type, title, message, data_json });
  }
}

export async function notifyUsers(
  userIds: string[],
  type: string,
  title: string,
  message?: string,
  data_json?: Record<string, unknown>
): Promise<void> {
  for (const uid of userIds) {
    await createNotification({ user_id: uid, type, title, message, data_json });
  }
}

// Legacy compat
export function registerSSEClient(userId: string, callback: (data: unknown) => void): () => void {
  // Not used in new flow — kept for backwards compat
  void userId; void callback;
  return () => {};
}
