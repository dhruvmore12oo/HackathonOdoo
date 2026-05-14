'use client';

import type { SearchCityResult } from '@/types';
import { CityCard } from './CityCard';

interface SearchResultsProps {
  results: SearchCityResult[];
  onCityClick?: (city: SearchCityResult) => void;
}

export function SearchResults({ results, onCityClick }: SearchResultsProps) {
  return (
    <div className="animate-in">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading text-base font-bold text-gray-900">
          Search Results
        </h2>
        <span className="text-xs text-gray-400 font-medium">
          {results.length} {results.length === 1 ? 'destination' : 'destinations'} found
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {results.map((city, i) => (
          <CityCard
            key={city.id}
            city={city}
            onClick={onCityClick}
            priority={i < 3}
          />
        ))}
      </div>
    </div>
  );
}
