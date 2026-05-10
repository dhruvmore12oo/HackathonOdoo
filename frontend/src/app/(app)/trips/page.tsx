'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Map, Plus, Search, Grid3X3, List, Archive, Trash2, Copy, Calendar, MoreVertical } from 'lucide-react';
import { Button, Input, Card, CardContent, Badge, Spinner, EmptyState, Modal } from '@/components/ui';
import { useTrips, useDeleteTrip, useArchiveTrip, useDuplicateTrip } from '@/hooks/useTrips';
import { useTripStore } from '@/stores/tripStore';
import { useDebounce } from '@/hooks';
import { ROUTES } from '@/lib/constants';
import { formatDate, formatCurrency, getAssetUrl } from '@/lib/utils';
import type { Trip } from '@/types';

function ContextMenu({ onDuplicate, onArchive, onDelete }: {
  onDuplicate: () => void; onArchive: () => void; onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button className="p-1 text-gray-400 hover:text-gray-600" onClick={() => setOpen(!open)}>
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-20 animate-fade-in">
          <button onClick={() => { onDuplicate(); setOpen(false); }} className="w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 hover:bg-gray-50">
            <Copy className="h-3.5 w-3.5" /> Duplicate
          </button>
          <button onClick={() => { onArchive(); setOpen(false); }} className="w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 hover:bg-gray-50">
            <Archive className="h-3.5 w-3.5" /> Archive
          </button>
          <button onClick={() => { onDelete(); setOpen(false); }} className="w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 hover:bg-gray-50 text-danger-400">
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

function TripCard({ trip, onDelete, onArchive, onDuplicate }: {
  trip: Trip;
  onDelete: (id: string) => void;
  onArchive: (id: string) => void;
  onDuplicate: (id: string) => void;
}) {
  const statusColors: Record<string, string> = {
    upcoming: 'bg-blue-100 text-blue-700',
    ongoing: 'bg-green-100 text-green-700',
    completed: 'bg-gray-100 text-gray-600',
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-200">
      <Link href={ROUTES.TRIP(trip.id)}>
        <div className="relative h-40 bg-gradient-to-br from-brand-100 to-brand-50 rounded-t-xl overflow-hidden">
          {trip.cover_photo_url ? (
            <img src={getAssetUrl(trip.cover_photo_url)} alt={trip.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Map className="h-12 w-12 text-brand-300" />
            </div>
          )}
          <Badge className={`absolute top-3 left-3 text-xs ${statusColors[trip.status] || ''}`}>
            {trip.status}
          </Badge>
          {trip.visibility !== 'private' && (
            <Badge variant="accent" className="absolute top-3 right-3 text-xs">
              {trip.visibility}
            </Badge>
          )}
        </div>
      </Link>
      <CardContent className="pt-3">
        <div className="flex items-start justify-between">
          <Link href={ROUTES.TRIP(trip.id)} className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 group-hover:text-brand-600 transition-colors truncate">
              {trip.title || trip.name}
            </h3>
            {trip.destination_summary && (
              <p className="text-xs text-muted truncate mt-0.5">{trip.destination_summary}</p>
            )}
          </Link>
          <ContextMenu
            onDuplicate={() => onDuplicate(trip.id)}
            onArchive={() => onArchive(trip.id)}
            onDelete={() => onDelete(trip.id)}
          />
        </div>
        <div className="flex items-center gap-3 mt-2 text-xs text-muted">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDate(trip.start_date)} – {formatDate(trip.end_date)}
          </span>
        </div>
        <div className="flex items-center justify-between mt-2">
          {trip.total_budget > 0 && (
            <span className="text-sm font-medium text-gray-700">{formatCurrency(trip.total_budget)}</span>
          )}
          {trip.tags && trip.tags.length > 0 && (
            <div className="flex gap-1">
              {trip.tags.slice(0, 2).map((tag) => (
                <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">{tag}</span>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function TripsPage() {
  const { filters, setFilters, viewMode, setViewMode } = useTripStore();
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const debouncedQ = useDebounce(filters.q, 300);

  const queryFilters: Record<string, string> = {};
  if (debouncedQ) queryFilters.q = debouncedQ;
  if (filters.status) queryFilters.status = filters.status;
  if (filters.sortBy) queryFilters.sortBy = filters.sortBy;
  if (filters.sortOrder) queryFilters.sortOrder = filters.sortOrder;

  const { data, isLoading } = useTrips(queryFilters, page);
  const { mutate: deleteTrip, isPending: deleting } = useDeleteTrip();
  const { mutate: archiveTrip } = useArchiveTrip();
  const { mutate: duplicateTrip } = useDuplicateTrip();

  return (
    <div className="animate-in space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="section-heading">My Trips</h1>
        <Link href={ROUTES.NEW_TRIP}>
          <Button leftIcon={<Plus className="h-4 w-4" />}>New Trip</Button>
        </Link>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search trips..."
            leftIcon={<Search className="h-4 w-4" />}
            value={filters.q}
            onChange={(e) => { setFilters({ q: e.target.value }); setPage(1); }}
          />
        </div>
        <select
          className="input-base w-auto"
          value={filters.status}
          onChange={(e) => { setFilters({ status: e.target.value as typeof filters.status }); setPage(1); }}
        >
          <option value="">All Status</option>
          <option value="upcoming">Upcoming</option>
          <option value="ongoing">Ongoing</option>
          <option value="completed">Completed</option>
        </select>
        <select
          className="input-base w-auto"
          value={filters.sortBy}
          onChange={(e) => setFilters({ sortBy: e.target.value })}
        >
          <option value="created_at">Newest</option>
          <option value="start_date">Start Date</option>
          <option value="title">Name</option>
          <option value="total_budget">Budget</option>
        </select>
        <div className="flex border rounded-lg overflow-hidden">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 ${viewMode === 'grid' ? 'bg-brand-50 text-brand-600' : 'text-gray-400'}`}
          >
            <Grid3X3 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 ${viewMode === 'list' ? 'bg-brand-50 text-brand-600' : 'text-gray-400'}`}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : data && data.data.length > 0 ? (
        <>
          <div className={viewMode === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
            : 'flex flex-col gap-3'}
          >
            {data.data.map((trip) => (
              <TripCard
                key={trip.id}
                trip={trip}
                onDelete={(id) => setDeleteId(id)}
                onArchive={(id) => archiveTrip(id)}
                onDuplicate={(id) => duplicateTrip(id)}
              />
            ))}
          </div>
          {/* Pagination */}
          {data.pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={!data.pagination.hasPrev}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <span className="flex items-center text-sm text-muted px-3">
                Page {data.pagination.page} of {data.pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={!data.pagination.hasNext}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      ) : (
        <EmptyState
          icon={<Map className="h-10 w-10 text-brand-300" />}
          title="No trips found"
          description={filters.q || filters.status ? 'Try changing your search or filters' : 'Create your first trip to get started!'}
          action={!filters.q && !filters.status ? (
            <Link href={ROUTES.NEW_TRIP}>
              <Button size="sm" leftIcon={<Plus className="h-4 w-4" />}>Create Trip</Button>
            </Link>
          ) : undefined}
        />
      )}

      {/* Delete Confirmation */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Trip" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Are you sure you want to delete this trip? It can be recovered later.</p>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button
              variant="danger"
              isLoading={deleting}
              onClick={() => { if (deleteId) { deleteTrip(deleteId); setDeleteId(null); } }}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
