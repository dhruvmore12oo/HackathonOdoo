import { UUID } from '../../types';
import { NotFoundError } from '../../errors';
import { queryOne } from '../../lib/db';
import { assertTripAccess } from '../share/share.permissions';
import { CollaboratorRoleType } from '../share/share.constants';

/**
 * Verify trip access with the given permission level and return the user's role.
 */
export async function assertItineraryTripAccess(
  tripId: UUID,
  userId: UUID,
  permission: 'canView' | 'canEdit'
): Promise<CollaboratorRoleType> {
  return assertTripAccess(tripId, userId, permission);
}

/**
 * Assert that a section exists and the user has the given permission on its trip.
 */
export async function assertSectionAccess(
  sectionId: UUID,
  userId: UUID,
  permission: 'canView' | 'canEdit'
): Promise<{ id: UUID; trip_id: UUID }> {
  const section = await queryOne<{ id: UUID; trip_id: UUID }>(
    `SELECT s.id, s.trip_id
     FROM itinerary_sections s
     JOIN trips t ON t.id = s.trip_id
     WHERE s.id = $1 AND t.deleted_at IS NULL`,
    [sectionId]
  );

  if (!section) {
    throw new NotFoundError('Section');
  }

  await assertTripAccess(section.trip_id, userId, permission);
  return { id: section.id, trip_id: section.trip_id };
}

/**
 * Assert that an activity exists and the user has the given permission on its trip.
 */
export async function assertActivityAccess(
  activityId: UUID,
  userId: UUID,
  permission: 'canView' | 'canEdit'
): Promise<{ id: UUID; section_id: UUID; trip_id: UUID }> {
  const activity = await queryOne<{
    id: UUID; section_id: UUID; trip_id: UUID;
  }>(
    `SELECT a.id, a.section_id, s.trip_id
     FROM section_activities a
     JOIN itinerary_sections s ON s.id = a.section_id
     JOIN trips t ON t.id = s.trip_id
     WHERE a.id = $1 AND t.deleted_at IS NULL`,
    [activityId]
  );

  if (!activity) {
    throw new NotFoundError('Activity');
  }

  await assertTripAccess(activity.trip_id, userId, permission);
  return { id: activity.id, section_id: activity.section_id, trip_id: activity.trip_id };
}
