'use client';

import { useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Plus, ChevronDown, ChevronRight, Clock, MapPin,
  IndianRupee, Trash2, GripVertical, Sun, Sunset, Moon, Star,
  Layers, CalendarDays, CheckCircle2, Circle, Bookmark, X, Edit3,
} from 'lucide-react';
import { Button, Card, CardContent, Spinner, EmptyState, Input, Badge, Modal } from '@/components/ui';
import {
  useItinerary, useCreateSection, useUpdateSection, useDeleteSection,
  useCreateActivity, useUpdateActivity, useDeleteActivity,
} from '@/hooks/useItinerary';
import { useTrip } from '@/hooks/useTrips';
import { useItineraryStore } from '@/stores/itineraryStore';
import { ROUTES } from '@/lib/constants';
import { canEditTrip, getTripRole } from '@/lib/permissions';
import { formatCurrency } from '@/lib/utils';
import type { ItinerarySection, SectionActivity, SectionType, ActivityStatus } from '@/types';

// ── Constants ──
const SECTION_TYPE_CONFIG: Record<SectionType, { icon: React.ElementType; label: string; color: string }> = {
  morning: { icon: Sun, label: 'Morning', color: 'text-amber-500 bg-amber-50' },
  afternoon: { icon: Sun, label: 'Afternoon', color: 'text-orange-500 bg-orange-50' },
  evening: { icon: Sunset, label: 'Evening', color: 'text-purple-500 bg-purple-50' },
  night: { icon: Moon, label: 'Night', color: 'text-indigo-500 bg-indigo-50' },
  custom: { icon: Star, label: 'Custom', color: 'text-gray-500 bg-gray-50' },
};

const STATUS_CONFIG: Record<ActivityStatus, { icon: React.ElementType; color: string; label: string }> = {
  planned: { icon: Circle, color: 'text-gray-400', label: 'Planned' },
  booked: { icon: Bookmark, color: 'text-blue-500', label: 'Booked' },
  completed: { icon: CheckCircle2, color: 'text-green-500', label: 'Completed' },
  skipped: { icon: X, color: 'text-red-400', label: 'Skipped' },
};

