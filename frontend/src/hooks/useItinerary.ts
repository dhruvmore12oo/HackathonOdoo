'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api, getErrorMessage } from '@/lib/api';
import { useItineraryStore } from '@/stores/itineraryStore';
import type { FullItinerary, ItinerarySection, SectionActivity, ApiResponse } from '@/types';

// ── Query Keys ──
export const itineraryKeys = {
  all: ['itinerary'] as const,
  detail: (tripId: string) => [...itineraryKeys.all, tripId] as const,
};

// ── Get Full Itinerary ──
export function useItinerary(tripId: string) {
  const { setItinerary } = useItineraryStore();

  return useQuery({
    queryKey: itineraryKeys.detail(tripId),
    queryFn: async () => {
      const res = await api.get<ApiResponse<FullItinerary>>(`/trips/${tripId}/itinerary`);
      setItinerary(res.data.data);
      return res.data.data;
    },
    enabled: !!tripId,
  });
}

// ── Create Section ──
export function useCreateSection(tripId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await api.post<ApiResponse<ItinerarySection>>(
        `/trips/${tripId}/itinerary/sections`,
        data
      );
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itineraryKeys.detail(tripId) });
      toast.success('Section added');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

// ── Update Section ──
export function useUpdateSection(tripId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Record<string, unknown>) => {
      const res = await api.patch<ApiResponse<ItinerarySection>>(
        `/itinerary/sections/${id}`,
        data
      );
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itineraryKeys.detail(tripId) });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

// ── Delete Section ──
export function useDeleteSection(tripId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sectionId: string) => {
      await api.delete(`/itinerary/sections/${sectionId}`);
      return sectionId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itineraryKeys.detail(tripId) });
      toast.success('Section removed');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

// ── Reorder Sections ──
export function useReorderSections(tripId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (items: { id: string; sort_order: number }[]) => {
      const res = await api.patch<ApiResponse<FullItinerary>>(
        '/itinerary/sections/reorder',
        { tripId, items }
      );
      return res.data.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(itineraryKeys.detail(tripId), data);
    },
    onError: (err) => {
      queryClient.invalidateQueries({ queryKey: itineraryKeys.detail(tripId) });
      toast.error(getErrorMessage(err));
    },
  });
}

// ── Create Activity ──
export function useCreateActivity(tripId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sectionId, ...data }: { sectionId: string } & Record<string, unknown>) => {
      const res = await api.post<ApiResponse<SectionActivity>>(
        `/itinerary/sections/${sectionId}/activities`,
        data
      );
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itineraryKeys.detail(tripId) });
      toast.success('Activity added');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

// ── Update Activity ──
export function useUpdateActivity(tripId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Record<string, unknown>) => {
      const res = await api.patch<ApiResponse<SectionActivity>>(
        `/itinerary/activities/${id}`,
        data
      );
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itineraryKeys.detail(tripId) });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

// ── Delete Activity ──
export function useDeleteActivity(tripId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (activityId: string) => {
      await api.delete(`/itinerary/activities/${activityId}`);
      return activityId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itineraryKeys.detail(tripId) });
      toast.success('Activity removed');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

// ── Reorder Activities ──
export function useReorderActivities(tripId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (items: { id: string; sort_order: number; section_id?: string }[]) => {
      const res = await api.patch<ApiResponse<FullItinerary>>(
        '/itinerary/activities/reorder',
        { tripId, items }
      );
      return res.data.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(itineraryKeys.detail(tripId), data);
    },
    onError: (err) => {
      queryClient.invalidateQueries({ queryKey: itineraryKeys.detail(tripId) });
      toast.error(getErrorMessage(err));
    },
  });
}
