import { pool } from '../../config/database';
import { logger } from '../../config/logger';
import type { CachedCity, CityPlaceSuggestion } from './search.types';
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

export async function getCataloguePlacesForCity(
  cityName: string,
  countryName?: string,
  limit = 8,
): Promise<CityPlaceSuggestion[]> {
  try {
    const { rows } = await pool.query<{
      id: string;
      name: string;
      category: string;
      avg_cost: string;
      duration_hours: string | null;
      description: string | null;
      thumbnail_url: string | null;
    }>(
      `SELECT ac.id, ac.name, ac.category, ac.avg_cost, ac.duration_hours,
              ac.description, ac.thumbnail_url
       FROM activity_catalogue ac
       JOIN cities c ON c.id = ac.city_id
       WHERE (LOWER(c.name) = LOWER($1) OR c.name % $1)
         AND ($2::text IS NULL OR LOWER(c.country) = LOWER($2) OR c.country % $2)
       ORDER BY
         CASE WHEN LOWER(c.name) = LOWER($1) THEN 0 ELSE 1 END,
         ac.category ASC,
         ac.name ASC
       LIMIT $3`,
      [cityName, countryName || null, limit],
    );

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      category: row.category,
      description: row.description,
      estimatedCost: Number(row.avg_cost || 0),
      durationHours: row.duration_hours ? Number(row.duration_hours) : null,
      imageUrl: row.thumbnail_url,
      source: 'catalogue',
    }));
  } catch (error) {
    logger.error('Failed to fetch city place suggestions', { error, cityName });
    return [];
  }
}
