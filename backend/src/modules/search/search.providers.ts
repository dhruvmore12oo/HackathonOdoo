import axios from 'axios';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import type {
  CitySearchProvider,
  DestinationType,
  GeoDBCity,
  GeoDBCountry,
  GeoDBCountryResponse,
  GeoDBResponse,
  OpenTripMapPlace,
  OpenTripMapSearchOptions,
} from './search.types';
import {
  MAX_RETRY_ATTEMPTS,
  RETRY_BASE_DELAY_MS,
  EXTERNAL_API_TIMEOUT_MS,
  DEFAULT_SEARCH_LIMIT,
} from './search.constants';

/**
 * GeoDB Cities provider – wraps the RapidAPI GeoDB endpoint.
 * Handles retries, timeouts, and response normalisation.
 */
class GeoDBProvider implements CitySearchProvider {
  private readonly baseUrl: string;
  private readonly headers: Record<string, string>;

  constructor() {
    this.baseUrl = env.GEODB_BASE_URL;
    this.headers = {
      'X-RapidAPI-Key': env.GEODB_API_KEY,
      'X-RapidAPI-Host': env.GEODB_HOST,
    };
  }

  async searchCities(
    query: string,
    countryCode?: string,
    limit = DEFAULT_SEARCH_LIMIT,
    offset = 0,
  ): Promise<GeoDBCity[]> {
    const params: Record<string, string | number | boolean> = {
      namePrefix: query,
      limit,
      offset,
      types: 'CITY,ADM2',
      sort: '-population',
      languageCode: 'en',
      minPopulation: 10000,
      hateoasMode: false,
    };

    if (countryCode) {
      params.countryIds = countryCode;
    }

    logger.info('GeoDB city search request', { query, countryCode, limit, offset, types: params.types });

    return this.makeRequest<GeoDBResponse>('/cities', params)
      .then((res) => {
        const rows = res?.data ?? [];
        logger.info('GeoDB city search response', {
          query,
          count: rows.length,
          firstResults: rows.slice(0, 3).map((row) => ({
            name: row.name || row.city,
            type: row.type,
            country: row.country,
            region: row.region,
            latitude: row.latitude,
            longitude: row.longitude,
          })),
        });
        return rows;
      });
  }

  async searchAdminDivisions(
    query: string,
    countryCode?: string,
    limit = DEFAULT_SEARCH_LIMIT,
    offset = 0,
  ): Promise<GeoDBCity[]> {
    const params: Record<string, string | number | boolean> = {
      namePrefix: query,
      limit,
      offset,
      sort: '-population',
      languageCode: 'en',
      hateoasMode: false,
    };

    if (countryCode) {
      params.countryIds = countryCode;
    }

    logger.info('GeoDB admin division search request', { query, countryCode, limit, offset });

    return this.makeRequest<GeoDBResponse>('/adminDivisions', params)
      .then((res) => {
        const rows = res?.data ?? [];
        logger.info('GeoDB admin division search response', {
          query,
          count: rows.length,
          firstResults: rows.slice(0, 3).map((row) => ({
            name: row.name,
            type: row.type,
            country: row.country,
            region: row.region,
            latitude: row.latitude,
            longitude: row.longitude,
          })),
        });
        return rows;
      });
  }

  async searchCountries(query: string, limit = DEFAULT_SEARCH_LIMIT, offset = 0): Promise<GeoDBCountry[]> {
    const params: Record<string, string | number | boolean> = {
      namePrefix: query,
      limit,
      offset,
      sort: 'name',
      languageCode: 'en',
      hateoasMode: false,
    };

    logger.info('GeoDB country search request', { query, limit, offset });

    return this.makeRequest<GeoDBCountryResponse>('/countries', params)
      .then((res) => {
        const rows = res?.data ?? [];
        logger.info('GeoDB country search response', {
          query,
          count: rows.length,
          firstResults: rows.slice(0, 3).map((row) => ({ name: row.name, code: row.code })),
        });
        return rows;
      });
  }

  async searchCountryPlaces(countryCode: string, limit = DEFAULT_SEARCH_LIMIT): Promise<GeoDBCity[]> {
    const params: Record<string, string | number | boolean> = {
      limit,
      offset: 0,
      types: 'CITY',
      sort: '-population',
      languageCode: 'en',
      hateoasMode: false,
    };

    logger.info('GeoDB country places request', { countryCode, limit });

    return this.makeRequest<GeoDBResponse>(`/countries/${countryCode}/places`, params)
      .then((res) => {
        const rows = res?.data ?? [];
        logger.info('GeoDB country places response', {
          countryCode,
          count: rows.length,
          firstResults: rows.slice(0, 3).map((row) => ({
            name: row.name,
            type: row.type,
            latitude: row.latitude,
            longitude: row.longitude,
          })),
        });
        return rows;
      });
  }

  async getCityDetails(cityId: string): Promise<GeoDBCity | null> {
    return this.makeRequest<{ data: GeoDBCity }>(`/cities/${cityId}`)
      .then((res) => res?.data ?? null);
  }

