import axios from 'axios';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import type { CityMediaProvider, NormalizedImage, UnsplashSearchResponse } from './media.types';
import { UNSPLASH_TIMEOUT_MS, FALLBACK_HERO, FALLBACK_THUMB, TRAVEL_SUFFIXES } from './media.constants';

/**
 * Unsplash provider – fetches travel-oriented city imagery.
 * Builds intelligent search queries and normalises responses.
 */
class UnsplashProvider implements CityMediaProvider {
  private readonly baseUrl: string;
  private readonly accessKey: string;

  constructor() {
    this.baseUrl = env.UNSPLASH_BASE_URL;
    this.accessKey = env.UNSPLASH_ACCESS_KEY;
  }

  async searchCityImages(cityName: string, countryName: string): Promise<NormalizedImage> {
    const query = this.buildSearchQuery(cityName, countryName);

    try {
      const { data } = await axios.get<UnsplashSearchResponse>(`${this.baseUrl}/search/photos`, {
        params: {
          query,
          per_page: 1,
          orientation: 'landscape',
          content_filter: 'high',
          order_by: 'relevant',
        },
        headers: {
          Authorization: `Client-ID ${this.accessKey}`,
        },
        timeout: UNSPLASH_TIMEOUT_MS,
      });

      if (data.results.length > 0) {
        return this.normalizeImage(data.results[0]);
      }

      // Retry with simpler query (just city name)
      return this.fallbackSearch(cityName);
    } catch (error: unknown) {
      const err = error as { message?: string };
      logger.warn(`Unsplash search failed for "${query}": ${err.message}`);
      return { heroUrl: FALLBACK_HERO, thumbnailUrl: FALLBACK_THUMB };
    }
  }

  async getHeroImage(cityName: string, countryName: string): Promise<string> {
    const result = await this.searchCityImages(cityName, countryName);
    return result.heroUrl;
  }

  /** Build a travel-focused search query */
  private buildSearchQuery(cityName: string, countryName: string): string {
    const suffix = TRAVEL_SUFFIXES[Math.floor(Math.random() * TRAVEL_SUFFIXES.length)];
    return `${cityName} ${countryName} ${suffix}`;
  }

  /** Try a simpler query if the first one returned no results */
  private async fallbackSearch(cityName: string): Promise<NormalizedImage> {
    try {
      const { data } = await axios.get<UnsplashSearchResponse>(`${this.baseUrl}/search/photos`, {
        params: {
          query: `${cityName} city`,
          per_page: 1,
          orientation: 'landscape',
          content_filter: 'high',
        },
        headers: {
          Authorization: `Client-ID ${this.accessKey}`,
        },
        timeout: UNSPLASH_TIMEOUT_MS,
      });

      if (data.results.length > 0) {
        return this.normalizeImage(data.results[0]);
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      logger.warn(`Unsplash fallback search failed for "${cityName}": ${err.message}`);
    }

    return { heroUrl: FALLBACK_HERO, thumbnailUrl: FALLBACK_THUMB };
  }

  /** Normalise an Unsplash photo into our standard format */
  private normalizeImage(photo: UnsplashSearchResponse['results'][0]): NormalizedImage {
    return {
      heroUrl: `${photo.urls.regular}&w=1200&q=80`,
      thumbnailUrl: `${photo.urls.small}&w=400&q=80`,
      attribution: `Photo by ${photo.user.name} on Unsplash`,
    };
  }
}

/** Singleton */
export const unsplashProvider = new UnsplashProvider();
