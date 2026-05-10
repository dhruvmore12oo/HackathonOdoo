// ── Realtime Event Constants ──────────────────────────────────────────────────
export const RT_EVENTS = {
  // Connection
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  ERROR: 'error',

  // Room management
  JOIN_TRIP: 'trip:join',
  LEAVE_TRIP: 'trip:leave',

  // Presence
  PRESENCE_UPDATE: 'presence:update',
  PRESENCE_LIST: 'presence:list',
  USER_TYPING: 'user:typing',
  USER_EDITING: 'user:editing',

  // Trip events
  TRIP_UPDATED: 'trip:updated',

  // Itinerary events
  SECTION_CREATED: 'itinerary:section:created',
  SECTION_UPDATED: 'itinerary:section:updated',
  SECTION_DELETED: 'itinerary:section:deleted',
  ACTIVITY_CREATED: 'itinerary:activity:created',
  ACTIVITY_UPDATED: 'itinerary:activity:updated',
  ACTIVITY_DELETED: 'itinerary:activity:deleted',

  // Expense events
  EXPENSE_CREATED: 'expense:created',
  EXPENSE_UPDATED: 'expense:updated',
  EXPENSE_DELETED: 'expense:deleted',

  // Collaboration events
  COLLABORATOR_JOINED: 'collab:joined',
  COLLABORATOR_LEFT: 'collab:left',
  COLLABORATOR_UPDATED: 'collab:updated',

  // Notifications
  NOTIFICATION_NEW: 'notification:new',
  NOTIFICATION_COUNT: 'notification:count',

  // Activity feed
  FEED_NEW: 'feed:new',
} as const;

export type RTEvent = typeof RT_EVENTS[keyof typeof RT_EVENTS];
