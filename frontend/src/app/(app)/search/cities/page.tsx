'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { useCityPlaces, useCitySearch, useTrendingCities } from '@/hooks/useSearch';
import {
  SearchHero,
  SearchInput,
  CountryFilter,
  SearchResults,
  TrendingDestinations,
  SearchSkeleton,
  EmptySearchState,
} from '@/components/search';
import type { CityPlaceSuggestion, SearchCityResult } from '@/types';
import { AlertTriangle, Clock, IndianRupee, MapPin, Navigation } from 'lucide-react';

function formatDistance(meters?: number): string | null {
  if (!meters) return null;
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km away`;
  return `${meters} m away`;
}

function formatCost(cost?: number): string | null {
  if (cost === undefined) return null;
  if (cost === 0) return 'Free';
  return `Approx. INR ${cost.toLocaleString('en-IN')}`;
}

function PlaceSuggestionsPanel({
  city,
  places,
  isLoading,
}: {
  city: SearchCityResult;
  places: CityPlaceSuggestion[];
  isLoading: boolean;
}) {
  return (
    <div className="mb-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm animate-in">
      <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-500">Selected city</p>
          <h2 className="truncate font-heading text-lg font-bold text-gray-900">{city.name}</h2>
          <p className="truncate text-sm text-gray-500">
            {city.region ? `${city.region}, ` : ''}{city.country}
          </p>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700">
          <Navigation className="h-3.5 w-3.5" />
          Places to visit
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-32 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : places.length > 0 ? (
        <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
          {places.map((place) => {
            const cost = formatCost(place.estimatedCost);
            const distance = formatDistance(place.distanceMeters);

            return (
              <div key={place.id} className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                {place.imageUrl && (
                  <div className="relative mb-3 aspect-[16/9] overflow-hidden rounded-lg bg-gray-100">
                    <Image
                      src={place.imageUrl}
                      alt={place.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 260px"
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="mb-2 flex items-start justify-between gap-2">
                  <h3 className="line-clamp-2 font-semibold text-gray-900">{place.name}</h3>
                  <span className="shrink-0 rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-gray-500">
                    {place.category}
                  </span>
                </div>
                {place.description && (
                  <p className="line-clamp-2 text-sm text-gray-500">{place.description}</p>
                )}
                {(cost || place.durationHours || distance) && (
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500">
                    {cost && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1">
                        <IndianRupee className="h-3 w-3" />
                        {cost}
                      </span>
                    )}
                    {place.durationHours && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1">
                        <Clock className="h-3 w-3" />
                        {place.durationHours}h
                      </span>
                    )}
                    {distance && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1">
                        <MapPin className="h-3 w-3" />
                        {distance}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-6 text-center">
          <p className="font-semibold text-gray-900">No place suggestions found yet</p>
          <p className="mt-1 text-sm text-gray-500">
            Try another city from the results, or check back after more destination data is available.
          </p>
        </div>
      )}
    </div>
  );
}

export default function SearchCitiesPage() {
  const [inputValue, setInputValue] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [selectedCity, setSelectedCity] = useState<SearchCityResult | null>(null);

  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('traveloop_recent_searches');
      if (stored) setRecentSearches(JSON.parse(stored));
    } catch {
      // Ignore corrupt browser storage.
    }
  }, []);

  const addRecentSearch = useCallback((query: string) => {
    setRecentSearches((prev) => {
      const next = [query, ...prev.filter((q) => q !== query)].slice(0, 8);
      try {
        localStorage.setItem('traveloop_recent_searches', JSON.stringify(next));
      } catch {
        // Ignore browser storage failures.
      }
      return next;
    });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(inputValue.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [inputValue]);

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

  const {
    data: cityPlaces,
    isLoading: isPlacesLoading,
  } = useCityPlaces(selectedCity);

  const handleCityClick = useCallback(
    (city: SearchCityResult) => {
      setSelectedCity(city);
      addRecentSearch(city.name);
      toast.success(`Selected: ${city.name}, ${city.country}`);
    },
    [addRecentSearch],
  );

  const handleRecentClick = useCallback((query: string) => {
    setInputValue(query);
  }, []);

  return (
    <div className="animate-in pb-8">
      <SearchHero />

      <div className="mb-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
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

      {selectedCity && (
        <PlaceSuggestionsPanel
          city={selectedCity}
          places={cityPlaces || []}
          isLoading={isPlacesLoading}
        />
      )}

      {!isSearchActive && recentSearches.length > 0 && (
        <div className="mb-8 animate-in">
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-400">Recent searches</p>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map((query) => (
              <button
                key={query}
                onClick={() => handleRecentClick(query)}
                className="rounded-full bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-brand-50 hover:text-brand-600"
              >
                {query}
              </button>
            ))}
          </div>
        </div>
      )}

      {isSearchActive && isSearching && <SearchSkeleton />}

      {isSearchActive && isSearchError && (
        <div className="flex flex-col items-center justify-center py-16 text-center animate-in">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-danger-50">
            <AlertTriangle className="h-7 w-7 text-danger-500" />
          </div>
          <h3 className="mb-2 font-heading text-lg font-bold text-gray-900">Something went wrong</h3>
          <p className="mb-4 max-w-sm text-sm text-gray-500">
            We couldn&apos;t reach the search service. Please check your connection and try again.
          </p>
          <button
            onClick={() => retrySearch()}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
          >
            Retry
          </button>
        </div>
      )}

      {isSearchActive && !isSearching && !isSearchError && searchResults && searchResults.length > 0 && (
        <SearchResults results={searchResults} onCityClick={handleCityClick} />
      )}

      {isSearchActive && !isSearching && !isSearchError && searchResults && searchResults.length === 0 && (
        <EmptySearchState query={debouncedQuery} onRetry={() => retrySearch()} />
      )}

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
