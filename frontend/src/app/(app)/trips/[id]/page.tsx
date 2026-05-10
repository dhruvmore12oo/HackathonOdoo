'use client';

import { useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Edit, Trash2, Archive, Copy, Camera, Calendar, MapPin,
  IndianRupee, Globe, Lock, Share2, Layers, Sun, Sunset, Moon, Star,
  Clock, ChevronRight, CalendarDays, Wallet, TrendingDown, TrendingUp,
} from 'lucide-react';
import { Button, Badge, Card, CardHeader, CardTitle, CardContent, Spinner, Modal } from '@/components/ui';
import { AIAssistantPanel } from '@/components/ui/AIAssistant';
import { useTrip, useDeleteTrip, useArchiveTrip, useDuplicateTrip, useUploadCover } from '@/hooks/useTrips';
import { useItinerary } from '@/hooks/useItinerary';
import { useBudgetSummary } from '@/hooks/useExpenses';
import { ROUTES } from '@/lib/constants';
import { formatDate, formatCurrency, getAssetUrl } from '@/lib/utils';
import type { SectionType, ItinerarySection, SectionActivity } from '@/types';

const VISIBILITY_ICONS: Record<string, React.ReactNode> = {
  private: <Lock className="h-3.5 w-3.5" />,
  shared: <Share2 className="h-3.5 w-3.5" />,
  public: <Globe className="h-3.5 w-3.5" />,
};

const STATUS_COLORS: Record<string, string> = {
  upcoming: 'bg-blue-100 text-blue-700',
  ongoing: 'bg-green-100 text-green-700',
  completed: 'bg-gray-100 text-gray-600',
};

const SECTION_ICONS: Record<SectionType, React.ElementType> = {
  morning: Sun,
  afternoon: Sun,
  evening: Sunset,
  night: Moon,
  custom: Star,
};

const SECTION_COLORS: Record<SectionType, string> = {
  morning: 'text-amber-500 bg-amber-50',
  afternoon: 'text-orange-500 bg-orange-50',
  evening: 'text-purple-500 bg-purple-50',
  night: 'text-indigo-500 bg-indigo-50',
  custom: 'text-gray-500 bg-gray-50',
};

