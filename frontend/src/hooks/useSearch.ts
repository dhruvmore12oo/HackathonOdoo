'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import { API_ENDPOINTS } from '@/lib/constants';
import type { ApiResponse, SearchCityResult, TrendingCity } from '@/types';

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