// ══════════════════════════════════════
// ACTIVITY CARD
// ══════════════════════════════════════
function ActivityCard({
  activity, canEdit, onEdit, onDelete,
}: {
  activity: SectionActivity;
  canEdit: boolean;
  onEdit: (a: SectionActivity) => void;
  onDelete: (id: string) => void;
}) {
  const statusCfg = STATUS_CONFIG[activity.status] || STATUS_CONFIG.planned;
  const StatusIcon = statusCfg.icon;

  return (
    <div className="group flex items-start gap-3 p-3 rounded-xl bg-white border border-gray-100 hover:border-brand-200 hover:shadow-sm transition-all">
      {canEdit && (
        <div className="mt-0.5 cursor-grab text-gray-300 hover:text-gray-500">
          <GripVertical className="h-4 w-4" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <StatusIcon className={`h-4 w-4 ${statusCfg.color} shrink-0`} />
          <h4 className="font-medium text-gray-900 text-sm truncate">{activity.name}</h4>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
          {activity.start_time && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {activity.start_time}{activity.end_time ? ` – ${activity.end_time}` : ''}
            </span>
          )}
          {activity.estimated_duration_minutes && (
            <span>{activity.estimated_duration_minutes} min</span>
          )}
          {activity.location_name && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span className="truncate max-w-[150px]">{activity.location_name}</span>
            </span>
          )}
          {activity.estimated_cost > 0 && (
            <span className="flex items-center gap-1 text-green-600">
              <IndianRupee className="h-3 w-3" />
              {formatCurrency(activity.estimated_cost)}
            </span>
          )}
        </div>

        {activity.notes && (
          <p className="text-xs text-gray-400 mt-1 line-clamp-1">{activity.notes}</p>
        )}
      </div>

      {canEdit && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
          <button onClick={() => onEdit(activity)} className="p-1 rounded hover:bg-gray-100" title="Edit">
            <Edit3 className="h-3.5 w-3.5 text-gray-400" />
          </button>
          <button onClick={() => onDelete(activity.id)} className="p-1 rounded hover:bg-red-50" title="Delete">
            <Trash2 className="h-3.5 w-3.5 text-red-400" />
          </button>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════
// SECTION CARD
// ══════════════════════════════════════
function SectionCard({
  section, isExpanded, onToggle, tripId, canEdit,
}: {
  section: ItinerarySection & { activities: SectionActivity[] };
  isExpanded: boolean;
  onToggle: () => void;
  tripId: string;
  canEdit: boolean;
}) {
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [activityName, setActivityName] = useState('');
  const [editingActivity, setEditingActivity] = useState<SectionActivity | null>(null);
  const { mutate: createActivity, isPending: creating } = useCreateActivity(tripId);
  const { mutate: updateActivity } = useUpdateActivity(tripId);
  const { mutate: deleteActivity } = useDeleteActivity(tripId);
  const { mutate: deleteSection } = useDeleteSection(tripId);

  const typeCfg = SECTION_TYPE_CONFIG[section.section_type as SectionType] || SECTION_TYPE_CONFIG.custom;
  const TypeIcon = typeCfg.icon;
  const sectionCost = section.activities?.reduce((s, a) => s + Number(a.estimated_cost || 0), 0) || 0;

  const handleAddActivity = useCallback(() => {
    if (!canEdit || !activityName.trim()) return;
    createActivity(
      { sectionId: section.id, name: activityName.trim() },
      {
        onSuccess: () => {
          setActivityName('');
          setShowAddActivity(false);
        },
      }
    );
  }, [activityName, canEdit, createActivity, section.id]);

  const handleStatusToggle = useCallback((activity: SectionActivity) => {
    if (!canEdit) return;
    const order: ActivityStatus[] = ['planned', 'booked', 'completed', 'skipped'];
    const nextIdx = (order.indexOf(activity.status) + 1) % order.length;
    updateActivity({ id: activity.id, status: order[nextIdx] });
  }, [canEdit, updateActivity]);

  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      {/* Section Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none hover:bg-gray-50/50 transition"
        onClick={onToggle}
      >
        {canEdit && (
          <div className="cursor-grab text-gray-300 hover:text-gray-500" onClick={(e) => e.stopPropagation()}>
            <GripVertical className="h-4 w-4" />
          </div>
        )}

        <div className={`p-1.5 rounded-lg ${typeCfg.color}`}>
          <TypeIcon className="h-4 w-4" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-sm">{section.title}</h3>
          <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
            <span>{section.activities?.length || 0} activities</span>
            {sectionCost > 0 && <span>• {formatCurrency(sectionCost)}</span>}
          </div>
        </div>

        <Badge variant="outline" className="text-xs shrink-0">
          {typeCfg.label}
        </Badge>

        {canEdit && (
          <button
            onClick={(e) => { e.stopPropagation(); deleteSection(section.id); }}
            className="p-1 rounded hover:bg-red-50 opacity-0 group-hover:opacity-100 transition"
            title="Delete section"
          >
            <Trash2 className="h-3.5 w-3.5 text-red-400" />
          </button>
        )}

        {isExpanded ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-2 border-t border-gray-50">
          {section.activities && section.activities.length > 0 ? (
            <div className="space-y-2 pt-3">
              {section.activities.map((activity) => (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  canEdit={canEdit}
                  onEdit={(a) => {
                    handleStatusToggle(a);
                    setEditingActivity(a);
                  }}
                  onDelete={(id) => deleteActivity(id)}
                />
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-gray-400">
              {canEdit ? 'No activities yet - add your first one below' : 'No activities yet'}
            </div>
          )}

          {/* Quick Add Activity */}
          {canEdit && (
            showAddActivity ? (
            <div className="flex items-center gap-2 pt-2">
              <Input
                placeholder="Activity name..."
                value={activityName}
                onChange={(e) => setActivityName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddActivity()}
                className="flex-1 text-sm"
                autoFocus
              />
              <Button size="sm" onClick={handleAddActivity} isLoading={creating}>Add</Button>
              <Button size="sm" variant="ghost" onClick={() => { setShowAddActivity(false); setActivityName(''); }}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <button
              onClick={() => setShowAddActivity(true)}
              className="w-full flex items-center justify-center gap-1.5 py-2 text-xs text-brand-600 hover:bg-brand-50 rounded-lg transition mt-2"
            >
              <Plus className="h-3.5 w-3.5" /> Add Activity
            </button>
            )
          )}
        </div>
      )}

      {/* Activity Edit Modal */}
      {canEdit && editingActivity && (
        <ActivityEditModal
          activity={editingActivity}
          tripId={tripId}
          onClose={() => setEditingActivity(null)}
        />
      )}
    </div>
  );
}

