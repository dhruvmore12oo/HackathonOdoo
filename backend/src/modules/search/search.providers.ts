import axios from 'axios';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import type { GeoDBCity, GeoDBResponse, CitySearchProvider } from './search.types';
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
    const params: Record<string, string | number> = {
      namePrefix: query,
      limit,
      offset,
      types: 'CITY',
      sort: '-population',
      languageCode: 'en',
      minPopulation: 10000,
    };

    if (countryCode) {
      params.countryIds = countryCode;
    }

    return this.makeRequest<GeoDBResponse>('/cities', params)
      .then((res) => res?.data ?? []);
  }

  async getCityDetails(cityId: string): Promise<GeoDBCity | null> {
    return this.makeRequest<{ data: GeoDBCity }>(`/cities/${cityId}`)
      .then((res) => res?.data ?? null);
  }

  /** Generic request with retry + exponential backoff */
  private async makeRequest<T>(
    path: string,
    params: Record<string, string | number> = {},
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
