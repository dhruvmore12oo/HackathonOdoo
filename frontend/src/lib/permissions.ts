import type { CollaboratorRole, Trip } from '@/types';

export type EffectiveTripRole = CollaboratorRole | null | undefined;

export function getTripRole(trip?: Pick<Trip, 'current_user_role'> | null): EffectiveTripRole {
  return trip?.current_user_role;
}

export function canEditTrip(role: EffectiveTripRole): boolean {
  return role === 'owner' || role === 'editor';
}

export function canManageTrip(role: EffectiveTripRole): boolean {
  return role === 'owner';
}

export function canManageCollaboration(role: EffectiveTripRole): boolean {
  return role === 'owner';
}