// ══════════════════════════════════════
// ACTIVITY EDIT MODAL
// ══════════════════════════════════════
function ActivityEditModal({
  activity, tripId, onClose,
}: {
  activity: SectionActivity;
  tripId: string;
  onClose: () => void;
}) {
  const { mutate: updateActivity, isPending } = useUpdateActivity(tripId);
  const [form, setForm] = useState({
    name: activity.name,
    location_name: activity.location_name || '',
    start_time: activity.start_time || '',
    end_time: activity.end_time || '',
    estimated_duration_minutes: activity.estimated_duration_minutes ?? '',
    estimated_cost: activity.estimated_cost || 0,
    status: activity.status,
    notes: activity.notes || '',
    tips: activity.tips || '',
  });

  const handleSave = () => {
    updateActivity(
      {
        id: activity.id,
        name: form.name,
        location_name: form.location_name || null,
        start_time: form.start_time || null,
        end_time: form.end_time || null,
        estimated_duration_minutes: form.estimated_duration_minutes ? Number(form.estimated_duration_minutes) : null,
        estimated_cost: Number(form.estimated_cost),
        status: form.status,
        notes: form.notes || null,
        tips: form.tips || null,
      },
      { onSuccess: onClose }
    );
  };

  return (
    <Modal isOpen onClose={onClose} title="Edit Activity" size="lg">
      <div className="space-y-4">
        <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Input label="Location" value={form.location_name} onChange={(e) => setForm({ ...form, location_name: e.target.value })} />

        <div className="grid grid-cols-2 gap-3">
          <Input label="Start Time" type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
          <Input label="End Time" type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input label="Duration (min)" type="number" value={String(form.estimated_duration_minutes)} onChange={(e) => setForm({ ...form, estimated_duration_minutes: e.target.value })} />
          <Input label="Estimated Cost (₹)" type="number" value={String(form.estimated_cost)} onChange={(e) => setForm({ ...form, estimated_cost: Number(e.target.value) })} />
        </div>

        <div>
          <label className="label-base">Status</label>
          <select
            className="input-base"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as ActivityStatus })}
          >
            <option value="planned">📋 Planned</option>
            <option value="booked">🎫 Booked</option>
            <option value="completed">✅ Completed</option>
            <option value="skipped">⏭️ Skipped</option>
          </select>
        </div>

        <div>
          <label className="label-base">Notes</label>
          <textarea className="input-base min-h-[80px] resize-none" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>

        <div>
          <label className="label-base">Tips</label>
          <textarea className="input-base min-h-[60px] resize-none" value={form.tips} onChange={(e) => setForm({ ...form, tips: e.target.value })} />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} isLoading={isPending}>Save Changes</Button>
        </div>
      </div>
    </Modal>
  );
}

