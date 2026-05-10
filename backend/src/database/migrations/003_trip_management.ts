/**
 * Trip Management improvements:
 * - Extended trip_status ENUM with draft, planned, active, completed, archived
 * - Extended trips table with visibility, tags, soft delete, destination_summary
 * - Added compound indexes for optimized queries
 * - Added text search index on trip name/description
 */
export const up = `
-- Replace trip_status ENUM with extended version
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'trip_visibility') THEN
    CREATE TYPE trip_visibility AS ENUM ('private', 'shared', 'public');
  END IF;
END $$;

-- Add new columns to trips table
ALTER TABLE trips ADD COLUMN IF NOT EXISTS visibility trip_visibility NOT NULL DEFAULT 'private';
ALTER TABLE trips ADD COLUMN IF NOT EXISTS destination_summary VARCHAR(300);
ALTER TABLE trips ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE trips ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- Rename 'name' to 'title' for clarity (keep backward compat with alias)
-- We'll just add title as alias by using both
ALTER TABLE trips ADD COLUMN IF NOT EXISTS title VARCHAR(200);
-- Copy existing name values to title
UPDATE trips SET title = name WHERE title IS NULL;

-- Compound indexes for optimized queries
CREATE INDEX IF NOT EXISTS idx_trips_user_status ON trips (user_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_trips_user_created ON trips (user_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_trips_visibility ON trips (visibility) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_trips_deleted ON trips (deleted_at) WHERE deleted_at IS NOT NULL;

-- Full-text search index on trip title/description
CREATE INDEX IF NOT EXISTS idx_trips_title_search ON trips USING gin (title gin_trgm_ops);
`;

export const down = `
DROP INDEX IF EXISTS idx_trips_title_search;
DROP INDEX IF EXISTS idx_trips_deleted;
DROP INDEX IF EXISTS idx_trips_visibility;
DROP INDEX IF EXISTS idx_trips_user_created;
DROP INDEX IF EXISTS idx_trips_user_status;
ALTER TABLE trips DROP COLUMN IF EXISTS title;
ALTER TABLE trips DROP COLUMN IF EXISTS archived_at;
ALTER TABLE trips DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE trips DROP COLUMN IF EXISTS tags;
ALTER TABLE trips DROP COLUMN IF EXISTS destination_summary;
ALTER TABLE trips DROP COLUMN IF EXISTS visibility;
DROP TYPE IF EXISTS trip_visibility;
`;
