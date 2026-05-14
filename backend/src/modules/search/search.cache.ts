import { pool } from '../../config/database';
import { logger } from '../../config/logger';
import type { CachedCity } from './search.types';
import { MAX_TRENDING_CITIES } from './search.constants';

/**
 * Upsert a city into the search cache.
 * Increments search_count and refreshes last_searched_at.
 */
export async function upsertCachedCity(city: {
  providerCityId: string;
  name: string;
  country: string;
  countryCode: string;
  region?: string;
  latitude: number;
  longitude: number;
  population?: number;
  heroImageUrl?: string;
  thumbnailImageUrl?: string;
}): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO cached_cities
        (provider_city_id, name, country, country_code, region, latitude, longitude,
         population, hero_image_url, thumbnail_image_url, image_provider, search_count, last_searched_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'unsplash',1,NOW())
       ON CONFLICT (provider_city_id) DO UPDATE SET
         hero_image_url = COALESCE(EXCLUDED.hero_image_url, cached_cities.hero_image_url),
         thumbnail_image_url = COALESCE(EXCLUDED.thumbnail_image_url, cached_cities.thumbnail_image_url),
         search_count = cached_cities.search_count + 1,
         last_searched_at = NOW(),
         updated_at = NOW()`,
      [
        city.providerCityId,
        city.name,
        city.country,
        city.countryCode,
        city.region || null,
        city.latitude,
        city.longitude,
        city.population || null,
        city.heroImageUrl || null,
        city.thumbnailImageUrl || null,
      ],
    );
  } catch (error) {
    logger.error('Failed to upsert cached city', { error, city: city.name });
  }
}

/**
 * Get trending destinations ordered by search_count descending.
 */
export async function getTrendingCities(limit = MAX_TRENDING_CITIES): Promise<CachedCity[]> {
  try {
    const { rows } = await pool.query<CachedCity>(
      `SELECT * FROM cached_cities
       WHERE hero_image_url IS NOT NULL
       ORDER BY search_count DESC, last_searched_at DESC
       LIMIT $1`,
      [limit],
    );
    return rows;
  } catch (error) {
    logger.error('Failed to fetch trending cities', { error });
    return [];
  }
}

/**
 * Try to find a city in the cache by provider ID.
 */
export async function getCachedCityByProviderId(providerCityId: string): Promise<CachedCity | null> {
  try {
    const { rows } = await pool.query<CachedCity>(
      'SELECT * FROM cached_cities WHERE provider_city_id = $1',
      [providerCityId],
    );
    return rows[0] || null;
  } catch (error) {
    logger.error('Failed to get cached city', { error, providerCityId });
    return null;
  }
}

/**
 * Search cached cities by name (trigram-based fuzzy match).
 */
export async function searchCachedCities(
  query: string,
  countryCode?: string,
  limit = 10,
): Promise<CachedCity[]> {
  try {
    let sql = `SELECT *, similarity(name, $1) AS sim
               FROM cached_cities
               WHERE name % $1`;
    const params: (string | number)[] = [query];
    let paramIdx = 2;

    if (countryCode) {
      sql += ` AND country_code = $${paramIdx}`;
      params.push(countryCode);
      paramIdx++;
    }

    sql += ` ORDER BY sim DESC, search_count DESC LIMIT $${paramIdx}`;
    params.push(limit);

    const { rows } = await pool.query<CachedCity & { sim: number }>(sql, params);
    return rows;
  } catch (error) {
    logger.error('Failed to search cached cities', { error });
    return [];
  }
}
