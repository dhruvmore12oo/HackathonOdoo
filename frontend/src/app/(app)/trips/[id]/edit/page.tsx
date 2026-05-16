'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button, Input, Card, CardHeader, CardTitle, CardContent, Spinner } from '@/components/ui';
import { useTrip, useUpdateTrip } from '@/hooks/useTrips';
import { ROUTES } from '@/lib/constants';
import { canEditTrip, getTripRole } from '@/lib/permissions';

const editTripSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().max(2000).optional().or(z.literal('')),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  destination_summary: z.string().max(300).optional().or(z.literal('')),
  total_budget: z.coerce.number().min(0).optional(),
  tags: z.string().optional(),
  visibility: z.enum(['private', 'shared', 'public']).optional(),
  status: z.enum(['upcoming', 'ongoing', 'completed']).optional(),
});
type FormData = z.infer<typeof editTripSchema>;

export default function EditTripPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: trip, isLoading } = useTrip(id);
  const { mutate: updateTrip, isPending } = useUpdateTrip(id);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(editTripSchema),
  });

  useEffect(() => {
    if (trip) {
      reset({
        title: trip.title || trip.name,
        description: trip.description || '',
        // Normalize ISO timestamps to YYYY-MM-DD for <input type="date"> and backend validation
        start_date: trip.start_date?.split('T')[0] || '',
        end_date: trip.end_date?.split('T')[0] || '',
        destination_summary: trip.destination_summary || '',
        total_budget: trip.total_budget,
        tags: trip.tags?.join(', ') || '',
        visibility: trip.visibility || 'private',
        status: trip.status,
      });
    }
  }, [trip, reset]);

  if (isLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;
  if (!trip) return null;

  const canEdit = canEditTrip(getTripRole(trip));

  if (!canEdit) {
    return (
      <div className="animate-in max-w-2xl mx-auto">
        <Link href={ROUTES.TRIP(id)} className="text-sm text-link inline-flex items-center gap-1 mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to trip
        </Link>

        <Card>
          <CardHeader><CardTitle>Read-only access</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-500">
              You can view this trip, but only the owner or an editor can change trip details.
            </p>
            <Link href={ROUTES.TRIP(id)}>
              <Button type="button">Back to Trip</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const onSubmit = (data: FormData) => {
    // Build a clean payload — only send fields that have meaningful values
    const payload: Record<string, unknown> = {};

    if (data.title) payload.title = data.title;
    if (data.description !== undefined) payload.description = data.description || null;
    if (data.start_date) payload.start_date = data.start_date;
    if (data.end_date) payload.end_date = data.end_date;
    if (data.destination_summary !== undefined) payload.destination_summary = data.destination_summary || null;
    if (data.total_budget !== undefined) payload.total_budget = data.total_budget;
    if (data.visibility) payload.visibility = data.visibility;
    if (data.status) payload.status = data.status;
    payload.tags = data.tags ? data.tags.split(',').map((t) => t.trim()).filter(Boolean) : [];

    updateTrip(payload);
  };

  return (
    <div className="animate-in max-w-2xl mx-auto">
      <Link href={ROUTES.TRIP(id)} className="text-sm text-link inline-flex items-center gap-1 mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to trip
      </Link>

      <h1 className="section-heading mb-6">Edit Trip</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" id="edit-trip-form">
        <Card>
          <CardHeader><CardTitle>Trip Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Input label="Trip Title" error={errors.title?.message} {...register('title')} />
            <div>
              <label className="label-base">Description</label>
              <textarea className="input-base min-h-[100px] resize-none" maxLength={2000} {...register('description')} />
            </div>
            <Input label="Destination Summary" {...register('destination_summary')} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Dates & Budget</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input label="Start Date" type="date" {...register('start_date')} />
              <Input label="End Date" type="date" {...register('end_date')} />
            </div>
            <Input label="Estimated Budget (₹)" type="number" min={0} {...register('total_budget')} />
          </CardContent>
        </Card>

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
            <Input label="Tags" {...register('tags')} />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Link href={ROUTES.TRIP(id)}><Button variant="ghost" type="button">Cancel</Button></Link>
          <Button type="submit" isLoading={isPending}>Save Changes</Button>
        </div>
      </form>
    </div>
  );
}