  /** Generic request with retry + exponential backoff */
  private async makeRequest<T>(
    path: string,
    params: Record<string, string | number | boolean> = {},
    attempt = 1,
  ): Promise<T | null> {
    try {
      const { data } = await axios.get<T>(`${this.baseUrl}${path}`, {
        headers: this.headers,
        params,
        timeout: EXTERNAL_API_TIMEOUT_MS,
      });
      return data;
    } catch (error: unknown) {
      const axiosErr = error as { response?: { status?: number }; message?: string };
      const status = axiosErr.response?.status;

      // Rate-limited or transient server error – retry
      if ((status === 429 || (status && status >= 500)) && attempt <= MAX_RETRY_ATTEMPTS) {
        const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1);
        logger.warn(`GeoDB request to ${path} failed (${status}), retrying in ${delay}ms (attempt ${attempt}/${MAX_RETRY_ATTEMPTS})`);
        await new Promise((r) => setTimeout(r, delay));
        return this.makeRequest<T>(path, params, attempt + 1);
      }

      logger.error('GeoDB request failed', { path, status, message: axiosErr.message });
      return null;
    }
  }
}

/** Singleton */
export const geoDBProvider = new GeoDBProvider();

class OpenTripMapProvider {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor() {
    this.baseUrl = env.OPENTRIPMAP_BASE_URL;
    this.apiKey = env.OPENTRIPMAP_API_KEY.trim();
  }

  get isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  async getPlacesNearCity(
    latitude: number,
    longitude: number,
    optionsOrLimit: OpenTripMapSearchOptions | number = 8,
  ): Promise<OpenTripMapPlace[]> {
    if (!this.isConfigured) return [];

    const options = typeof optionsOrLimit === 'number'
      ? { limit: optionsOrLimit, destinationName: 'destination' }
      : optionsOrLimit;
    const limit = options.limit ?? 8;
    const attempts = buildOpenTripMapAttempts(options.destinationType);
    const collected = new Map<string, OpenTripMapPlace>();

    for (const attempt of attempts) {
      const places = await this.requestRadius(latitude, longitude, limit, attempt, options);
      for (const place of places) {
        const key = place.xid || `${place.name}:${place.point?.lat}:${place.point?.lon}`;
        if (!collected.has(key)) collected.set(key, place);
        if (collected.size >= limit) break;
      }

      if (collected.size >= Math.min(limit, 4)) break;
    }

    return [...collected.values()]
      .sort((a, b) => Number(b.rate ?? 0) - Number(a.rate ?? 0) || Number(a.dist ?? 0) - Number(b.dist ?? 0))
      .slice(0, limit);
  }

  private async requestRadius(
    latitude: number,
    longitude: number,
    limit: number,
    attempt: OpenTripMapAttempt,
    options: OpenTripMapSearchOptions,
  ): Promise<OpenTripMapPlace[]> {
    try {
      const requestLimit = Math.min(Math.max(limit * 10, 60), 100);
      const params: Record<string, string | number> = {
        radius: attempt.radius,
        lat: latitude,
        lon: longitude,
        rate: attempt.rate,
        limit: requestLimit,
        format: 'json',
        apikey: this.apiKey,
      };

      if (attempt.kinds) {
        params.kinds = attempt.kinds;
      }

      logger.info('OpenTripMap radius request', {
        destinationName: options.destinationName,
        destinationType: options.destinationType,
        latitude,
        longitude,
        radius: attempt.radius,
        rate: attempt.rate,
        kinds: attempt.kinds || 'default',
        requestLimit,
      });

      const { data } = await axios.get<OpenTripMapPlace[]>(`${this.baseUrl}/radius`, {
        params,
        timeout: EXTERNAL_API_TIMEOUT_MS,
      });

      if (!Array.isArray(data)) {
        logger.warn('OpenTripMap returned an unexpected response shape', {
          destinationName: options.destinationName,
          radius: attempt.radius,
          rate: attempt.rate,
        });
        return [];
      }

      const namedPlaces = data
        .filter((place) => place.name?.trim())
        .sort((a, b) => Number(b.rate ?? 0) - Number(a.rate ?? 0) || Number(a.dist ?? 0) - Number(b.dist ?? 0))
        .slice(0, limit);

      logger.info('OpenTripMap radius response', {
        destinationName: options.destinationName,
        totalCount: data.length,
        namedCount: namedPlaces.length,
        firstResults: namedPlaces.slice(0, 5).map((place) => ({
          name: place.name,
          kinds: place.kinds || place.kind,
          dist: place.dist,
          rate: place.rate,
        })),
      });

      return namedPlaces;
    } catch (error: unknown) {
      const axiosErr = error as { response?: { status?: number }; message?: string };
      logger.warn('OpenTripMap places request failed', {
        destinationName: options.destinationName,
        latitude,
        longitude,
        radius: attempt.radius,
        rate: attempt.rate,
        kinds: attempt.kinds || 'default',
        status: axiosErr.response?.status,
        message: axiosErr.message,
      });
      return [];
    }
  }
}

export const openTripMapProvider = new OpenTripMapProvider();

interface OpenTripMapAttempt {
  radius: number;
  rate: '1' | '2' | '3';
  kinds?: string;
}

function getBaseRadius(destinationType?: DestinationType): number {
  switch (destinationType) {
    case 'country':
      return 120000;
    case 'region':
      return 70000;
    case 'place':
      return 20000;
    case 'city':
    default:
      return 15000;
  }
}

function buildOpenTripMapAttempts(destinationType?: DestinationType): OpenTripMapAttempt[] {
  const baseRadius = getBaseRadius(destinationType);

  return [
    { radius: baseRadius, rate: '3', kinds: 'interesting_places' },
    { radius: Math.round(baseRadius * 1.75), rate: '2', kinds: 'interesting_places' },
    { radius: Math.round(baseRadius * 2.5), rate: '2', kinds: 'cultural,historic,architecture,natural' },
    { radius: Math.round(baseRadius * 3.5), rate: '1' },
  ];
}
