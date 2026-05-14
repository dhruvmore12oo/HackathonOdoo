'use client';

import Image from 'next/image';
import { MapPin, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SearchCityResult } from '@/types';

interface CityCardProps {
  city: SearchCityResult;
  onClick?: (city: SearchCityResult) => void;
  className?: string;
  priority?: boolean;
}

function formatPopulation(pop?: number): string {
  if (!pop) return '';
  if (pop >= 1_000_000) return `${(pop / 1_000_000).toFixed(1)}M`;
  if (pop >= 1_000) return `${(pop / 1_000).toFixed(0)}K`;
  return String(pop);
}

export function CityCard({ city, onClick, className, priority = false }: CityCardProps) {
  return (
    <button
      onClick={() => onClick?.(city)}
      className={cn(
        'group relative overflow-hidden rounded-xl bg-white border border-gray-200 shadow-sm',
        'hover:shadow-xl hover:-translate-y-1 hover:border-brand-200',
        'transition-all duration-300 ease-out text-left w-full',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2',
        className,
      )}
      aria-label={`View ${city.name}, ${city.country}`}
    >
      {/* Image */}
      <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
        <Image
          src={city.heroImage}
          alt={`${city.name}, ${city.country}`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          priority={priority}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Country badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 text-xs font-medium text-gray-700 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
          {city.countryCode}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-heading text-base font-bold text-gray-900 group-hover:text-brand-600 transition-colors truncate">
          {city.name}
        </h3>

        <div className="flex items-center gap-1.5 mt-1 text-sm text-gray-500">
          <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
          <span className="truncate">
            {city.region ? `${city.region}, ` : ''}
            {city.country}
          </span>
        </div>

        {city.population && (
          <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-400">
            <Users className="h-3 w-3 shrink-0" />
            <span>{formatPopulation(city.population)} people</span>
          </div>
        )}
      </div>
    </button>
  );
}
