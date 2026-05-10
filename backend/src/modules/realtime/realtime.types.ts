import { UUID } from '../../types';

export interface SocketUser {
  userId: UUID;
  socketId: string;
  firstName: string;
  lastName: string;
}

export interface PresenceInfo {
  userId: UUID;
  firstName: string;
  lastName: string;
  status: 'online' | 'idle';
  editingSection?: string;
  lastSeen: number;
}

export interface TripRoom {
  tripId: UUID;
  members: Map<string, PresenceInfo>; // socketId → PresenceInfo
}
