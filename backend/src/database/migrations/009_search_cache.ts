/**
 * Migration 009: Create cached_cities table for search caching.
 * Only stores cities that have been searched/used — NOT the entire world dataset.
 */
export const up = `
-- Create cached_cities table
CREATE TABLE IF NOT EXISTS cached_cities (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_city_id    VARCHAR(100) NOT NULL UNIQUE,
  name                VARCHAR(200) NOT NULL,
  country             VARCHAR(100) NOT NULL,
  country_code        CHAR(2) NOT NULL,
  region              VARCHAR(200),
  latitude            DECIMAL(9,6) NOT NULL,
  longitude           DECIMAL(9,6) NOT NULL,
  population          INTEGER,
  hero_image_url      TEXT,
  thumbnail_image_url TEXT,
  image_provider      VARCHAR(50) DEFAULT 'unsplash',
  search_count        INTEGER NOT NULL DEFAULT 1,
  last_searched_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cached_cities_country_code ON cached_cities (country_code);
CREATE INDEX IF NOT EXISTS idx_cached_cities_search_count ON cached_cities (search_count DESC);
CREATE INDEX IF NOT EXISTS idx_cached_cities_name_trgm ON cached_cities USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_cached_cities_last_searched ON cached_cities (last_searched_at DESC);

-- updated_at trigger
DROP TRIGGER IF EXISTS set_updated_at ON cached_cities;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON cached_cities
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
`;

export const down = `
DROP TABLE IF EXISTS cached_cities CASCADE;
`;
