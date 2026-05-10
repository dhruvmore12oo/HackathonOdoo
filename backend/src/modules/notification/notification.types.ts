import { UUID } from '../../types';

export interface NotificationRow {
  id: UUID;
  user_id: UUID;
  type: string;
  title: string;
  message: string | null;
  metadata: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}

export const NOTIFICATION_TYPES = {
  COLLABORATOR_INVITED: 'collaborator_invited',
  COLLABORATOR_ACCEPTED: 'collaborator_accepted',
  COLLABORATOR_REMOVED: 'collaborator_removed',
  TRIP_SHARED: 'trip_shared',
  ITINERARY_UPDATED: 'itinerary_updated',
  EXPENSE_ADDED: 'expense_added',
  AI_SUGGESTION_READY: 'ai_suggestion_ready',
} as const;
