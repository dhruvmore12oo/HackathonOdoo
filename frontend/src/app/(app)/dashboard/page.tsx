'use client';

import Link from 'next/link';
import { Map, Plus, TrendingUp, Calendar, CheckCircle, Clock } from 'lucide-react';
import { Button, Card, CardContent, Badge, Spinner } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { useTripStats, useTrips } from '@/hooks/useTrips';
import { ROUTES } from '@/lib/constants';
import { formatDate, formatCurrency, getAssetUrl } from '@/lib/utils';
import type { Trip } from '@/types';

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: React.ElementType; color: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-sm text-muted">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function TripMiniCard({ trip }: { trip: Trip }) {
  const statusColors: Record<string, string> = {
    upcoming: 'bg-blue-100 text-blue-700',
    ongoing: 'bg-green-100 text-green-700',
    completed: 'bg-gray-100 text-gray-600',
  };
  return (
    <Link href={ROUTES.TRIP(trip.id)} className="block">
      <Card className="hover:shadow-md transition-shadow group">
        <div className="relative h-32 bg-gradient-to-br from-brand-100 to-brand-50 rounded-t-xl overflow-hidden">
          {trip.cover_photo_url ? (
            <img src={getAssetUrl(trip.cover_photo_url)} alt={trip.title} className="w-full h-full object-cover" />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Map className="h-10 w-10 text-brand-300" />
            </div>
          )}
          <Badge className={`absolute top-2 right-2 text-xs ${statusColors[trip.status] || ''}`}>
            {trip.status}
          </Badge>
        </div>
        <CardContent className="pt-3">
          <h3 className="font-semibold text-gray-900 group-hover:text-brand-600 transition-colors truncate">
            {trip.title || trip.name}
          </h3>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(trip.start_date)}
            </span>
            {trip.total_budget > 0 && (
              <span>{formatCurrency(trip.total_budget)}</span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { data: stats, isLoading: statsLoading } = useTripStats();
  const { data: recentTrips, isLoading: tripsLoading } = useTrips({}, 1);

  return (
    <div className="animate-in space-y-8">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-gray-900">
            Welcome back, {user?.first_name}! 👋
          </h1>
          <p className="text-muted mt-1">Plan your next adventure or manage your trips</p>
        </div>
        <Link href={ROUTES.NEW_TRIP}>
          <Button leftIcon={<Plus className="h-4 w-4" />}>New Trip</Button>
        </Link>
      </div>

      {/* Stats */}
      {statsLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}><CardContent className="h-20 animate-pulse bg-gray-50 rounded-lg">&nbsp;</CardContent></Card>
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Trips" value={stats.total} icon={Map} color="bg-brand-500" />
          <StatCard label="Upcoming" value={stats.upcoming} icon={Clock} color="bg-blue-500" />
          <StatCard label="Active" value={stats.ongoing} icon={TrendingUp} color="bg-green-500" />
          <StatCard label="Completed" value={stats.completed} icon={CheckCircle} color="bg-gray-400" />
        </div>
      ) : null}

      {/* Recent Trips */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-lg font-bold text-gray-900">Recent Trips</h2>
          <Link href={ROUTES.TRIPS} className="text-sm text-link">View all →</Link>
        </div>

        {tripsLoading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : recentTrips && recentTrips.data.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentTrips.data.slice(0, 6).map((trip) => (
              <TripMiniCard key={trip.id} trip={trip} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Map className="h-12 w-12 text-brand-200 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-1">No trips yet</h3>
              <p className="text-sm text-muted mb-4">Start planning your first adventure!</p>
              <Link href={ROUTES.NEW_TRIP}>
                <Button size="sm" leftIcon={<Plus className="h-4 w-4" />}>Create Your First Trip</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
