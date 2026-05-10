'use client';

import { useParams } from 'next/navigation';
import { MapPin, Calendar, Eye, User, Sun, Sunset, Moon, Star } from 'lucide-react';
import { Spinner } from '@/components/ui';
import { usePublicTrip } from '@/hooks/useShare';
import { getAssetUrl, formatCurrency } from '@/lib/utils';
import type { PublicSection } from '@/types';

const SECTION_ICONS: Record<string, React.ElementType> = {
  morning: Sun, afternoon: Sun, evening: Sunset, night: Moon, custom: Star,
};
const SECTION_COLORS: Record<string, string> = {
  morning: 'text-amber-500 bg-amber-50',
  afternoon: 'text-orange-500 bg-orange-50',
  evening: 'text-purple-500 bg-purple-50',
  night: 'text-indigo-500 bg-indigo-50',
  custom: 'text-gray-500 bg-gray-50',
};

function SectionCard({ section }: { section: PublicSection }) {
  const SIcon = SECTION_ICONS[section.section_type] ?? Star;
  const sColor = SECTION_COLORS[section.section_type] ?? SECTION_COLORS.custom;
  return (
    <div className="rounded-xl border border-gray-200 p-4 bg-white shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className={`p-1.5 rounded-lg ${sColor}`}><SIcon className="h-4 w-4" /></div>
        <h3 className="font-semibold text-gray-900">{section.title}</h3>
        <span className="text-xs text-gray-400 ml-auto">{section.section_type}</span>
      </div>
      {section.activities.length > 0 ? (
        <div className="space-y-2 pl-2 border-l-2 border-gray-100">
          {section.activities.map((act) => (
            <div key={act.id} className="flex items-start gap-2 text-sm">
              <div className="h-1.5 w-1.5 rounded-full bg-brand-400 mt-1.5 shrink-0" />
              <div>
                <p className="font-medium text-gray-800">{act.name}</p>
                {act.location_name && (
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />{act.location_name}
                  </p>
                )}
              </div>
              <div className="ml-auto flex items-center gap-2 shrink-0">
                {act.start_time && <span className="text-xs text-gray-400">{act.start_time}</span>}
                {act.estimated_cost > 0 && <span className="text-xs text-green-600">{formatCurrency(act.estimated_cost)}</span>}
              </div>
            </div>
          ))}
        </div>
      ) : <p className="text-xs text-gray-400 pl-2">No activities</p>}
    </div>
  );
}

export default function PublicSharePage() {
  const params = useParams();
  const slug = params.slug as string;
  const { data: trip, isLoading, isError } = usePublicTrip(slug);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError || !trip) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">Trip Not Found</h1>
          <p className="text-gray-500">This share link may have expired or been revoked.</p>
          <a href="/" className="text-sm text-brand-500 hover:underline mt-4 inline-block">← Go to Traveloop</a>
        </div>
      </div>
    );
  }

  const dayCount = Math.ceil(
    (new Date(trip.end_date).getTime() - new Date(trip.start_date).getTime()) / 86400000
  ) + 1;

  const dayMap = new Map<number, PublicSection[]>();
  trip.sections.forEach((s) => {
    if (!dayMap.has(s.day_number)) dayMap.set(s.day_number, []);
    dayMap.get(s.day_number)!.push(s);
  });
  const days = Array.from(dayMap.keys()).sort((a, b) => a - b);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="relative h-72 sm:h-96 bg-gradient-to-br from-brand-400 to-brand-700 overflow-hidden">
        {trip.cover_photo_url && (
          <img src={getAssetUrl(trip.cover_photo_url)} alt={trip.title}
            className="absolute inset-0 w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10">
          <div className="max-w-4xl mx-auto">
            {trip.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {trip.tags.map((t) => (
                  <span key={t} className="px-2 py-0.5 rounded-full bg-white/20 text-white text-xs">{t}</span>
                ))}
              </div>
            )}
            <h1 className="text-3xl sm:text-5xl font-bold text-white font-heading mb-2">{trip.title}</h1>
            {trip.destination_summary && <p className="text-white/80 text-lg">{trip.destination_summary}</p>}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Meta strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: Calendar, color: 'text-brand-500', label: 'Duration', value: `${dayCount} days` },
            { icon: Calendar, color: 'text-blue-500', label: 'Dates', value: `${trip.start_date.slice(0, 10)} – ${trip.end_date.slice(0, 10)}` },
            { icon: Eye, color: 'text-purple-500', label: 'Views', value: String(trip.view_count) },
            { icon: User, color: 'text-orange-500', label: 'Planned by', value: `${trip.owner.first_name} ${trip.owner.last_name}` },
          ].map(({ icon: Icon, color, label, value }) => (
            <div key={label} className="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100">
              <Icon className={`h-5 w-5 ${color} mx-auto mb-1`} />
              <p className="text-xs text-gray-400">{label}</p>
              <p className="font-bold text-gray-900 text-sm">{value}</p>
            </div>
          ))}
        </div>

        {/* Description */}
        {trip.description && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="font-bold text-gray-900 mb-2">About this trip</h2>
            <p className="text-gray-600 whitespace-pre-wrap text-sm leading-relaxed">{trip.description}</p>
          </div>
        )}

        {/* Itinerary */}
        {days.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Itinerary</h2>
            <div className="space-y-6">
              {days.map((day) => (
                <div key={day}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-8 w-8 rounded-lg bg-brand-500 flex items-center justify-center text-white font-bold text-sm">
                      {day}
                    </div>
                    <h3 className="font-bold text-gray-900">Day {day}</h3>
                  </div>
                  <div className="space-y-3 pl-11">
                    {(dayMap.get(day) ?? []).map((s) => <SectionCard key={s.id} section={s} />)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center py-6 border-t border-gray-200">
          <p className="text-sm text-gray-400">
            Shared via <span className="font-semibold text-brand-600">Traveloop</span>
          </p>
          <a href="/" className="text-sm text-brand-500 hover:underline mt-1 inline-block">Plan your own trip →</a>
        </div>
      </div>
    </div>
  );
}
