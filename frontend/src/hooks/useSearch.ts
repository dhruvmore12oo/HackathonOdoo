'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import { API_ENDPOINTS } from '@/lib/constants';
import type { ApiResponse, CityPlaceSuggestion, SearchCityResult, TrendingCity } from '@/types';

/**
 * Search cities with debounced query.
 * Only fires when query.length >= 2.
 */
export function useCitySearch(query: string, country?: string) {
  return useQuery({
    queryKey: queryKeys.search.cities(query, country),
    queryFn: async () => {
      const params = new URLSearchParams({ q: query });
      if (country) params.set('country', country);
      const res = await api.get<ApiResponse<SearchCityResult[]>>(
        `${API_ENDPOINTS.SEARCH.CITIES}?${params}`,
      );
      return res.data.data;
    },
    enabled: query.length >= 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
    placeholderData: (prev) => prev,
    retry: 1,
  });
}

/**
 * Fetch trending destinations.
 */
export function useTrendingCities() {
  return useQuery({
    queryKey: queryKeys.search.trending,
    queryFn: async () => {
      const res = await api.get<ApiResponse<TrendingCity[]>>(API_ENDPOINTS.SEARCH.TRENDING);
      return res.data.data;
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

/**
 * Fetch recommended places for a selected city.
 */
export function useCityPlaces(city?: SearchCityResult | null) {
  return useQuery({
    queryKey: queryKeys.search.cityPlaces(city?.id ?? ''),
    queryFn: async () => {
      const params = new URLSearchParams({
        name: city!.name,
        country: city!.country,
        type: city!.destinationType || city!.type || 'city',
        lat: String(city!.latitude),
        lng: String(city!.longitude),
      });

      const res = await api.get<ApiResponse<CityPlaceSuggestion[]>>(
        `${API_ENDPOINTS.SEARCH.CITY_PLACES}?${params}`,
      );
      return res.data.data;
    },
    enabled: !!city,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
  });
}
