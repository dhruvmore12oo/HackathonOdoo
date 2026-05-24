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
import type {
  CityPlaceSuggestion,
  DestinationType,
  GeoDBCity,
  GeoDBCountry,
  OpenTripMapPlace,
  SearchCityResult,
  TrendingCity,
} from './search.types';
import { FALLBACK_HERO_IMAGE, FALLBACK_THUMBNAIL_IMAGE, SEARCH_CACHE_TTL_SECONDS } from './search.constants';

// ── In-memory TTL cache for hot search results ──
const memoryCache = new Map<string, { data: SearchCityResult[]; expiresAt: number }>();

function cacheKey(q: string, country?: string): string {
  return `search:${q.toLowerCase()}:${country || 'ALL'}`;
}

function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function hasCoordinates(place: Pick<GeoDBCity, 'latitude' | 'longitude'>): boolean {
  return Number.isFinite(place.latitude) && Number.isFinite(place.longitude);
}

function destinationKey(place: GeoDBCity): string {
  return `${place.type}:${place.id || place.wikiDataId || normalizeName(place.name || place.city)}:${place.countryCode}`;
}

function destinationRank(place: GeoDBCity, query: string): number {
  const queryName = normalizeName(query);
  const placeName = normalizeName(place.name || place.city || '');
  let score = 0;

  if (placeName === queryName) score += 1000;
  if (placeName.startsWith(queryName)) score += 250;
  if (place.type === 'CITY') score += 150;
  if (place.type === 'COUNTRY') score += 125;
  if (place.type === 'ADM1' || place.type === 'ADM2') score += 80;
  if (/\barrondissement\b|\bdistrict\b|\bborough\b/i.test(place.name || '')) score -= 300;
  score += Math.min(Number(place.population || 0) / 100000, 200);

  return score;
}

function countryRank(country: GeoDBCountry, query: string): number {
  const queryName = normalizeName(query);
  const countryName = normalizeName(country.name);
  let score = 0;
  if (countryName === queryName) score += 1000;
  if (countryName.startsWith(queryName)) score += 250;
  return score;
}

