/**
 * Phase 6 — Notifications, User Preferences & Performance Indexes.
 *
 * New tables:
 *   - notifications        — in-app notification system
 *   - user_preferences     — per-user settings (theme, notification prefs, etc.)
 *
 * New indexes:
 *   - partial indexes on trips for community queries
 *   - composite indexes on activity feed
 */
export const up = `
-- ============================================
-- 1. notifications
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        VARCHAR(60) NOT NULL,
  title       VARCHAR(200) NOT NULL,
  message     TEXT,
  metadata    JSONB DEFAULT '{}',
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON notifications (user_id, created_at DESC) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON notifications (user_id, created_at DESC);

-- ============================================
-- 2. user_preferences
-- ============================================
CREATE TABLE IF NOT EXISTS user_preferences (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  theme               VARCHAR(20) NOT NULL DEFAULT 'light',
  notifications_email BOOLEAN NOT NULL DEFAULT true,
  notifications_push  BOOLEAN NOT NULL DEFAULT true,
  notifications_collab BOOLEAN NOT NULL DEFAULT true,
  travel_currency     VARCHAR(3) NOT NULL DEFAULT 'INR',
  ai_enabled          BOOLEAN NOT NULL DEFAULT true,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 3. Performance indexes (only new ones)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_collaborators_user_accepted
  ON trip_collaborators (user_id) WHERE accepted_at IS NOT NULL;
`;

export const down = `
DROP INDEX IF EXISTS idx_collaborators_user_accepted;
DROP TABLE IF EXISTS user_preferences;
DROP TABLE IF EXISTS notifications;
`;
