'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, X, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

const POPULAR_COUNTRIES = [
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'TH', name: 'Thailand', flag: '🇹🇭' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
  { code: 'AE', name: 'UAE', flag: '🇦🇪' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
  { code: 'GR', name: 'Greece', flag: '🇬🇷' },
  { code: 'TR', name: 'Turkey', flag: '🇹🇷' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩' },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬' },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭' },
];

interface CountryFilterProps {
  value: string;
  onChange: (value: string) => void;
}

export function CountryFilter({ value, onChange }: CountryFilterProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Focus search when opened
  useEffect(() => {
    if (open) searchInputRef.current?.focus();
  }, [open]);

  const selected = POPULAR_COUNTRIES.find((c) => c.code === value);

  const filtered = useMemo(
    () =>
      search
        ? POPULAR_COUNTRIES.filter(
            (c) =>
              c.name.toLowerCase().includes(search.toLowerCase()) ||
              c.code.toLowerCase().includes(search.toLowerCase()),
          )
        : POPULAR_COUNTRIES,
    [search],
  );

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center gap-2 h-12 px-4 rounded-xl border-2 text-sm font-medium transition-all duration-200 bg-white whitespace-nowrap',
          value
            ? 'border-brand-200 bg-brand-50 text-brand-700'
            : 'border-gray-200 text-gray-600 hover:border-gray-300',
        )}
        aria-label="Filter by country"
        aria-expanded={open}
      >
        {selected ? (
          <>
            <span className="text-base">{selected.flag}</span>
            <span className="hidden sm:inline">{selected.name}</span>
            <span className="sm:hidden">{selected.code}</span>
          </>
        ) : (
          <>
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">Country</span>
          </>
        )}
        <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} />
      </button>

      {/* Clear button */}
      {value && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onChange('');
            setOpen(false);
          }}
          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-500 text-white rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors z-10"
          aria-label="Clear country filter"
        >
          <X className="h-3 w-3" />
        </button>
      )}

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 sm:right-0 sm:left-auto mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in">
          {/* Search */}
          <div className="p-2 border-b border-gray-100">
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search countries..."
              className="w-full px-3 py-2 text-sm bg-gray-50 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500 placeholder:text-gray-400"
            />
          </div>

          {/* List */}
          <div className="max-h-60 overflow-y-auto py-1">
            {/* All Countries option */}
            <button
              onClick={() => {
                onChange('');
                setOpen(false);
                setSearch('');
              }}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors text-left',
                !value && 'bg-brand-50 text-brand-700',
              )}
            >
              <Globe className="h-4 w-4 text-gray-400" />
              <span className="font-medium">All Countries</span>
            </button>

            {filtered.map((country) => (
              <button
                key={country.code}
                onClick={() => {
                  onChange(country.code);
                  setOpen(false);
                  setSearch('');
                }}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors text-left',
                  value === country.code && 'bg-brand-50 text-brand-700',
                )}
              >
                <span className="text-base">{country.flag}</span>
                <span className="font-medium">{country.name}</span>
                <span className="ml-auto text-xs text-gray-400">{country.code}</span>
              </button>
            ))}

            {filtered.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-gray-400">No countries found</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
