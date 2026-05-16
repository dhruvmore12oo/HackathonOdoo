'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api, publicApi, getErrorMessage } from '@/lib/api';
import type {
  ShareLink, Collaborator, CollaboratorRole, ActivityFeedItem, PublicTripData, PendingInvitation, ApiResponse, PaginatedResponse,
} from '@/types';

type ManagedCollaboratorRole = Exclude<CollaboratorRole, 'owner'>;

export const shareKeys = {
  links: (tripId: string) => ['share', 'links', tripId] as const,
  collaborators: (tripId: string) => ['share', 'collaborators', tripId] as const,
  feed: (tripId: string) => ['share', 'feed', tripId] as const,
  public: (slug: string) => ['share', 'public', slug] as const,
  community: (filters?: object) => ['community', filters] as const,
  invitations: ['share', 'invitations'] as const,
};

// ── Share Links ──
export function useShareLinks(tripId: string) {
  return useQuery({
    queryKey: shareKeys.links(tripId),
    queryFn: async () => {
      const res = await api.get<ApiResponse<ShareLink[]>>(`/trips/${tripId}/share-links`);
      return res.data.data;
    },
    enabled: !!tripId,
  });
}

export function useCreateShareLink(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { visibility?: string; expires_in_days?: number; password?: string }) => {
      const res = await api.post<ApiResponse<ShareLink>>(`/trips/${tripId}/share`, data);
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: shareKeys.links(tripId) });
      toast.success('Share link created!');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useRevokeShareLink(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (linkId: string) => {
      await api.patch(`/shares/${linkId}/revoke`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: shareKeys.links(tripId) });
      toast.success('Share link revoked');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

// ── Collaborators ──
export function useCollaborators(tripId: string) {
  return useQuery({
    queryKey: shareKeys.collaborators(tripId),
    queryFn: async () => {
      const res = await api.get<ApiResponse<Collaborator[]>>(`/trips/${tripId}/collaborators`);
      return res.data.data;
    },
    enabled: !!tripId,
  });
}

export function useInviteCollaborator(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { email: string; role: ManagedCollaboratorRole }) => {
      const res = await api.post<ApiResponse<Collaborator>>(`/trips/${tripId}/collaborators`, data);
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: shareKeys.collaborators(tripId) });
      toast.success('Collaborator invited');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useRemoveCollaborator(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (collaboratorId: string) => {
      await api.delete(`/collaborators/${collaboratorId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: shareKeys.collaborators(tripId) });
      toast.success('Collaborator removed');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useUpdateCollaborator(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, role }: { id: string; role: ManagedCollaboratorRole }) => {
      const res = await api.patch<ApiResponse<Collaborator>>(`/collaborators/${id}`, { role });
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: shareKeys.collaborators(tripId) });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

// ── Activity Feed ──
export function useActivityFeed(tripId: string) {
  return useQuery({
    queryKey: shareKeys.feed(tripId),
    queryFn: async () => {
      const res = await api.get<ApiResponse<ActivityFeedItem[]>>(`/trips/${tripId}/activity-feed`);
      return res.data.data;
    },
    enabled: !!tripId,
  });
}

// ── Public Trip (NO auth — uses publicApi) ──
export function usePublicTrip(slug: string) {
  return useQuery({
    queryKey: shareKeys.public(slug),
    queryFn: async () => {
      const res = await publicApi.get<ApiResponse<PublicTripData>>(`/share/${slug}`);
      return res.data.data;
    },
    enabled: !!slug,
    retry: false,
  });
}

// ── Community (NO auth — uses publicApi) ──
export function useCommunityTrips(filters?: { q?: string; page?: number }) {
  const params = new URLSearchParams(
    Object.fromEntries(Object.entries(filters ?? {}).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)]))
  );
  return useQuery({
    queryKey: shareKeys.community(filters),
    queryFn: async () => {
      const res = await publicApi.get<PaginatedResponse<PublicTripData>>(`/community/public-trips?${params}`);
      return res.data;
    },
  });
}

// ── Invitations ──

export function usePendingInvitations() {
  return useQuery({
    queryKey: shareKeys.invitations,
    queryFn: async () => {
      const res = await api.get<ApiResponse<PendingInvitation[]>>('/my-invitations');
      return res.data.data;
    },
  });
}

export function useAcceptInvitation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (tripId: string) => {
      const res = await api.post<ApiResponse<Collaborator>>(`/trips/${tripId}/collaborators/accept`);
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: shareKeys.invitations });
      qc.invalidateQueries({ queryKey: ['trips'] });
      toast.success('Invitation accepted! You can now access the trip.');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useDeclineInvitation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (tripId: string) => {
      await api.post(`/trips/${tripId}/collaborators/decline`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: shareKeys.invitations });
      toast.success('Invitation declined');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}
