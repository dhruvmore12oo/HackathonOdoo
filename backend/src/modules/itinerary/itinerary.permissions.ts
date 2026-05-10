import { UUID } from '../../types';
import { NotFoundError, ForbiddenError } from '../../errors';
import { queryOne } from '../../lib/db';

/**
 * Verify trip ownership and return trip_id. Reuses the trip ownership pattern.
 */
export async function assertItineraryTripOwnership(
  tripId: UUID,
  userId: UUID
): Promise<void> {
  const trip = await queryOne<{ id: UUID; user_id: UUID; deleted_at: Date | null }>(
    'SELECT id, user_id, deleted_at FROM trips WHERE id = $1',
    [tripId]
  );

  if (!trip || trip.deleted_at) {
    throw new NotFoundError('Trip');
  }

  if (trip.user_id !== userId) {
    throw new ForbiddenError('You do not have permission to modify this trip itinerary');
  }
}

/**
 * Assert that a section exists and belongs to the given trip.
 */
export async function assertSectionOwnership(
  sectionId: UUID,
  userId: UUID
): Promise<{ id: UUID; trip_id: UUID }> {
  const section = await queryOne<{ id: UUID; trip_id: UUID; user_id: UUID }>(
    `SELECT s.id, s.trip_id, t.user_id
     FROM itinerary_sections s
     JOIN trips t ON t.id = s.trip_id
     WHERE s.id = $1 AND t.deleted_at IS NULL`,
    [sectionId]
  );

  if (!section) {
    throw new NotFoundError('Section');
  }

  if (section.user_id !== userId) {
    throw new ForbiddenError('You do not have permission to modify this section');
  }

  return { id: section.id, trip_id: section.trip_id };
}

/**
 * Assert that an activity exists and belongs to a section owned by the user.
 */
export async function assertActivityOwnership(
  activityId: UUID,
  userId: UUID
): Promise<{ id: UUID; section_id: UUID; trip_id: UUID }> {
  const activity = await queryOne<{
    id: UUID; section_id: UUID; trip_id: UUID; user_id: UUID;
  }>(
    `SELECT a.id, a.section_id, s.trip_id, t.user_id
     FROM section_activities a
     JOIN itinerary_sections s ON s.id = a.section_id
     JOIN trips t ON t.id = s.trip_id
     WHERE a.id = $1 AND t.deleted_at IS NULL`,
    [activityId]
  );

  if (!activity) {
    throw new NotFoundError('Activity');
  }

  if (activity.user_id !== userId) {
    throw new ForbiddenError('You do not have permission to modify this activity');
  }

  return { id: activity.id, section_id: activity.section_id, trip_id: activity.trip_id };
}
