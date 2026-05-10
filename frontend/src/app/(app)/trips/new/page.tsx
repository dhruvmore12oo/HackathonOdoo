'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { useCreateTrip } from '@/hooks/useTrips';
import { ROUTES } from '@/lib/constants';

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
  message: 'End date must be on or after start date', path: ['end_date'],
});
type FormData = z.infer<typeof createTripSchema>;

export default function CreateTripPage() {
  const { mutate: createTrip, isPending } = useCreateTrip();
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(createTripSchema),
    defaultValues: { visibility: 'private', status: 'upcoming', total_budget: 0 },
  });

  const onSubmit = (data: FormData) => {
    createTrip({
      ...data,
      tags: data.tags ? data.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
    });
  };

  return (
    <div className="animate-in max-w-2xl mx-auto">
      <Link href={ROUTES.TRIPS} className="text-sm text-link inline-flex items-center gap-1 mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to trips
      </Link>

      <h1 className="section-heading mb-6">Create New Trip</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" id="create-trip-form">
        {/* Basic Info */}
        <Card>
          <CardHeader><CardTitle>Trip Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Input label="Trip Title *" placeholder="My Goa Adventure" error={errors.title?.message} {...register('title')} />
            <div>
              <label className="label-base">Description</label>
              <textarea className="input-base min-h-[100px] resize-none" placeholder="Describe your trip..." maxLength={2000} {...register('description')} />
            </div>
            <Input label="Destination Summary" placeholder="Goa → Mumbai → Jaipur" error={errors.destination_summary?.message} {...register('destination_summary')} />
          </CardContent>
        </Card>

        {/* Dates & Budget */}
        <Card>
          <CardHeader><CardTitle>Dates & Budget</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input label="Start Date *" type="date" error={errors.start_date?.message} {...register('start_date')} />
              <Input label="End Date *" type="date" error={errors.end_date?.message} {...register('end_date')} />
            </div>
            <Input label="Estimated Budget (₹)" type="number" min={0} placeholder="50000" {...register('total_budget')} />
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardHeader><CardTitle>Settings</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-base">Visibility</label>
                <select className="input-base" {...register('visibility')}>
                  <option value="private">🔒 Private</option>
                  <option value="shared">🔗 Shared</option>
                  <option value="public">🌐 Public</option>
                </select>
              </div>
              <div>
                <label className="label-base">Status</label>
                <select className="input-base" {...register('status')}>
                  <option value="upcoming">📅 Upcoming</option>
                  <option value="ongoing">✈️ Ongoing</option>
                  <option value="completed">✅ Completed</option>
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
