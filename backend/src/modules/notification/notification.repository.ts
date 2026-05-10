import { queryOne, queryMany, query } from '../../lib/db';
import { UUID } from '../../types';
import { NotificationRow } from './notification.types';

export async function create(
  userId: UUID, type: string, title: string,
  message?: string, metadata: Record<string, unknown> = {}
): Promise<NotificationRow> {
  return (await queryOne<NotificationRow>(
    `INSERT INTO notifications (user_id, type, title, message, metadata)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [userId, type, title, message ?? null, JSON.stringify(metadata)]
  ))!;
}

export async function getByUser(
  userId: UUID, page = 1, limit = 20
): Promise<{ rows: NotificationRow[]; total: number }> {
  const offset = (page - 1) * limit;
  const countRes = await queryOne<{ count: string }>(
    'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1', [userId]
  );
  const rows = await queryMany<NotificationRow>(
    `SELECT * FROM notifications WHERE user_id = $1
     ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );
  return { rows, total: Number(countRes?.count || 0) };
}

export async function getUnreadCount(userId: UUID): Promise<number> {
  const res = await queryOne<{ count: string }>(
    'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND read_at IS NULL',
    [userId]
  );
  return Number(res?.count || 0);
}

export async function markAsRead(id: UUID, userId: UUID): Promise<void> {
  await query(
    'UPDATE notifications SET read_at = NOW() WHERE id = $1 AND user_id = $2',
    [id, userId]
  );
}

export async function markAllRead(userId: UUID): Promise<void> {
  await query(
    'UPDATE notifications SET read_at = NOW() WHERE user_id = $1 AND read_at IS NULL',
    [userId]
  );
}

export async function remove(id: UUID, userId: UUID): Promise<void> {
  await query('DELETE FROM notifications WHERE id = $1 AND user_id = $2', [id, userId]);
}
