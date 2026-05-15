'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, MapPin, Eye, Calendar, Globe, TrendingUp, Compass } from 'lucide-react';
import { Card, CardContent, Spinner, Input, Badge } from '@/components/ui';
import { useCommunityTrips } from '@/hooks/useShare';
import { ROUTES } from '@/lib/constants';
import { getAssetUrl } from '@/lib/utils';
import type { PublicTripData } from '@/types';

function TripCard({ trip }: { trip: PublicTripData }) {
  const dayCount = Math.ceil(
    (new Date(trip.end_date).getTime() - new Date(trip.start_date).getTime()) / 86400000
  ) + 1;

  return (
    <Link
      href={trip.share_slug ? ROUTES.SHARE(trip.share_slug) : '#'}
      className="group block rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
    >
      {/* Cover */}
      <div className="relative h-44 bg-gradient-to-br from-brand-400 to-brand-600 overflow-hidden">
        {trip.cover_photo_url ? (
          <img src={getAssetUrl(trip.cover_photo_url)} alt={trip.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Compass className="h-12 w-12 text-white/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-2 left-3 right-3">
          <h3 className="text-white font-bold text-base leading-tight line-clamp-1">{trip.title}</h3>
          {trip.destination_summary && (
            <p className="text-white/80 text-xs flex items-center gap-1 mt-0.5">
              <MapPin className="h-3 w-3" /> {trip.destination_summary}
            </p>
          )}
        </div>
        <div className="absolute top-2 right-2">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            trip.status === 'upcoming' ? 'bg-blue-500 text-white' :
            trip.status === 'ongoing' ? 'bg-green-500 text-white' :
            'bg-gray-700 text-white'
          }`}>{trip.status}</span>
        </div>
      </div>

      {/* Body */}
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {dayCount} days</span>
          <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {trip.view_count} views</span>
          <span className="ml-auto text-gray-400">{trip.owner.first_name} {trip.owner.last_name[0]}.</span>
        </div>
        {trip.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {trip.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0.5">{tag}</Badge>
            ))}
            {trip.tags.length > 3 && <span className="text-[10px] text-gray-400">+{trip.tags.length - 3}</span>}
          </div>
        )}
      </CardContent>
    </Link>
  );
}

export default function CommunityPage() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useCommunityTrips({ q: debouncedQuery || undefined, page });

  const handleSearch = (val: string) => {
    setQuery(val);
    clearTimeout((window as unknown as { _st: ReturnType<typeof setTimeout> })._st);
    (window as unknown as { _st: ReturnType<typeof setTimeout> })._st = setTimeout(() => {
      setDebouncedQuery(val);
      setPage(1);
    }, 400);
  };

  const trips = (data?.data ?? []) as PublicTripData[];
  const pagination = data?.pagination;

  return (
    <div className="animate-in space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-50 text-brand-600 text-sm font-medium">
          <Globe className="h-4 w-4" /> Community
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 font-heading">
          Discover Public Trips
        </h1>
        <p className="text-gray-500 max-w-lg mx-auto">
          Explore travel itineraries shared by the Traveloop community. Get inspired for your next adventure.
        </p>
      </div>

      {/* Search */}
      <div className="max-w-xl mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-300 text-sm"
            placeholder="Search destinations, trip names..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Stats bar */}
      {pagination && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span className="flex items-center gap-1"><TrendingUp className="h-4 w-4 text-brand-400" /> {pagination.total} public trips</span>
          <span>Page {pagination.page} of {pagination.totalPages}</span>
        </div>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : trips.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {trips.map((trip) => <TripCard key={trip.id} trip={trip} />)}
        </div>
      ) : (
        <div className="text-center py-16 space-y-3">
          <Compass className="h-12 w-12 text-gray-200 mx-auto" />
          <p className="text-gray-400 font-medium">No public trips found</p>
          <p className="text-gray-300 text-sm">Be the first to share a trip with the community!</p>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            disabled={!pagination.hasPrev}
            onClick={() => setPage((p) => p - 1)}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm disabled:opacity-40 hover:bg-gray-50 transition"
          >
            ← Previous
          </button>
          <span className="px-4 py-2 text-sm text-gray-500">{page} / {pagination.totalPages}</span>
          <button
            disabled={!pagination.hasNext}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm disabled:opacity-40 hover:bg-gray-50 transition"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
