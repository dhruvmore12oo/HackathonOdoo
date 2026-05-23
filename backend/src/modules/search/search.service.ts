import { logger } from '../../config/logger';
import { geoDBProvider, openTripMapProvider } from './search.providers';
import { getCityImage } from '../media/media.service';
import {
  getCataloguePlacesForCity,
  upsertCachedCity,
  getTrendingCities as getTrendingFromCache,
  searchCachedCities,
} from './search.cache';
import {
  serializeGeoDBCity,
  serializeCachedCity,
  serializeTrendingCity,
} from './search.serializer';
import type { CityPlacesInput } from './search.schema';
import type { CityPlaceSuggestion, OpenTripMapPlace, SearchCityResult, TrendingCity } from './search.types';
import { FALLBACK_HERO_IMAGE, FALLBACK_THUMBNAIL_IMAGE, SEARCH_CACHE_TTL_SECONDS } from './search.constants';

// ── In-memory TTL cache for hot search results ──
const memoryCache = new Map<string, { data: SearchCityResult[]; expiresAt: number }>();

function cacheKey(q: string, country?: string): string {
  return `search:${q.toLowerCase()}:${country || 'ALL'}`;
}

/**
 * Search cities globally or within a country.
 *
 * Flow:
 *  1. Check in-memory TTL cache
 *  2. Call GeoDB API for fresh results
 *  3. Enrich each result with an Unsplash image (parallel, non-blocking)
 *  4. Persist to DB cache (fire-and-forget) for trending / future lookups
 *  5. Return serialized results
 *
 * If GeoDB is down, gracefully degrade to the DB cache (trigram search).
 */
export async function searchCities(
  query: string,
  countryCode?: string,
  limit = 10,
  offset = 0,
): Promise<SearchCityResult[]> {
  const key = cacheKey(query, countryCode);

  // 1 — memory cache hit?
  const cached = memoryCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    logger.debug(`Search cache hit for "${key}"`);
    return cached.data;
  }

  // 2 — call GeoDB
  const geoResults = await geoDBProvider.searchCities(query, countryCode, limit, offset);

  // Graceful degradation: if GeoDB is unavailable, try DB cache
  if (!geoResults || geoResults.length === 0) {
    logger.info(`GeoDB returned no results for "${query}", falling back to cache`);
    const cachedRows = await searchCachedCities(query, countryCode, limit);
    if (cachedRows.length > 0) {
      return cachedRows.map(serializeCachedCity);
    }
    return [];
  }

  // 3 — enrich with images (parallel, 3 at a time to respect API limits)
  const results: SearchCityResult[] = await Promise.all(
    geoResults.map(async (city) => {
      try {
        const imageData = await getCityImage(city.name || city.city, city.country);
        return serializeGeoDBCity(city, imageData.heroUrl, imageData.thumbnailUrl);
      } catch {
        return serializeGeoDBCity(city, FALLBACK_HERO_IMAGE, FALLBACK_THUMBNAIL_IMAGE);
      }
    }),
  );

  // 4 — persist to DB cache (fire-and-forget)
  for (const r of results) {
    upsertCachedCity({
      providerCityId: r.id,
      name: r.name,
      country: r.country,
      countryCode: r.countryCode,
      region: r.region,
      latitude: r.latitude,
      longitude: r.longitude,
      population: r.population,
      heroImageUrl: r.heroImage,
      thumbnailImageUrl: r.thumbnailImage,
    }).catch(() => {}); // non-blocking
  }

  // 5 — write to memory cache
  memoryCache.set(key, {
    data: results,
    expiresAt: Date.now() + SEARCH_CACHE_TTL_SECONDS * 1000,
  });

  return results;
}

/**
 * Get trending destinations from the DB cache.
 */
export async function getTrendingCities(limit = 12): Promise<TrendingCity[]> {
  const rows = await getTrendingFromCache(limit);
  return rows.map(serializeTrendingCity);
}

function humanizeKind(kinds?: string): string {
  if (!kinds) return 'Place';

  const priority = [
    'interesting_places',
    'historic',
    'architecture',
    'cultural',
    'natural',
    'tourist_facilities',
  ];
  const parts = kinds.split(',').map((kind) => kind.trim()).filter(Boolean);
  const best = priority.find((kind) => parts.includes(kind)) || parts[0] || 'place';

  return best
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function mapOpenTripMapPlace(place: OpenTripMapPlace, cityName: string): CityPlaceSuggestion {
  const category = humanizeKind(place.kinds);

  return {
    id: `opentripmap:${place.xid}`,
    name: place.name.trim(),
    category,
    description: `Popular ${category.toLowerCase()} spot near ${cityName}.`,
    imageUrl: place.preview?.source || null,
    distanceMeters: place.dist ? Math.round(place.dist) : undefined,
    source: 'opentripmap',
  };
}

function dedupePlaces(places: CityPlaceSuggestion[]): CityPlaceSuggestion[] {
  const seen = new Set<string>();

  return places.filter((place) => {
    const key = place.name.trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function getCityPlaces(input: CityPlacesInput): Promise<CityPlaceSuggestion[]> {
  const limit = input.limit ?? 8;
  const cataloguePlaces = await getCataloguePlacesForCity(input.name, input.country, limit);
  let externalPlaces: CityPlaceSuggestion[] = [];

  if (
    cataloguePlaces.length < limit
    && input.lat !== undefined
    && input.lng !== undefined
    && openTripMapProvider.isConfigured
  ) {
    const places = await openTripMapProvider.getPlacesNearCity(
      input.lat,
      input.lng,
      limit - cataloguePlaces.length,
    );
    externalPlaces = places.map((place) => mapOpenTripMapPlace(place, input.name));
  }

  return dedupePlaces([...cataloguePlaces, ...externalPlaces]).slice(0, limit);
}
