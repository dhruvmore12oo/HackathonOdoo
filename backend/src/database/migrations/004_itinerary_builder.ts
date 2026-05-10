/**
 * Phase 3 — Itinerary Builder Schema Improvements.
 * Extends itinerary_sections and section_activities with scheduling,
 * location, cost estimation, status, and ordering support.
 */
export const up = `

-- ============================================
-- ENUM: section_type
-- ============================================
DO $$ BEGIN
  CREATE TYPE section_type AS ENUM ('morning', 'afternoon', 'evening', 'night', 'custom');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- ENUM: activity_status
-- ============================================
DO $$ BEGIN
  CREATE TYPE activity_status AS ENUM ('planned', 'booked', 'completed', 'skipped');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- Extend itinerary_sections
-- ============================================
ALTER TABLE itinerary_sections
  ADD COLUMN IF NOT EXISTS day_number      INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS section_type    section_type NOT NULL DEFAULT 'custom',
  ADD COLUMN IF NOT EXISTS notes           TEXT;

-- ============================================
-- Extend section_activities
-- ============================================
ALTER TABLE section_activities
  ADD COLUMN IF NOT EXISTS title           VARCHAR(200),
  ADD COLUMN IF NOT EXISTS description     TEXT,
  ADD COLUMN IF NOT EXISTS location_name   VARCHAR(300),
  ADD COLUMN IF NOT EXISTS latitude        DECIMAL(9,6),
  ADD COLUMN IF NOT EXISTS longitude       DECIMAL(9,6),
  ADD COLUMN IF NOT EXISTS address         TEXT,
  ADD COLUMN IF NOT EXISTS start_time      TIME,
  ADD COLUMN IF NOT EXISTS end_time        TIME,
  ADD COLUMN IF NOT EXISTS estimated_duration_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS currency        VARCHAR(3) NOT NULL DEFAULT 'INR',
  ADD COLUMN IF NOT EXISTS status          activity_status NOT NULL DEFAULT 'planned',
  ADD COLUMN IF NOT EXISTS tips            TEXT,
  ADD COLUMN IF NOT EXISTS metadata        JSONB DEFAULT '{}';

-- ============================================
-- Performance indexes for itinerary queries
-- ============================================
CREATE INDEX IF NOT EXISTS idx_sections_trip_day
  ON itinerary_sections (trip_id, day_number, sort_order);

CREATE INDEX IF NOT EXISTS idx_sections_sort
  ON itinerary_sections (trip_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_activities_section_sort
  ON section_activities (section_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_activities_status
  ON section_activities (status);
`;

export const down = `
-- Drop indexes
DROP INDEX IF EXISTS idx_activities_status;
DROP INDEX IF EXISTS idx_activities_section_sort;
DROP INDEX IF EXISTS idx_sections_sort;
DROP INDEX IF EXISTS idx_sections_trip_day;

-- Remove added columns from section_activities
ALTER TABLE section_activities
  DROP COLUMN IF EXISTS title,
  DROP COLUMN IF EXISTS description,
  DROP COLUMN IF EXISTS location_name,
  DROP COLUMN IF EXISTS latitude,
  DROP COLUMN IF EXISTS longitude,
  DROP COLUMN IF EXISTS address,
  DROP COLUMN IF EXISTS start_time,
  DROP COLUMN IF EXISTS end_time,
  DROP COLUMN IF EXISTS estimated_duration_minutes,
  DROP COLUMN IF EXISTS currency,
  DROP COLUMN IF EXISTS status,
  DROP COLUMN IF EXISTS tips,
  DROP COLUMN IF EXISTS metadata;

-- Remove added columns from itinerary_sections
ALTER TABLE itinerary_sections
  DROP COLUMN IF EXISTS day_number,
  DROP COLUMN IF EXISTS section_type,
  DROP COLUMN IF EXISTS notes;

DROP TYPE IF EXISTS activity_status;
DROP TYPE IF EXISTS section_type;
`;