export default function TripDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: trip, isLoading } = useTrip(id);
  const { data: itinerary, isLoading: itineraryLoading } = useItinerary(id);
  const { data: budgetSummary, isLoading: budgetLoading } = useBudgetSummary(id);
  const { mutate: deleteTrip, isPending: deleting } = useDeleteTrip();
  const { mutate: archiveTrip } = useArchiveTrip();
  const { mutate: duplicateTrip } = useDuplicateTrip();
  const { mutate: uploadCover } = useUploadCover(id);
  const [showDelete, setShowDelete] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (isLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;
  if (!trip) return null;

  const daysBetween = Math.ceil((new Date(trip.end_date).getTime() - new Date(trip.start_date).getTime()) / (1000 * 60 * 60 * 24)) + 1;

  // Group itinerary sections by day
  const sectionsByDay = new Map<number, (ItinerarySection & { activities: SectionActivity[] })[]>();
  if (itinerary?.sections) {
    for (const section of itinerary.sections) {
      const day = section.day_number;
      if (!sectionsByDay.has(day)) sectionsByDay.set(day, []);
      sectionsByDay.get(day)!.push(section);
    }
  }
  const days = Array.from(sectionsByDay.keys()).sort((a, b) => a - b);

  return (
    <div className="animate-in space-y-6">
      <Link href={ROUTES.TRIPS} className="text-sm text-link inline-flex items-center gap-1">
        <ArrowLeft className="h-4 w-4" /> Back to trips
      </Link>

      {/* Hero Cover */}
      <div className="relative h-48 sm:h-64 rounded-2xl overflow-hidden bg-gradient-to-br from-brand-400 to-brand-600 group">
        {trip.cover_photo_url ? (
          <img src={getAssetUrl(trip.cover_photo_url)} alt={trip.title} className="w-full h-full object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full">
            <MapPin className="h-16 w-16 text-white/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <button
          onClick={() => fileRef.current?.click()}
          className="absolute top-4 right-4 p-2 rounded-lg bg-white/20 backdrop-blur text-white hover:bg-white/30 transition opacity-0 group-hover:opacity-100"
        >
          <Camera className="h-5 w-5" />
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadCover(f); }} />
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center gap-2 mb-1">
            <Badge className={`${STATUS_COLORS[trip.status]} text-xs`}>{trip.status}</Badge>
            <Badge variant="outline" className="text-xs text-white border-white/40 flex items-center gap-1">
              {VISIBILITY_ICONS[trip.visibility]} {trip.visibility}
            </Badge>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white">
            {trip.title || trip.name}
          </h1>
          {trip.destination_summary && (
            <p className="text-white/70 text-sm mt-1">{trip.destination_summary}</p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <Link href={`${ROUTES.TRIP(id)}/edit`}>
          <Button variant="outline" size="sm" leftIcon={<Edit className="h-3.5 w-3.5" />}>Edit</Button>
        </Link>
        <Link href={ROUTES.TRIP_SHARE(id)}>
          <Button variant="outline" size="sm" leftIcon={<Share2 className="h-3.5 w-3.5" />}>Share & Collaborate</Button>
        </Link>
        <Button variant="outline" size="sm" leftIcon={<Copy className="h-3.5 w-3.5" />} onClick={() => duplicateTrip(id)}>Duplicate</Button>
        <Button variant="outline" size="sm" leftIcon={<Archive className="h-3.5 w-3.5" />} onClick={() => archiveTrip(id)}>Archive</Button>
        <AIAssistantPanel destination={trip?.destination_summary || trip?.name} startDate={trip?.start_date} endDate={trip?.end_date} budget={trip?.total_budget} />
        <Button variant="danger" size="sm" leftIcon={<Trash2 className="h-3.5 w-3.5" />} onClick={() => setShowDelete(true)}>Delete</Button>
      </div>

      {/* Metadata Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="text-center py-4">
            <Calendar className="h-5 w-5 text-brand-500 mx-auto mb-1" />
            <p className="text-xs text-muted">Duration</p>
            <p className="font-semibold text-gray-900">{daysBetween} days</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center py-4">
            <Calendar className="h-5 w-5 text-blue-500 mx-auto mb-1" />
            <p className="text-xs text-muted">Dates</p>
            <p className="font-semibold text-gray-900 text-sm">{formatDate(trip.start_date)} – {formatDate(trip.end_date)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center py-4">
            <IndianRupee className="h-5 w-5 text-green-500 mx-auto mb-1" />
            <p className="text-xs text-muted">Budget</p>
            <p className="font-semibold text-gray-900">{trip.total_budget > 0 ? formatCurrency(trip.total_budget) : '—'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center py-4">
            <MapPin className="h-5 w-5 text-orange-500 mx-auto mb-1" />
            <p className="text-xs text-muted">Destinations</p>
            <p className="font-semibold text-gray-900">{trip.destination_summary || '—'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tags */}
      {trip.tags && trip.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {trip.tags.map((tag) => (
            <Badge key={tag} variant="outline">{tag}</Badge>
          ))}
        </div>
      )}

      {/* Description */}
      {trip.description && (
        <Card>
          <CardHeader><CardTitle>Description</CardTitle></CardHeader>
          <CardContent>
            <p className="text-gray-600 whitespace-pre-wrap">{trip.description}</p>
          </CardContent>
        </Card>
      )}

      {/* ── Itinerary Preview ── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-brand-500" /> Itinerary
          </CardTitle>
          {itinerary && itinerary.sections.length > 0 && (
            <span className="text-xs text-gray-400">
              {itinerary.summary.total_sections} sections • {itinerary.summary.total_activities} activities
              {itinerary.summary.total_estimated_cost > 0 && ` • ${formatCurrency(itinerary.summary.total_estimated_cost)}`}
            </span>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {itineraryLoading ? (
            <div className="flex justify-center py-6">
              <Spinner size="sm" />
            </div>
          ) : itinerary && itinerary.sections.length > 0 ? (
            <>
              {/* Day groups */}
              {days.map((day) => {
                const daySections = sectionsByDay.get(day) || [];
                return (
                  <div key={day} className="space-y-2">
                    {/* Day header */}
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-md bg-brand-100 flex items-center justify-center">
                        <CalendarDays className="h-3.5 w-3.5 text-brand-600" />
                      </div>
                      <h3 className="text-sm font-bold text-gray-900">Day {day}</h3>
                      <span className="text-xs text-gray-400">
                        {daySections.length} section{daySections.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {/* Sections under this day */}
                    <div className="pl-4 border-l-2 border-brand-100 space-y-2">
                      {daySections.map((section) => {
                        const sType = (section.section_type || 'custom') as SectionType;
                        const SIcon = SECTION_ICONS[sType] || Star;
                        const sColor = SECTION_COLORS[sType] || SECTION_COLORS.custom;

                        return (
                          <div key={section.id} className="rounded-xl border border-gray-100 bg-gray-50/50 p-3">
                            {/* Section header */}
                            <div className="flex items-center gap-2 mb-1.5">
                              <div className={`p-1 rounded-md ${sColor}`}>
                                <SIcon className="h-3.5 w-3.5" />
                              </div>
                              <span className="font-medium text-gray-900 text-sm">{section.title}</span>
                              <Badge variant="outline" className="text-[10px] ml-auto">{sType}</Badge>
                            </div>

                            {/* Activities */}
                            {section.activities && section.activities.length > 0 ? (
                              <div className="space-y-1 ml-6">
                                {section.activities.map((act) => (
                                  <div key={act.id} className="flex items-center gap-2 text-xs text-gray-600">
                                    <div className="h-1.5 w-1.5 rounded-full bg-brand-400 shrink-0" />
                                    <span className="truncate">{act.name}</span>
                                    {act.start_time && (
                                      <span className="flex items-center gap-0.5 text-gray-400 shrink-0">
                                        <Clock className="h-3 w-3" /> {act.start_time}
                                      </span>
                                    )}
                                    {act.estimated_cost > 0 && (
                                      <span className="text-green-600 shrink-0">{formatCurrency(act.estimated_cost)}</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-[11px] text-gray-400 ml-6">No activities</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </>
          ) : (
            <div className="py-4 text-center text-sm text-gray-400">
              No itinerary added yet — start building your trip plan!
            </div>
          )}

          {/* Builder Button */}
          <div className="pt-2 text-center border-t border-gray-100">
            <Link href={ROUTES.TRIP_ITINERARY(id)}>
              <Button size="sm" leftIcon={<ChevronRight className="h-4 w-4" />}>
                {itinerary && itinerary.sections.length > 0 ? 'Edit in Itinerary Builder' : 'Open Itinerary Builder'}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Budget & Expenses */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-brand-500" /> Budget & Expenses
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {budgetLoading ? (
            <div className="flex justify-center py-4"><Spinner size="sm" /></div>
          ) : budgetSummary ? (
            <>
              {/* Budget metrics */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-gray-50 p-3 text-center">
                  <Wallet className="h-4 w-4 text-brand-500 mx-auto mb-1" />
                  <p className="text-[11px] text-gray-400">Total Budget</p>
                  <p className="font-bold text-gray-900 text-sm">{formatCurrency(budgetSummary.total_budget)}</p>
                </div>
                <div className="rounded-xl bg-red-50 p-3 text-center">
                  <TrendingDown className="h-4 w-4 text-red-500 mx-auto mb-1" />
                  <p className="text-[11px] text-gray-400">Spent</p>
                  <p className="font-bold text-gray-900 text-sm">{formatCurrency(budgetSummary.total_spent)}</p>
                </div>
                <div className="rounded-xl p-3 text-center" style={{ backgroundColor: budgetSummary.budget_health === 'danger' ? '#fef2f2' : budgetSummary.budget_health === 'warning' ? '#fffbeb' : '#f0fdf4' }}>
                  <TrendingUp className={`h-4 w-4 mx-auto mb-1 ${
                    budgetSummary.budget_health === 'danger' ? 'text-red-500' : budgetSummary.budget_health === 'warning' ? 'text-amber-500' : 'text-green-500'
                  }`} />
                  <p className="text-[11px] text-gray-400">Remaining</p>
                  <p className={`font-bold text-sm ${
                    budgetSummary.budget_health === 'danger' ? 'text-red-600' : budgetSummary.budget_health === 'warning' ? 'text-amber-600' : 'text-green-600'
                  }`}>{formatCurrency(budgetSummary.remaining)}</p>
                </div>
              </div>

              {/* Progress bar */}
              {budgetSummary.total_budget > 0 && (
                <div>
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>{budgetSummary.spent_percentage}% used</span>
                    <span>{formatCurrency(budgetSummary.total_spent)} / {formatCurrency(budgetSummary.total_budget)}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        budgetSummary.budget_health === 'danger' ? 'bg-red-500' : budgetSummary.budget_health === 'warning' ? 'bg-amber-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(budgetSummary.spent_percentage, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-gray-400 text-center py-2">No budget data yet</p>
          )}

          {/* Link */}
          <div className="pt-2 text-center border-t border-gray-100">
            <Link href={ROUTES.TRIP_EXPENSES(id)}>
              <Button size="sm" leftIcon={<ChevronRight className="h-4 w-4" />}>
                Manage Budget & Expenses
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Delete Modal */}
      <Modal isOpen={showDelete} onClose={() => setShowDelete(false)} title="Delete Trip" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">This trip will be soft-deleted. You can recover it later.</p>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setShowDelete(false)}>Cancel</Button>
            <Button variant="danger" isLoading={deleting} onClick={() => deleteTrip(id)}>Delete</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
