'use client';

import { io, Socket } from 'socket.io-client';
import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { getApiToken } from '@/lib/api';
import toast from 'react-hot-toast';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:4000';

let socket: Socket | null = null;

export function getSocket(): Socket | null {
  return socket;
}

export function connectSocket(token: string): Socket {
  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  socket.on('connect', () => {
    console.log('[Socket] Connected:', socket?.id);
  });

  socket.on('connect_error', (err) => {
    console.warn('[Socket] Connection error:', err.message);
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
  });

  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

// ── RT Event Constants (mirrors backend) ──
export const RT_EVENTS = {
  JOIN_TRIP: 'trip:join',
  LEAVE_TRIP: 'trip:leave',
  PRESENCE_LIST: 'presence:list',
  USER_EDITING: 'user:editing',
  USER_TYPING: 'user:typing',
  TRIP_UPDATED: 'trip:updated',
  SECTION_CREATED: 'itinerary:section:created',
  SECTION_UPDATED: 'itinerary:section:updated',
  SECTION_DELETED: 'itinerary:section:deleted',
  ACTIVITY_CREATED: 'itinerary:activity:created',
  ACTIVITY_UPDATED: 'itinerary:activity:updated',
  ACTIVITY_DELETED: 'itinerary:activity:deleted',
  EXPENSE_CREATED: 'expense:created',
  EXPENSE_UPDATED: 'expense:updated',
  EXPENSE_DELETED: 'expense:deleted',
  NOTIFICATION_NEW: 'notification:new',
  NOTIFICATION_COUNT: 'notification:count',
  FEED_NEW: 'feed:new',
} as const;

// ── Presence Type ──
export interface PresenceInfo {
  userId: string;
  firstName: string;
  lastName: string;
  status: 'online' | 'idle';
  editingSection?: string;
}

// ── Hook: Auto-connect socket on auth ──
export function useSocketConnection() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      const token = getApiToken();
      if (token) connectSocket(token);
    }
    return () => { /* keep alive across pages */ };
  }, [isAuthenticated]);
}

// ── Hook: Join/leave trip room with cache invalidation ──
export function useTripRoom(tripId: string | undefined) {
  const qc = useQueryClient();
  const presenceRef = useRef<PresenceInfo[]>([]);

  useEffect(() => {
    if (!tripId || !socket?.connected) return;

    socket.emit(RT_EVENTS.JOIN_TRIP, tripId);

    // Listen for realtime updates and invalidate caches
    const handlers: [string, (...args: unknown[]) => void][] = [
      [RT_EVENTS.PRESENCE_LIST, (members: unknown) => { presenceRef.current = members as PresenceInfo[]; }],
      [RT_EVENTS.TRIP_UPDATED, () => qc.invalidateQueries({ queryKey: ['trips', tripId] })],
      [RT_EVENTS.SECTION_CREATED, () => qc.invalidateQueries({ queryKey: ['itinerary', tripId] })],
      [RT_EVENTS.SECTION_UPDATED, () => qc.invalidateQueries({ queryKey: ['itinerary', tripId] })],
      [RT_EVENTS.SECTION_DELETED, () => qc.invalidateQueries({ queryKey: ['itinerary', tripId] })],
      [RT_EVENTS.ACTIVITY_CREATED, () => qc.invalidateQueries({ queryKey: ['itinerary', tripId] })],
      [RT_EVENTS.ACTIVITY_UPDATED, () => qc.invalidateQueries({ queryKey: ['itinerary', tripId] })],
      [RT_EVENTS.ACTIVITY_DELETED, () => qc.invalidateQueries({ queryKey: ['itinerary', tripId] })],
      [RT_EVENTS.EXPENSE_CREATED, () => {
        qc.invalidateQueries({ queryKey: ['expenses', tripId] });
        qc.invalidateQueries({ queryKey: ['budget-summary', tripId] });
      }],
      [RT_EVENTS.EXPENSE_UPDATED, () => {
        qc.invalidateQueries({ queryKey: ['expenses', tripId] });
        qc.invalidateQueries({ queryKey: ['budget-summary', tripId] });
      }],
      [RT_EVENTS.EXPENSE_DELETED, () => {
        qc.invalidateQueries({ queryKey: ['expenses', tripId] });
        qc.invalidateQueries({ queryKey: ['budget-summary', tripId] });
      }],
      [RT_EVENTS.FEED_NEW, () => qc.invalidateQueries({ queryKey: ['share', 'feed', tripId] })],
    ];

    handlers.forEach(([event, handler]) => socket!.on(event, handler as (...args: unknown[]) => void));

    return () => {
      socket?.emit(RT_EVENTS.LEAVE_TRIP, tripId);
      handlers.forEach(([event, handler]) => socket?.off(event, handler as (...args: unknown[]) => void));
    };
  }, [tripId, qc]);

  const emitEditing = useCallback((sectionId?: string) => {
    if (socket?.connected && tripId) {
      socket.emit(RT_EVENTS.USER_EDITING, { tripId, sectionId });
    }
  }, [tripId]);

  return { presence: presenceRef, emitEditing };
}

// ── Hook: Realtime notification listener ──
export function useRealtimeNotifications() {
  const qc = useQueryClient();

  useEffect(() => {
    if (!socket?.connected) return;

    const handleNew = (notification: { title: string }) => {
      toast(notification.title, { icon: '🔔', duration: 4000 });
      qc.invalidateQueries({ queryKey: ['notifications'] });
    };

    const handleCount = () => {
      qc.invalidateQueries({ queryKey: ['notifications', 'unread'] });
    };

    socket.on(RT_EVENTS.NOTIFICATION_NEW, handleNew);
    socket.on(RT_EVENTS.NOTIFICATION_COUNT, handleCount);

    return () => {
      socket?.off(RT_EVENTS.NOTIFICATION_NEW, handleNew);
      socket?.off(RT_EVENTS.NOTIFICATION_COUNT, handleCount);
    };
  }, [qc]);
}
