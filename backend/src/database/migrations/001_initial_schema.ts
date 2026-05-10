/**
 * Initial database schema — all core Traveloop tables.
 * Uses UUID primary keys, proper constraints, indexes, and cascading rules.
 */
export const up = `
-- ============================================
-- Enable UUID extension
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================
-- ENUM Types
-- ============================================
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('user', 'admin');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE trip_status AS ENUM ('upcoming', 'ongoing', 'completed');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE cost_index AS ENUM ('budget', 'mid', 'luxury');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE expense_category AS ENUM ('lodging', 'flights', 'activities', 'food', 'transport', 'misc');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE packing_category AS ENUM ('documents', 'clothing', 'electronics', 'toiletries', 'misc');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- 1. users
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name      VARCHAR(80) NOT NULL,
  last_name       VARCHAR(80) NOT NULL,
  email           VARCHAR(255) NOT NULL UNIQUE,
  phone           VARCHAR(20),
  password_hash   TEXT NOT NULL,
  city            VARCHAR(100),
  country         VARCHAR(100),
  profile_photo_url TEXT,
  bio             TEXT,
  role            user_role NOT NULL DEFAULT 'user',
  email_verified  BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);

-- ============================================
-- 2. cities (reference / seed table)
-- ============================================
CREATE TABLE IF NOT EXISTS cities (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name              VARCHAR(100) NOT NULL,
  country           VARCHAR(100) NOT NULL,
  region            VARCHAR(100) NOT NULL,
  cost_index        cost_index NOT NULL DEFAULT 'mid',
  popularity_score  INTEGER NOT NULL DEFAULT 0,
  lat               DECIMAL(9,6),
  lng               DECIMAL(9,6),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cities_name ON cities USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_cities_country ON cities (country);
CREATE INDEX IF NOT EXISTS idx_cities_region ON cities (region);
CREATE INDEX IF NOT EXISTS idx_cities_cost_index ON cities (cost_index);

-- ============================================
-- 3. activity_catalogue (reference / seed table)
-- ============================================
CREATE TABLE IF NOT EXISTS activity_catalogue (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  city_id         UUID REFERENCES cities(id) ON DELETE SET NULL,
  name            VARCHAR(200) NOT NULL,
  category        VARCHAR(80) NOT NULL,
  avg_cost        DECIMAL(10,2) NOT NULL DEFAULT 0,
  duration_hours  DECIMAL(4,1),
  description     TEXT,
  thumbnail_url   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_catalogue_city ON activity_catalogue (city_id);
CREATE INDEX IF NOT EXISTS idx_activity_catalogue_category ON activity_catalogue (category);
CREATE INDEX IF NOT EXISTS idx_activity_catalogue_name ON activity_catalogue USING gin (name gin_trgm_ops);

-- ============================================
-- 4. trips
-- ============================================
CREATE TABLE IF NOT EXISTS trips (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name            VARCHAR(120) NOT NULL,
  description     TEXT,
  start_date      DATE NOT NULL,
  end_date        DATE NOT NULL,
  cover_photo_url TEXT,
  status          trip_status NOT NULL DEFAULT 'upcoming',
  is_public       BOOLEAN NOT NULL DEFAULT false,
  share_slug      VARCHAR(50) UNIQUE,
  total_budget    DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_trip_dates CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_trips_user ON trips (user_id);
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips (status);
CREATE INDEX IF NOT EXISTS idx_trips_share_slug ON trips (share_slug);
CREATE INDEX IF NOT EXISTS idx_trips_is_public ON trips (is_public) WHERE is_public = true;

-- ============================================
-- 5. trip_cities (junction)
-- ============================================
CREATE TABLE IF NOT EXISTS trip_cities (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id     UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  city_id     UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_trip_city UNIQUE (trip_id, city_id)
);

CREATE INDEX IF NOT EXISTS idx_trip_cities_trip ON trip_cities (trip_id);

-- ============================================
-- 6. itinerary_sections
-- ============================================
CREATE TABLE IF NOT EXISTS itinerary_sections (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id     UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  title       VARCHAR(150) NOT NULL,
  description TEXT,
  start_date  DATE,
  end_date    DATE,
  budget      DECIMAL(10,2) NOT NULL DEFAULT 0,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_section_dates CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_sections_trip ON itinerary_sections (trip_id);

-- ============================================
-- 7. section_activities
-- ============================================
CREATE TABLE IF NOT EXISTS section_activities (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_id      UUID NOT NULL REFERENCES itinerary_sections(id) ON DELETE CASCADE,
  name            VARCHAR(200) NOT NULL,
  type            VARCHAR(50),
  estimated_cost  DECIMAL(10,2) NOT NULL DEFAULT 0,
  duration_hours  DECIMAL(4,1),
  notes           TEXT,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_section_activities_section ON section_activities (section_id);

-- ============================================
-- 8. expenses
-- ============================================
CREATE TABLE IF NOT EXISTS expenses (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id     UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  section_id  UUID REFERENCES itinerary_sections(id) ON DELETE SET NULL,
  category    expense_category NOT NULL DEFAULT 'misc',
  description VARCHAR(300) NOT NULL,
  amount      DECIMAL(10,2) NOT NULL DEFAULT 0,
  quantity    INTEGER NOT NULL DEFAULT 1,
  is_paid     BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expenses_trip ON expenses (trip_id);

-- ============================================
-- 9. packing_items
-- ============================================
CREATE TABLE IF NOT EXISTS packing_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id     UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  name        VARCHAR(150) NOT NULL,
  category    packing_category NOT NULL DEFAULT 'misc',
  is_packed   BOOLEAN NOT NULL DEFAULT false,
  quantity    INTEGER NOT NULL DEFAULT 1,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_packing_items_trip ON packing_items (trip_id);

-- ============================================
-- 10. trip_notes
-- ============================================
CREATE TABLE IF NOT EXISTS trip_notes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id     UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  section_id  UUID REFERENCES itinerary_sections(id) ON DELETE SET NULL,
  title       VARCHAR(200),
  body        TEXT NOT NULL,
  note_date   DATE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trip_notes_trip ON trip_notes (trip_id);

-- ============================================
-- Migration tracking table
-- ============================================
CREATE TABLE IF NOT EXISTS _migrations (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(255) NOT NULL UNIQUE,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- updated_at trigger function
-- ============================================
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
DO $$ DECLARE t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'users','trips','itinerary_sections','section_activities',
    'expenses','packing_items','trip_notes'
  ]) LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS set_updated_at ON %I; CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();',
      t, t
    );
  END LOOP;
END $$;
`;

export const down = `
DROP TABLE IF EXISTS _migrations CASCADE;
DROP TABLE IF EXISTS trip_notes CASCADE;
DROP TABLE IF EXISTS packing_items CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS section_activities CASCADE;
DROP TABLE IF EXISTS itinerary_sections CASCADE;
DROP TABLE IF EXISTS trip_cities CASCADE;
DROP TABLE IF EXISTS trips CASCADE;
DROP TABLE IF EXISTS activity_catalogue CASCADE;
DROP TABLE IF EXISTS cities CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TYPE IF EXISTS packing_category;
DROP TYPE IF EXISTS expense_category;
DROP TYPE IF EXISTS cost_index;
DROP TYPE IF EXISTS trip_status;
DROP TYPE IF EXISTS user_role;
DROP FUNCTION IF EXISTS trigger_set_updated_at();
`;
