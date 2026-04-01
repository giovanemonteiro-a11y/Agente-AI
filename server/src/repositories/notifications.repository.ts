import { query } from '../config/database';

export async function findNotificationsByUserId(userId: string): Promise<unknown[]> {
  const result = await query(
    'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
    [userId]
  );
  return result.rows;
}

export async function insertNotification(data: Record<string, unknown>): Promise<unknown> {
  const fields = Object.keys(data);
  const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');
  const result = await query(
    `INSERT INTO notifications (${fields.join(', ')}) VALUES (${placeholders}) RETURNING *`,
    Object.values(data)
  );
  return result.rows[0];
}

export async function markNotificationRead(id: string): Promise<void> {
  await query('UPDATE notifications SET read_at = NOW() WHERE id = $1', [id]);
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  await query(
    'UPDATE notifications SET read_at = NOW() WHERE user_id = $1 AND read_at IS NULL',
    [userId]
  );
}

export async function countUnread(userId: string): Promise<number> {
  const result = await query<{ count: string }>(
    'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND read_at IS NULL',
    [userId]
  );
  return parseInt(result.rows[0].count, 10);
}
