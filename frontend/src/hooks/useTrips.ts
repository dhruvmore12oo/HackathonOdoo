'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api, getErrorMessage } from '@/lib/api';
import { useTripStore } from '@/stores/tripStore';
import type { Trip, ApiResponse, PaginatedResponse } from '@/types';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/lib/constants';

// ── Query Keys ──
export const tripKeys = {
  all: ['trips'] as const,
  lists: () => [...tripKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...tripKeys.lists(), filters] as const,
  details: () => [...tripKeys.all, 'detail'] as const,
  detail: (id: string) => [...tripKeys.details(), id] as const,
  stats: () => [...tripKeys.all, 'stats'] as const,
};

// ── List Trips ──
export function useTrips(filters: Record<string, unknown> = {}, page = 1) {
  return useQuery({
    queryKey: tripKeys.list({ ...filters, page }),
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      Object.entries(filters).forEach(([k, v]) => {
        if (v) params.set(k, String(v));
      });
      const res = await api.get<PaginatedResponse<Trip>>(`/trips?${params}`);
      return res.data;
    },
  });
}

// ── Single Trip ──
export function useTrip(id: string) {
  const { setActiveTrip } = useTripStore();
  return useQuery({
    queryKey: tripKeys.detail(id),
    queryFn: async () => {
      const res = await api.get<ApiResponse<Trip>>(`/trips/${id}`);
      setActiveTrip(res.data.data);
      return res.data.data;
    },
    enabled: !!id,
  });
}

// ── Trip Stats ──
export function useTripStats() {
  return useQuery({
    queryKey: tripKeys.stats(),
    queryFn: async () => {
      const res = await api.get<ApiResponse<{ total: number; upcoming: number; ongoing: number; completed: number }>>('/trips/stats');
      return res.data.data;
    },
  });
}

// ── Create Trip ──
export function useCreateTrip() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await api.post<ApiResponse<Trip>>('/trips', data);
      return res.data.data;
    },
    onSuccess: (trip) => {
      queryClient.invalidateQueries({ queryKey: tripKeys.lists() });
      queryClient.invalidateQueries({ queryKey: tripKeys.stats() });
      toast.success('Trip created!');
      router.push(ROUTES.TRIP(trip.id));
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

// ── Update Trip ──
export function useUpdateTrip(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await api.patch<ApiResponse<Trip>>(`/trips/${id}`, data);
      return res.data.data;
    },
    onSuccess: (trip) => {
      queryClient.setQueryData(tripKeys.detail(id), trip);
      queryClient.invalidateQueries({ queryKey: tripKeys.lists() });
      toast.success('Trip updated');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

// ── Delete Trip ──
export function useDeleteTrip() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/trips/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tripKeys.lists() });
      queryClient.invalidateQueries({ queryKey: tripKeys.stats() });
      toast.success('Trip deleted');
      router.push(ROUTES.TRIPS);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

// ── Archive Trip ──
export function useArchiveTrip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.patch<ApiResponse<Trip>>(`/trips/${id}/archive`);
      return res.data.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: tripKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: tripKeys.lists() });
      queryClient.invalidateQueries({ queryKey: tripKeys.stats() });
      toast.success('Trip archived');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

// ── Restore Trip ──
export function useRestoreTrip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.patch<ApiResponse<Trip>>(`/trips/${id}/restore`);
      return res.data.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: tripKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: tripKeys.lists() });
      queryClient.invalidateQueries({ queryKey: tripKeys.stats() });
      toast.success('Trip restored');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

// ── Duplicate Trip ──
export function useDuplicateTrip() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post<ApiResponse<Trip>>(`/trips/${id}/duplicate`);
      return res.data.data;
    },
    onSuccess: (trip) => {
      queryClient.invalidateQueries({ queryKey: tripKeys.lists() });
      queryClient.invalidateQueries({ queryKey: tripKeys.stats() });
      toast.success('Trip duplicated');
      router.push(ROUTES.TRIP(trip.id));
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

// ── Upload Cover ──
export function useUploadCover(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('cover', file);
      // Set Content-Type to undefined to clear the instance default ('application/json').
      // This lets the browser auto-set 'multipart/form-data; boundary=...' which multer requires.
      const res = await api.patch<ApiResponse<Trip>>(`/trips/${id}/cover`, formData, {
        headers: { 'Content-Type': undefined },
      });
      return res.data.data;
    },
    onSuccess: (trip) => {
      queryClient.setQueryData(tripKeys.detail(id), trip);
      queryClient.invalidateQueries({ queryKey: tripKeys.lists() });
      toast.success('Cover image updated');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}
