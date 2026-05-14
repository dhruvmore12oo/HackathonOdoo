'use client';

import type { TrendingCity } from '@/types';
import { CityCard } from './CityCard';
import { TrendingUp } from 'lucide-react';
import type { SearchCityResult } from '@/types';

interface TrendingDestinationsProps {
  cities: TrendingCity[];
  onCityClick?: (city: SearchCityResult) => void;
  isLoading?: boolean;
}

export function TrendingDestinations({ cities, onCityClick, isLoading }: TrendingDestinationsProps) {
  if (isLoading) return null;
  if (!cities || cities.length === 0) return null;

  return (
    <div className="animate-in">
      <div className="flex items-center gap-2 mb-5">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent-50">
          <TrendingUp className="h-4 w-4 text-accent-500" />
        </div>
        <div>
          <h2 className="font-heading text-base font-bold text-gray-900">Trending Destinations</h2>
          <p className="text-xs text-gray-400">Popular cities other travelers are exploring</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {cities.map((city, i) => (
          <CityCard
            key={city.id}
            city={city}
            onClick={onCityClick}
            priority={i < 4}
          />
        ))}
      </div>
    </div>
  );
}
