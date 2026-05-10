import { UUID } from '../../types';
import { NotFoundError, ForbiddenError } from '../../errors';
import { queryOne } from '../../lib/db';

/**
 * Verify trip exists and belongs to the user. Returns the trip row.
 * Throws TripNotFoundError or TripAccessDeniedError.
 */
export async function assertTripOwnership(
  tripId: UUID,
  userId: UUID
): Promise<{ id: UUID; user_id: UUID; deleted_at: Date | null }> {
  const trip = await queryOne<{ id: UUID; user_id: UUID; deleted_at: Date | null }>(
    'SELECT id, user_id, deleted_at FROM trips WHERE id = $1',
    [tripId]
  );

  if (!trip || trip.deleted_at) {
    throw new NotFoundError('Trip');
  }

  if (trip.user_id !== userId) {
    throw new ForbiddenError('You do not have permission to access this trip');
  }

  return trip;
}

/**
 * Verify trip exists (for public views, no ownership check).
 */
export async function assertTripExists(
  tripId: UUID
): Promise<{ id: UUID; user_id: UUID; deleted_at: Date | null }> {
  const trip = await queryOne<{ id: UUID; user_id: UUID; deleted_at: Date | null }>(
    'SELECT id, user_id, deleted_at FROM trips WHERE id = $1',
    [tripId]
  );

  if (!trip || trip.deleted_at) {
    throw new NotFoundError('Trip');
  }

  return trip;
}
