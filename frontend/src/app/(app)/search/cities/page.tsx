'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useCitySearch, useTrendingCities } from '@/hooks/useSearch';
import {
  SearchHero,
  SearchInput,
  CountryFilter,
  SearchResults,
  TrendingDestinations,
  SearchSkeleton,
  EmptySearchState,
} from '@/components/search';
import type { SearchCityResult } from '@/types';
import { AlertTriangle } from 'lucide-react';

export default function SearchCitiesPage() {
  const router = useRouter();

  // ── Local state ──
  const [inputValue, setInputValue] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [countryFilter, setCountryFilter] = useState('');

  // ── Recent searches (localStorage) ──
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('traveloop_recent_searches');
      if (stored) setRecentSearches(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

  const addRecentSearch = useCallback((query: string) => {
    setRecentSearches((prev) => {
      const next = [query, ...prev.filter((q) => q !== query)].slice(0, 8);
      try { localStorage.setItem('traveloop_recent_searches', JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  // ── 300ms debounce ──
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(inputValue.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [inputValue]);

  // ── Queries ──
  const isSearchActive = debouncedQuery.length >= 2;

  const {
    data: searchResults,
    isLoading: isSearching,
    isError: isSearchError,
    refetch: retrySearch,
  } = useCitySearch(debouncedQuery, countryFilter || undefined);

  const {
    data: trendingCities,
    isLoading: isTrendingLoading,
  } = useTrendingCities();

  // ── Handlers ──
  const handleCityClick = useCallback(
    (city: SearchCityResult) => {
      addRecentSearch(city.name);
      toast.success(`Selected: ${city.name}, ${city.country}`);
      // Future: navigate to a city detail or trip creation page
      // router.push(`/trips/new?city=${city.id}`);
    },
    [addRecentSearch],
  );

  const handleRecentClick = useCallback((query: string) => {
    setInputValue(query);
  }, []);

  return (
    <div className="animate-in pb-8">
      {/* Hero */}
      <SearchHero />

      {/* Search Bar + Country Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-8">
        <div className="flex-1">
          <SearchInput
            value={inputValue}
            onChange={setInputValue}
            isLoading={isSearching}
            placeholder="Search cities worldwide... (e.g. Paris, Tokyo, Goa)"
          />
        </div>
        <CountryFilter value={countryFilter} onChange={setCountryFilter} />
      </div>

      {/* Recent Searches (when idle) */}
      {!isSearchActive && recentSearches.length > 0 && (
        <div className="mb-8 animate-in">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-3">Recent searches</p>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map((q) => (
              <button
                key={q}
                onClick={() => handleRecentClick(q)}
                className="px-3 py-1.5 bg-gray-100 hover:bg-brand-50 hover:text-brand-600 text-sm text-gray-600 rounded-full transition-colors font-medium"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading State */}
      {isSearchActive && isSearching && <SearchSkeleton />}

      {/* Error State */}
      {isSearchActive && isSearchError && (
        <div className="flex flex-col items-center justify-center py-16 text-center animate-in">
          <div className="w-14 h-14 rounded-2xl bg-danger-50 flex items-center justify-center mb-4">
            <AlertTriangle className="h-7 w-7 text-danger-500" />
          </div>
          <h3 className="font-heading text-lg font-bold text-gray-900 mb-2">Something went wrong</h3>
          <p className="text-sm text-gray-500 mb-4 max-w-sm">
            We couldn&apos;t reach the search service. Please check your connection and try again.
          </p>
          <button
            onClick={() => retrySearch()}
            className="px-4 py-2 bg-brand-500 text-white text-sm font-semibold rounded-lg hover:bg-brand-600 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Search Results */}
      {isSearchActive && !isSearching && !isSearchError && searchResults && searchResults.length > 0 && (
        <SearchResults results={searchResults} onCityClick={handleCityClick} />
      )}

      {/* Empty Results */}
      {isSearchActive && !isSearching && !isSearchError && searchResults && searchResults.length === 0 && (
        <EmptySearchState query={debouncedQuery} onRetry={() => retrySearch()} />
      )}

      {/* Trending (when no active search) */}
      {!isSearchActive && (
        <TrendingDestinations
          cities={trendingCities || []}
          onCityClick={handleCityClick}
          isLoading={isTrendingLoading}
        />
      )}
    </div>
  );
}
