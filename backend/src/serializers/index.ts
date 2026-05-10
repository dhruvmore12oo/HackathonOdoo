/**
 * Centralized serializers — whitelist-based field extraction.
 * Controllers MUST use these to shape public API responses.
 * Prevents internal metadata and private field leakage.
 */

// ── Generic pick helper ──
function pick<T extends Record<string, unknown>>(obj: T, keys: string[]): Partial<T> {
  const result: Record<string, unknown> = {};
  for (const key of keys) {
    if (key in obj) result[key] = obj[key as keyof T];
  }
  return result as Partial<T>;
}

// ── User Serializer ──
const PUBLIC_USER_FIELDS = ['id', 'first_name', 'last_name', 'profile_photo_url'];
const PRIVATE_USER_FIELDS = [...PUBLIC_USER_FIELDS, 'email', 'phone', 'travel_preferences', 'created_at'];

export function serializePublicUser(user: Record<string, unknown>) {
  return pick(user, PUBLIC_USER_FIELDS);
}

export function serializePrivateUser(user: Record<string, unknown>) {
  return pick(user, PRIVATE_USER_FIELDS);
}

// ── Trip Serializer ──
const PUBLIC_TRIP_FIELDS = [
  'id', 'title', 'name', 'description', 'destination_summary',
  'cover_photo_url', 'start_date', 'end_date', 'tags', 'status',
  'view_count', 'share_count', 'visibility',
];
const PRIVATE_TRIP_FIELDS = [
  ...PUBLIC_TRIP_FIELDS, 'user_id', 'total_budget', 'is_public',
  'share_slug', 'archived_at', 'created_at', 'updated_at',
];

export function serializePublicTrip(trip: Record<string, unknown>) {
  return pick(trip, PUBLIC_TRIP_FIELDS);
}

export function serializePrivateTrip(trip: Record<string, unknown>) {
  return pick(trip, PRIVATE_TRIP_FIELDS);
}

// ── Expense Serializer ──
const PUBLIC_EXPENSE_FIELDS = ['id', 'category', 'amount', 'currency', 'description', 'date'];
const PRIVATE_EXPENSE_FIELDS = [
  ...PUBLIC_EXPENSE_FIELDS, 'trip_id', 'section_id', 'receipt_url',
  'paid_by', 'notes', 'created_at', 'updated_at',
];

export function serializePublicExpense(expense: Record<string, unknown>) {
  return pick(expense, PUBLIC_EXPENSE_FIELDS);
}

export function serializePrivateExpense(expense: Record<string, unknown>) {
  return pick(expense, PRIVATE_EXPENSE_FIELDS);
}

// ── Notification Serializer ──
const NOTIFICATION_FIELDS = ['id', 'type', 'title', 'message', 'metadata', 'read_at', 'created_at'];

export function serializeNotification(notification: Record<string, unknown>) {
  return pick(notification, NOTIFICATION_FIELDS);
}

// ── Activity Feed Serializer ──
const FEED_FIELDS = ['id', 'action_type', 'actor_name', 'actor_avatar', 'metadata', 'created_at'];

export function serializeActivityFeed(item: Record<string, unknown>) {
  return pick(item, FEED_FIELDS);
}

// ── Collaborator Serializer ──
const COLLABORATOR_FIELDS = ['id', 'user_id', 'role', 'first_name', 'last_name', 'email', 'avatar_url', 'accepted_at'];

export function serializeCollaborator(collab: Record<string, unknown>) {
  return pick(collab, COLLABORATOR_FIELDS);
}

// ── Batch serializer ──
export function serializeMany<T extends Record<string, unknown>>(
  items: T[], serializer: (item: T) => Partial<T>
): Partial<T>[] {
  return items.map(serializer);
}
