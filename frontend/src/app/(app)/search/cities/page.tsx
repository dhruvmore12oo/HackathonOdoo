'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { AlertTriangle, Clock, IndianRupee, MapPin, Navigation, Plus } from 'lucide-react';
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
import { ROUTES } from '@/lib/constants';
import { useTripStore } from '@/stores/tripStore';
import type { CityPlaceSuggestion, SearchCityResult } from '@/types';

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
  isError,
  onRetry,
  onAddToItinerary,
  hasActiveTrip,
}: {
  city: SearchCityResult;
  places: CityPlaceSuggestion[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onAddToItinerary: (place: CityPlaceSuggestion) => void;
  hasActiveTrip: boolean;
}) {
  return (
    <div className="mb-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm animate-in">
      <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-500">
            Selected {city.destinationType || 'destination'}
          </p>
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
            <div key={index} className="h-44 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : isError ? (
        <div className="p-6 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-danger-50">
            <AlertTriangle className="h-5 w-5 text-danger-500" />
          </div>
          <p className="font-semibold text-gray-900">Couldn&apos;t load recommendations</p>
          <p className="mt-1 text-sm text-gray-500">
            The destination is selected, but the attraction service did not respond cleanly.
          </p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
          >
            Retry
          </button>
        </div>
      ) : places.length > 0 ? (
        <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
          {places.map((place) => {
            const cost = formatCost(place.estimatedCost);
            const distance = formatDistance(place.distanceMeters);
            const imageUrl = place.imageUrl || city.heroImage;

            return (
              <div
                key={place.id}
                className="overflow-hidden rounded-xl border border-gray-100 bg-gray-50 shadow-sm transition hover:border-brand-200 hover:shadow-md"
              >
                <div className="relative aspect-[16/9] overflow-hidden bg-gray-100">
                  {imageUrl && (
                    <Image
                      src={imageUrl}
                      alt={place.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 260px"
                      className="object-cover transition-transform duration-500 hover:scale-105"
                    />
                  )}
                  {place.source === 'suggested' && (
                    <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2 py-1 text-[11px] font-semibold text-gray-600 shadow-sm">
                      Suggested
                    </span>
                  )}
                </div>
                <div className="p-3">
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
                  <button
                    type="button"
                    onClick={() => onAddToItinerary(place)}
                    className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-brand-100 bg-white px-3 py-2 text-xs font-semibold text-brand-700 transition-colors hover:bg-brand-50"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {hasActiveTrip ? 'Add to itinerary' : 'Choose trip'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-6 text-center">
          <p className="font-semibold text-gray-900">No recommendations loaded</p>
          <p className="mt-1 text-sm text-gray-500">
            Try again in a moment. We now fall back to curated suggestions when the attraction API has no data.
          </p>
        </div>
      )}
    </div>
  );
}

export default function SearchCitiesPage() {
  const router = useRouter();
  const activeTrip = useTripStore((state) => state.activeTrip);
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
    isError: isPlacesError,
    refetch: retryPlaces,
  } = useCityPlaces(selectedCity);

  const handleCityClick = useCallback(
    (city: SearchCityResult) => {
      setSelectedCity(city);
      addRecentSearch(city.name);
      toast.success(`Selected: ${city.name}, ${city.country}`);
    },
    [addRecentSearch],
  );

  const handleAddToItinerary = useCallback((place: CityPlaceSuggestion) => {
    if (!activeTrip?.id) {
      toast('Open a trip first, then add places to its itinerary.');
      router.push(ROUTES.TRIPS);
      return;
    }

    const params = new URLSearchParams({
      activity: place.name,
      location: place.name,
      type: place.category,
      notes: place.description || '',
      cost: String(place.estimatedCost ?? 0),
    });
    if (place.durationHours) {
      params.set('duration', String(Math.round(place.durationHours * 60)));
    }

    router.push(`${ROUTES.TRIP_ITINERARY(activeTrip.id)}?${params.toString()}`);
  }, [activeTrip?.id, router]);

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
            placeholder="Search cities, states, or countries... (e.g. Paris, Goa, Japan)"
          />
        </div>
        <CountryFilter value={countryFilter} onChange={setCountryFilter} />
      </div>

      {selectedCity && (
        <PlaceSuggestionsPanel
          city={selectedCity}
          places={cityPlaces || []}
          isLoading={isPlacesLoading}
          isError={isPlacesError}
          onRetry={() => retryPlaces()}
          onAddToItinerary={handleAddToItinerary}
          hasActiveTrip={!!activeTrip?.id}
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
