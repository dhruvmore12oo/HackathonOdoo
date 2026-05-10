import { UUID } from '../../types';
import * as repo from './notification.repository';
import { NotificationRow } from './notification.types';

/**
 * Create a notification for a user.
 */
export async function notify(
  userId: UUID, type: string, title: string,
  message?: string, metadata: Record<string, unknown> = {}
): Promise<NotificationRow> {
  return repo.create(userId, type, title, message, metadata);
}

/**
 * Notify multiple users at once (e.g. all trip collaborators).
 */
export async function notifyMany(
  userIds: UUID[], type: string, title: string,
  message?: string, metadata: Record<string, unknown> = {}
): Promise<void> {
  await Promise.allSettled(
    userIds.map((uid) => repo.create(uid, type, title, message, metadata))
  );
}

export async function getUserNotifications(userId: UUID, page = 1, limit = 20) {
  return repo.getByUser(userId, page, limit);
}

export async function getUnreadCount(userId: UUID) {
  return repo.getUnreadCount(userId);
}

export async function markAsRead(id: UUID, userId: UUID) {
  return repo.markAsRead(id, userId);
}

export async function markAllRead(userId: UUID) {
  return repo.markAllRead(userId);
}

export async function remove(id: UUID, userId: UUID) {
  return repo.remove(id, userId);
}
