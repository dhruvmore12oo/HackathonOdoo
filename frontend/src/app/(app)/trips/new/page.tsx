'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import { ArrowLeft, Loader2, MapPin, Search, X } from 'lucide-react';
import Link from 'next/link';
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { useCitySearch } from '@/hooks/useSearch';
import { useCreateTrip } from '@/hooks/useTrips';
import { ROUTES } from '@/lib/constants';
import type { SearchCityResult } from '@/types';

const createTripSchema = z.object({
  title: z.string().min(3, 'At least 3 characters').max(200),
  description: z.string().max(2000).optional().or(z.literal('')),
  start_date: z.string().min(1, 'Required'),
  end_date: z.string().min(1, 'Required'),
  destination_summary: z.string().max(300).optional().or(z.literal('')),
  total_budget: z.coerce.number().min(0).optional(),
  tags: z.string().optional(),
  visibility: z.enum(['private', 'shared', 'public']).optional(),
  status: z.enum(['upcoming', 'ongoing', 'completed']).optional(),
}).refine((d) => new Date(d.end_date) >= new Date(d.start_date), {
  message: 'End date must be on or after start date',
  path: ['end_date'],
});
type FormData = z.infer<typeof createTripSchema>;

export default function CreateTripPage() {
  const { mutate: createTrip, isPending } = useCreateTrip();
  const [cityQuery, setCityQuery] = useState('');
  const [debouncedCityQuery, setDebouncedCityQuery] = useState('');
  const [selectedCities, setSelectedCities] = useState<SearchCityResult[]>([]);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(createTripSchema),
    defaultValues: { visibility: 'private', status: 'upcoming', total_budget: 0 },
  });

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedCityQuery(cityQuery.trim()), 300);
    return () => clearTimeout(timer);
  }, [cityQuery]);

  const {
    data: cityResults,
    isLoading: isCitySearchLoading,
  } = useCitySearch(debouncedCityQuery);

  const availableCityResults = useMemo(() => {
    const selectedIds = new Set(selectedCities.map((city) => city.id));
    return (cityResults || []).filter((city) => !selectedIds.has(city.id)).slice(0, 6);
  }, [cityResults, selectedCities]);

  const syncSelectedCities = (cities: SearchCityResult[]) => {
    setSelectedCities(cities);
    setValue('destination_summary', cities.map((city) => city.name).join(' -> '), {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const addCity = (city: SearchCityResult) => {
    syncSelectedCities([...selectedCities, city]);
    setCityQuery('');
    setDebouncedCityQuery('');
  };

  const removeCity = (cityId: string) => {
    syncSelectedCities(selectedCities.filter((city) => city.id !== cityId));
  };

  const onSubmit = (data: FormData) => {
    createTrip({
      ...data,
      cover_photo_url: selectedCities[0]?.heroImage,
      tags: data.tags ? data.tags.split(',').map((tag) => tag.trim()).filter(Boolean) : [],
    });
  };

  return (
    <div className="animate-in mx-auto max-w-2xl">
      <Link href={ROUTES.TRIPS} className="mb-4 inline-flex items-center gap-1 text-sm text-link">
        <ArrowLeft className="h-4 w-4" /> Back to trips
      </Link>

      <h1 className="section-heading mb-6">Create New Trip</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" id="create-trip-form">
        <Card>
          <CardHeader>
            <CardTitle>Destination Cities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="city-search" className="label-base">Search and add cities</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  id="city-search"
                  type="search"
                  value={cityQuery}
                  onChange={(event) => setCityQuery(event.target.value)}
                  className="input-base pl-10 pr-10"
                  placeholder="Search Goa, Paris, Tokyo..."
                  autoComplete="off"
                />
                {isCitySearchLoading && debouncedCityQuery.length >= 2 && (
                  <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-brand-500" />
                )}
              </div>
            </div>

            {selectedCities.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Selected route</p>
                <div className="flex flex-wrap gap-2">
                  {selectedCities.map((city) => (
                    <span
                      key={city.id}
                      className="inline-flex max-w-full items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-700"
                    >
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{city.name}</span>
                      <button
                        type="button"
                        onClick={() => removeCity(city.id)}
                        className="rounded-full p-0.5 text-brand-500 hover:bg-brand-100 hover:text-brand-700"
                        aria-label={`Remove ${city.name}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {debouncedCityQuery.length >= 2 && availableCityResults.length > 0 && (
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                {availableCityResults.map((city) => (
                  <button
                    key={city.id}
                    type="button"
                    onClick={() => addCity(city)}
                    className="flex w-full items-center gap-3 border-b border-gray-100 p-3 text-left transition-colors last:border-b-0 hover:bg-brand-50 focus:outline-none focus-visible:bg-brand-50"
                  >
                    <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                      <Image
                        src={city.thumbnailImage || city.heroImage}
                        alt={`${city.name}, ${city.country}`}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-gray-900">{city.name}</p>
                      <p className="truncate text-xs text-gray-500">
                        {city.region ? `${city.region}, ` : ''}{city.country}
                      </p>
                    </div>
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-500">
                      Add
                    </span>
                  </button>
                ))}
              </div>
            )}

            {selectedCities[0]?.heroImage && (
              <div className="relative overflow-hidden rounded-xl border border-gray-200">
                <div className="relative aspect-[16/7] bg-gray-100">
                  <Image
                    src={selectedCities[0].heroImage}
                    alt={`${selectedCities[0].name} trip cover preview`}
                    fill
                    sizes="(max-width: 768px) 100vw, 672px"
                    className="object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-white/70">Trip cover</p>
                    <p className="font-heading text-lg font-bold text-white">{selectedCities[0].name}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Trip Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Input label="Trip Title *" placeholder="My Goa Adventure" error={errors.title?.message} {...register('title')} />
            <div>
              <label className="label-base">Description</label>
              <textarea className="input-base min-h-[100px] resize-none" placeholder="Describe your trip..." maxLength={2000} {...register('description')} />
            </div>
            <Input label="Destination Summary" placeholder="Goa -> Mumbai -> Jaipur" error={errors.destination_summary?.message} {...register('destination_summary')} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Dates & Budget</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input label="Start Date *" type="date" error={errors.start_date?.message} {...register('start_date')} />
              <Input label="End Date *" type="date" error={errors.end_date?.message} {...register('end_date')} />
            </div>
            <Input label="Estimated Budget (INR)" type="number" min={0} placeholder="50000" {...register('total_budget')} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Settings</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-base">Visibility</label>
                <select className="input-base" {...register('visibility')}>
                  <option value="private">Private</option>
                  <option value="shared">Shared</option>
                  <option value="public">Public</option>
                </select>
              </div>
              <div>
                <label className="label-base">Status</label>
                <select className="input-base" {...register('status')}>
                  <option value="upcoming">Upcoming</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
            <Input label="Tags (comma-separated)" placeholder="beach, adventure, budget" {...register('tags')} />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Link href={ROUTES.TRIPS}><Button variant="ghost" type="button">Cancel</Button></Link>
          <Button type="submit" isLoading={isPending}>Create Trip</Button>
        </div>
      </form>
    </div>
  );
}