// ══════════════════════════════════════
// ADD SECTION MODAL
// ══════════════════════════════════════
function AddSectionModal({
  tripId, dayNumber, onClose,
}: {
  tripId: string;
  dayNumber: number;
  onClose: () => void;
}) {
  const { mutate: createSection, isPending } = useCreateSection(tripId);
  const [title, setTitle] = useState('');
  const [sectionType, setSectionType] = useState<SectionType>('custom');

  const handleCreate = () => {
    if (!title.trim()) return;
    createSection(
      { title: title.trim(), day_number: dayNumber, section_type: sectionType },
      { onSuccess: onClose }
    );
  };

  return (
    <Modal isOpen onClose={onClose} title={`Add Section — Day ${dayNumber}`} size="sm">
      <div className="space-y-4">
        <Input
          label="Section Title"
          placeholder="e.g. Temple Visit, Beach Afternoon..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          autoFocus
        />

        <div>
          <label className="label-base">Time of Day</label>
          <div className="grid grid-cols-5 gap-2 mt-1">
            {(Object.entries(SECTION_TYPE_CONFIG) as [SectionType, typeof SECTION_TYPE_CONFIG['morning']][]).map(
              ([type, cfg]) => {
                const Icon = cfg.icon;
                return (
                  <button
                    key={type}
                    onClick={() => setSectionType(type)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-xs transition
                      ${sectionType === type
                        ? 'border-brand-400 bg-brand-50 text-brand-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-500'
                      }`}
                  >
                    <Icon className="h-4 w-4" />
                    {cfg.label}
                  </button>
                );
              }
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleCreate} isLoading={isPending} disabled={!title.trim()}>
            Add Section
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ══════════════════════════════════════
// MAIN ITINERARY BUILDER PAGE
// ══════════════════════════════════════
export default function ItineraryBuilderPage() {
  const params = useParams();
  const tripId = params.id as string;
  const { data: itinerary, isLoading } = useItinerary(tripId);
  const { data: trip, isLoading: tripLoading } = useTrip(tripId);
  const { expandedSections, toggleSection, activeDayFilter, setDayFilter } = useItineraryStore();

  const [addSectionDay, setAddSectionDay] = useState<number | null>(null);

  if (isLoading || tripLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!itinerary) return null;

  const canEdit = canEditTrip(getTripRole(trip));
  const { sections, summary } = itinerary;
  const days = Array.from({ length: Math.max(summary.days, 1) }, (_, i) => i + 1);

  // Group sections by day
  const sectionsByDay = new Map<number, typeof sections>();
  for (const section of sections) {
    const day = section.day_number;
    if (!sectionsByDay.has(day)) sectionsByDay.set(day, []);
    sectionsByDay.get(day)!.push(section);
  }

  const visibleDays = activeDayFilter ? [activeDayFilter] : days;

  return (
    <div className="animate-in space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href={ROUTES.TRIP(tripId)} className="text-sm text-link inline-flex items-center gap-1 mb-2">
            <ArrowLeft className="h-4 w-4" /> Back to trip
          </Link>
          <h1 className="section-heading flex items-center gap-2">
            <Layers className="h-5 w-5 text-brand-500" />
            Itinerary Builder
          </h1>
        </div>

        <div className="text-right text-xs text-gray-400 space-y-0.5">
          <div>{summary.total_sections} sections • {summary.total_activities} activities</div>
          {summary.total_estimated_cost > 0 && (
            <div className="text-green-600 font-medium">{formatCurrency(summary.total_estimated_cost)} estimated</div>
          )}
        </div>
      </div>

      {/* Day Filter Tabs */}
      {days.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => setDayFilter(null)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition whitespace-nowrap
              ${!activeDayFilter ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            All Days
          </button>
          {days.map((day) => (
            <button
              key={day}
              onClick={() => setDayFilter(activeDayFilter === day ? null : day)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition whitespace-nowrap
                ${activeDayFilter === day ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              <CalendarDays className="h-3 w-3 inline mr-1" />
              Day {day}
            </button>
          ))}
        </div>
      )}

      {/* Day Groups */}
      {sections.length === 0 ? (
        <EmptyState
          icon={<Layers className="h-8 w-8 text-brand-400" />}
          title="No itinerary yet"
          description="Start building your trip itinerary by adding your first day section."
          action={
            canEdit ? (
              <Button onClick={() => setAddSectionDay(1)} leftIcon={<Plus className="h-4 w-4" />}>
                Add First Section
              </Button>
            ) : null
          }
        />
      ) : (
        visibleDays.map((day) => {
          const daySections = sectionsByDay.get(day) || [];
          const dayCost = daySections.reduce(
            (sum, s) => sum + (s.activities?.reduce((a, act) => a + Number(act.estimated_cost || 0), 0) || 0),
            0
          );

          return (
            <div key={day} className="space-y-3">
              {/* Day Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-brand-100 flex items-center justify-center">
                    <CalendarDays className="h-4 w-4 text-brand-600" />
                  </div>
                  <div>
                    <h2 className="font-heading font-bold text-gray-900 text-sm">Day {day}</h2>
                    <p className="text-xs text-gray-400">
                      {daySections.length} section{daySections.length !== 1 ? 's' : ''}
                      {dayCost > 0 ? ` • ${formatCurrency(dayCost)}` : ''}
                    </p>
                  </div>
                </div>
                {canEdit && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setAddSectionDay(day)}
                    leftIcon={<Plus className="h-3.5 w-3.5" />}
                  >
                    Section
                  </Button>
                )}
              </div>

              {/* Sections */}
              {daySections.length > 0 ? (
                <div className="space-y-3 pl-4 border-l-2 border-brand-100">
                  {daySections.map((section) => (
                    <SectionCard
                      key={section.id}
                      section={section}
                      isExpanded={expandedSections.has(section.id)}
                      onToggle={() => toggleSection(section.id)}
                      tripId={tripId}
                      canEdit={canEdit}
                    />
                  ))}
                </div>
              ) : (
                <div className="pl-4 border-l-2 border-gray-100">
                  <Card>
                    <CardContent className="py-8 text-center text-xs text-gray-400">
                      No sections for this day
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          );
        })
      )}

      {/* Floating Add Day Button */}
      {canEdit && sections.length > 0 && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={() => setAddSectionDay(summary.days + 1)}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Add Day {summary.days + 1}
          </Button>
        </div>
      )}

      {/* Add Section Modal */}
      {canEdit && addSectionDay !== null && (
        <AddSectionModal
          tripId={tripId}
          dayNumber={addSectionDay}
          onClose={() => setAddSectionDay(null)}
        />
      )}
    </div>
  );
}
