'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api, getErrorMessage } from '@/lib/api';
import type { ApiResponse } from '@/types';

interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string | null;
  metadata: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}

export const notificationKeys = {
  list: ['notifications'] as const,
  unread: ['notifications', 'unread'] as const,
};

export function useNotifications(page = 1) {
  return useQuery({
    queryKey: [...notificationKeys.list, page],
    queryFn: async () => {
      const res = await api.get(`/notifications?page=${page}&limit=20`);
      return res.data;
    },
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: notificationKeys.unread,
    queryFn: async () => {
      const res = await api.get<ApiResponse<{ count: number }>>('/notifications/unread-count');
      return res.data.data.count;
    },
    refetchInterval: 30000, // Poll every 30s
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/notifications/${id}/read`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.list });
      qc.invalidateQueries({ queryKey: notificationKeys.unread });
    },
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.patch('/notifications/read-all');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.list });
      qc.invalidateQueries({ queryKey: notificationKeys.unread });
      toast.success('All notifications marked as read');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useDeleteNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/notifications/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.list });
      qc.invalidateQueries({ queryKey: notificationKeys.unread });
    },
  });
}