function rankDestinations(places: GeoDBCity[], query: string, limit: number): GeoDBCity[] {
  const seen = new Set<string>();

  return places
    .filter(hasCoordinates)
    .filter((place) => {
      const key = destinationKey(place);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => destinationRank(b, query) - destinationRank(a, query))
    .slice(0, limit);
}

async function searchCountryDestinations(query: string, limit: number): Promise<GeoDBCity[]> {
  const countries = await geoDBProvider.searchCountries(query, Math.max(limit, 5));
  const rankedCountries = countries
    .sort((a, b) => countryRank(b, query) - countryRank(a, query))
    .slice(0, Math.min(2, limit));

  const destinations: GeoDBCity[] = [];
  for (const country of rankedCountries) {
    const representativePlaces = await geoDBProvider.searchCountryPlaces(country.code, 1);
    const representative = representativePlaces.find(hasCoordinates);
    if (!representative) continue;

    destinations.push({
      ...representative,
      id: Number(representative.id || 0),
      wikiDataId: country.wikiDataId || representative.wikiDataId,
      type: 'COUNTRY',
      city: country.name,
      name: country.name,
      country: country.name,
      countryCode: country.code,
      region: 'Country',
      regionCode: country.code,
    });
  }

  return destinations;
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
  const requestLimit = Math.max(limit, 10);
  const cityResults = await geoDBProvider.searchCities(query, countryCode, requestLimit, offset);
  let geoResults = rankDestinations(cityResults, query, requestLimit);

  const hasStrongExactMatch = geoResults.some(
    (place) => normalizeName(place.name || place.city || '') === normalizeName(query),
  );

  if (geoResults.length < limit || !hasStrongExactMatch) {
    const adminResults = await geoDBProvider.searchAdminDivisions(query, countryCode, requestLimit, 0);
    geoResults = rankDestinations([...geoResults, ...adminResults], query, requestLimit);
  }

  if (geoResults.length < limit && !countryCode) {
    const countryResults = await searchCountryDestinations(query, requestLimit);
    geoResults = rankDestinations([...geoResults, ...countryResults], query, requestLimit);
  }

  logger.info('GeoDB normalized destination results', {
    query,
    count: geoResults.length,
    selected: geoResults.slice(0, 5).map((place) => ({
      name: place.name || place.city,
      type: place.type,
      country: place.country,
      region: place.region,
      latitude: place.latitude,
      longitude: place.longitude,
    })),
  });

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
    geoResults.slice(0, limit).map(async (city) => {
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
  const category = humanizeKind(place.kinds || place.kind);

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

function getCatalogueLookupNames(cityName: string): string[] {
  const normalized = cityName.trim();
  const names = new Set<string>([normalized]);

  const arrondissementMatch = normalized.match(/^\d+(?:st|nd|rd|th)?\s+arrondissement\s+of\s+(.+)$/i);
  if (arrondissementMatch?.[1]) {
    names.add(arrondissementMatch[1].trim());
  }

  const ofMatch = normalized.match(/\bof\s+(.+)$/i);
  if (ofMatch?.[1]) {
    names.add(ofMatch[1].trim());
  }

  return [...names].filter(Boolean);
}

function normalizeDestinationType(type?: CityPlacesInput['type']): DestinationType {
  if (type === 'COUNTRY' || type === 'country') return 'country';
  if (type === 'ADM1' || type === 'ADM2' || type === 'region') return 'region';
  if (type === 'CITY' || type === 'city') return 'city';
  return 'place';
}

const POPULAR_PLACE_FALLBACKS: Record<string, Array<Omit<CityPlaceSuggestion, 'id' | 'source'>>> = {
  paris: [
    { name: 'Eiffel Tower', category: 'Landmark', description: 'Iconic tower and one of the most recognizable city viewpoints.' },
    { name: 'Louvre Museum', category: 'Museum', description: 'World-famous art museum known for classic collections and palace architecture.' },
    { name: 'Montmartre', category: 'Neighborhood', description: 'Hilltop arts district with cafes, street views, and Sacre-Coeur nearby.' },
    { name: 'Notre-Dame Cathedral', category: 'Historic', description: 'Historic Gothic cathedral on the Ile de la Cite.' },
    { name: 'Seine River Walk', category: 'Experience', description: 'Classic riverside route for evening views and bridges.' },
  ],
  goa: [
    { name: 'Baga Beach', category: 'Beach', description: 'Popular beach area for food, nightlife, and water activities.' },
    { name: 'Fort Aguada', category: 'Historic', description: 'Seaside Portuguese fort with wide coastal views.' },
    { name: 'Basilica of Bom Jesus', category: 'Heritage', description: "UNESCO-listed church and one of Old Goa's most visited landmarks." },
    { name: 'Dudhsagar Falls', category: 'Nature', description: 'Large waterfall day trip often paired with forest routes.' },
    { name: 'Anjuna Flea Market', category: 'Market', description: 'Lively shopping stop for local goods, food, and music.' },
  ],
  amsterdam: [
    { name: 'Rijksmuseum', category: 'Museum', description: 'Major Dutch art and history museum in Museumplein.' },
    { name: 'Van Gogh Museum', category: 'Museum', description: 'Dedicated collection of Van Gogh works and related artists.' },
    { name: 'Anne Frank House', category: 'Historic', description: "Important historic museum connected to Anne Frank's story." },
    { name: 'Canal Ring', category: 'Experience', description: 'UNESCO-listed canal district best explored on foot or by boat.' },
    { name: 'Vondelpark', category: 'Park', description: 'Central green space for walks, cycling, and relaxed breaks.' },
  ],
  california: [
    { name: 'Golden Gate Bridge', category: 'Landmark', description: 'Famous San Francisco bridge with viewpoints on both sides.' },
    { name: 'Yosemite Valley', category: 'Nature', description: 'National park valley known for granite cliffs and waterfalls.' },
    { name: 'Santa Monica Pier', category: 'Coast', description: 'Classic beach pier with ocean views and casual food stops.' },
    { name: 'Big Sur', category: 'Scenic Drive', description: 'Pacific coast route known for dramatic cliffs and sea views.' },
    { name: 'Hollywood Walk of Fame', category: 'Entertainment', description: 'Los Angeles landmark tied to film and pop culture.' },
  ],
  japan: [
    { name: 'Mount Fuji', category: 'Nature', description: "Japan's famous mountain and a classic scenic day trip region." },
    { name: 'Fushimi Inari Taisha', category: 'Temple', description: 'Kyoto shrine known for thousands of red torii gates.' },
    { name: 'Tokyo Tower', category: 'Landmark', description: 'Central Tokyo observation tower with skyline views.' },
    { name: 'Kiyomizu-dera', category: 'Temple', description: 'Historic Kyoto temple with a large wooden stage and city views.' },
    { name: 'Osaka Castle', category: 'Historic', description: 'Restored castle and park area in Osaka.' },
  ],
};

function getFallbackPlaces(destinationName: string, limit: number): CityPlaceSuggestion[] {
  const normalized = normalizeName(destinationName);
  const knownKey = Object.keys(POPULAR_PLACE_FALLBACKS).find(
    (key) => normalized === key || normalized.endsWith(` ${key}`) || normalized.includes(`of ${key}`),
  );

  const fallbackPlaces = knownKey
    ? POPULAR_PLACE_FALLBACKS[knownKey]
    : [
        { name: `${destinationName} historic center`, category: 'Sightseeing', description: 'A good starting point for landmarks, walking routes, and local context.' },
        { name: `${destinationName} main market`, category: 'Market', description: 'A practical stop for food, shopping, and local atmosphere.' },
        { name: `${destinationName} museum district`, category: 'Museum', description: 'Look for local museums and cultural institutions around the destination.' },
        { name: `${destinationName} viewpoint`, category: 'Viewpoint', description: 'A scenic stop for photos and orientation after arrival.' },
        { name: `${destinationName} food street`, category: 'Food', description: 'Explore local snacks, cafes, and casual restaurants.' },
      ];

  return fallbackPlaces.slice(0, limit).map((place, index) => ({
    ...place,
    id: `suggested:${normalized}:${index}`,
    source: 'suggested',
  }));
}

export async function getCityPlaces(input: CityPlacesInput): Promise<CityPlaceSuggestion[]> {
  const limit = input.limit ?? 8;
  const destinationType = normalizeDestinationType(input.type);
  let cataloguePlaces: CityPlaceSuggestion[] = [];

  logger.info('City place suggestions request', {
    name: input.name,
    country: input.country,
    destinationType,
    latitude: input.lat,
    longitude: input.lng,
    limit,
    hasOpenTripMapKey: openTripMapProvider.isConfigured,
  });

  for (const lookupName of getCatalogueLookupNames(input.name)) {
    cataloguePlaces = await getCataloguePlacesForCity(lookupName, input.country, limit);
    if (cataloguePlaces.length > 0) break;
  }

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
      {
        destinationName: input.name,
        destinationType,
        limit: limit - cataloguePlaces.length,
      },
    );
    externalPlaces = places.map((place) => mapOpenTripMapPlace(place, input.name));
  }

  const mergedPlaces = dedupePlaces([...cataloguePlaces, ...externalPlaces]).slice(0, limit);
  if (mergedPlaces.length > 0) {
    logger.info('City place suggestions response', {
      name: input.name,
      count: mergedPlaces.length,
      sources: mergedPlaces.reduce<Record<string, number>>((acc, place) => {
        acc[place.source] = (acc[place.source] || 0) + 1;
        return acc;
      }, {}),
    });
    return mergedPlaces;
  }

  const fallbackPlaces = getFallbackPlaces(input.name, limit);
  logger.warn('City place suggestions fell back to generated suggestions', {
    name: input.name,
    country: input.country,
    destinationType,
    hasCoordinates: input.lat !== undefined && input.lng !== undefined,
    hasOpenTripMapKey: openTripMapProvider.isConfigured,
    count: fallbackPlaces.length,
  });

  return fallbackPlaces;
}
