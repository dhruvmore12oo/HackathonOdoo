import { PresenceInfo } from './realtime.types';

/**
 * In-memory presence tracker for trip rooms.
 * Maps tripId → Map<socketId, PresenceInfo>.
 */
const rooms = new Map<string, Map<string, PresenceInfo>>();

export function joinRoom(tripId: string, socketId: string, info: PresenceInfo): void {
  if (!rooms.has(tripId)) rooms.set(tripId, new Map());
  rooms.get(tripId)!.set(socketId, info);
}

export function leaveRoom(tripId: string, socketId: string): void {
  const room = rooms.get(tripId);
  if (!room) return;
  room.delete(socketId);
  if (room.size === 0) rooms.delete(tripId);
}

export function leaveAllRooms(socketId: string): string[] {
  const leftRooms: string[] = [];
  for (const [tripId, room] of rooms) {
    if (room.has(socketId)) {
      room.delete(socketId);
      leftRooms.push(tripId);
      if (room.size === 0) rooms.delete(tripId);
    }
  }
  return leftRooms;
}

export function getRoomMembers(tripId: string): PresenceInfo[] {
  const room = rooms.get(tripId);
  if (!room) return [];
  return Array.from(room.values());
}

export function updatePresence(tripId: string, socketId: string, update: Partial<PresenceInfo>): void {
  const room = rooms.get(tripId);
  if (!room) return;
  const existing = room.get(socketId);
  if (existing) room.set(socketId, { ...existing, ...update, lastSeen: Date.now() });
}

export function getRoomCount(tripId: string): number {
  return rooms.get(tripId)?.size || 0;
}
