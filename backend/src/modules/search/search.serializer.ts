import type { SearchCityResult, TrendingCity, GeoDBCity, CachedCity } from './search.types';
import { FALLBACK_HERO_IMAGE, FALLBACK_THUMBNAIL_IMAGE } from './search.constants';

function getDestinationType(type?: string): SearchCityResult['destinationType'] {
  if (type === 'COUNTRY') return 'country';
  if (type === 'ADM1' || type === 'ADM2' || type === 'REGION') return 'region';
  if (type === 'CITY') return 'city';
  return 'place';
}

/**
 * Serialize a GeoDB city + image data into the API response shape.
 */
export function serializeGeoDBCity(
  city: GeoDBCity,
  heroImage: string,
  thumbnailImage: string,
): SearchCityResult {
  return {
    id: String(city.id),
    name: city.name || city.city,
    country: city.country,
    countryCode: city.countryCode,
    region: city.region || undefined,
    type: city.type,
    destinationType: getDestinationType(city.type),
    latitude: city.latitude,
    longitude: city.longitude,
    population: city.population || undefined,
    heroImage,
    thumbnailImage,
  };
}

/**
 * Serialize a cached city row into the API response shape.
 */
export function serializeCachedCity(row: CachedCity): SearchCityResult {
  return {
    id: row.provider_city_id,
    name: row.name,
    country: row.country,
    countryCode: row.country_code,
    region: row.region || undefined,
    type: 'CITY',
    destinationType: 'city',
    latitude: row.latitude,
    longitude: row.longitude,
    population: row.population || undefined,
    heroImage: row.hero_image_url || FALLBACK_HERO_IMAGE,
    thumbnailImage: row.thumbnail_image_url || FALLBACK_THUMBNAIL_IMAGE,
  };
}

/**
 * Serialize a cached city row into a trending city shape.
 */
export function serializeTrendingCity(row: CachedCity): TrendingCity {
  return {
    ...serializeCachedCity(row),
    searchCount: row.search_count,
  };
}
