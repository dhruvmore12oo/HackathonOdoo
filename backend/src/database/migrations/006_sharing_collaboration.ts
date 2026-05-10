/**
 * Phase 5 — Sharing, Collaboration & Community Schema.
 * Adds: trip_collaborators, trip_share_links, trip_views, trip_activity_feed.
 * Extends: trips with share_slug, view_count, share_count.
 */
export const up = `

-- ============================================
-- Collaborator role enum
-- ============================================
DO $$ BEGIN
  CREATE TYPE collaborator_role AS ENUM ('owner', 'editor', 'viewer');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- Extend trips table
-- ============================================
ALTER TABLE trips
  ADD COLUMN IF NOT EXISTS share_slug       VARCHAR(80) UNIQUE,
  ADD COLUMN IF NOT EXISTS view_count       INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS share_count      INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_trips_share_slug ON trips (share_slug);
CREATE INDEX IF NOT EXISTS idx_trips_visibility ON trips (visibility);

-- ============================================
-- trip_collaborators
-- ============================================
CREATE TABLE IF NOT EXISTS trip_collaborators (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id              UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id              UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role                 collaborator_role NOT NULL DEFAULT 'viewer',
  invited_by           UUID REFERENCES users(id) ON DELETE SET NULL,
  accepted_at          TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(trip_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_collaborators_trip ON trip_collaborators (trip_id);
CREATE INDEX IF NOT EXISTS idx_collaborators_user ON trip_collaborators (user_id);

DO $$ BEGIN
  DROP TRIGGER IF EXISTS set_updated_at ON trip_collaborators;
  CREATE TRIGGER set_updated_at BEFORE UPDATE ON trip_collaborators
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
END $$;

-- ============================================
-- trip_share_links
-- ============================================
CREATE TABLE IF NOT EXISTS trip_share_links (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id       UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  slug          VARCHAR(80) NOT NULL UNIQUE,
  visibility    VARCHAR(20) NOT NULL DEFAULT 'public',
  expires_at    TIMESTAMPTZ,
  password_hash TEXT,
  created_by    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_share_links_slug ON trip_share_links (slug);
CREATE INDEX IF NOT EXISTS idx_share_links_trip ON trip_share_links (trip_id);

-- ============================================
-- trip_views
-- ============================================
CREATE TABLE IF NOT EXISTS trip_views (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id      UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  viewer_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  ip_hash      VARCHAR(64),
  user_agent   TEXT,
  viewed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trip_views_trip ON trip_views (trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_views_viewed_at ON trip_views (viewed_at);

-- ============================================
-- trip_activity_feed
-- ============================================
CREATE TABLE IF NOT EXISTS trip_activity_feed (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id      UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  actor_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  action_type  VARCHAR(60) NOT NULL,
  metadata     JSONB DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_feed_trip ON trip_activity_feed (trip_id, created_at DESC);
`;

export const down = `
DROP TABLE IF EXISTS trip_activity_feed CASCADE;
DROP TABLE IF EXISTS trip_views CASCADE;
DROP TABLE IF EXISTS trip_share_links CASCADE;
DROP TABLE IF EXISTS trip_collaborators CASCADE;

ALTER TABLE trips
  DROP COLUMN IF EXISTS share_slug,
  DROP COLUMN IF EXISTS view_count,
  DROP COLUMN IF EXISTS share_count;

DROP INDEX IF EXISTS idx_trips_visibility;
DROP INDEX IF EXISTS idx_trips_share_slug;
DROP TYPE IF EXISTS collaborator_role;
`;
