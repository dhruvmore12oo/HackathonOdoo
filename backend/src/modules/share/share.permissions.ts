import { UUID } from '../../types';
import { NotFoundError, ForbiddenError } from '../../errors';
import { queryOne } from '../../lib/db';
import { ROLE_PERMISSIONS, CollaboratorRoleType } from './share.constants';

/**
 * Verify the user is the OWNER of the trip.
 */
export async function assertTripOwner(tripId: UUID, userId: UUID): Promise<void> {
  const trip = await queryOne<{ user_id: UUID; deleted_at: Date | null }>(
    'SELECT user_id, deleted_at FROM trips WHERE id = $1',
    [tripId]
  );
  if (!trip || trip.deleted_at) throw new NotFoundError('Trip');
  if (trip.user_id !== userId) throw new ForbiddenError('Only the trip owner can perform this action');
}

/**
 * Verify the user has at least a given permission on the trip (owner or collaborator).
 * Returns the resolved role.
 */
export async function assertTripAccess(
  tripId: UUID,
  userId: UUID,
  requiredPermission: 'canView' | 'canEdit' | 'canDelete' | 'canManageCollaborators' | 'canManageShare'
): Promise<CollaboratorRoleType> {
  const trip = await queryOne<{ user_id: UUID; deleted_at: Date | null }>(
    'SELECT user_id, deleted_at FROM trips WHERE id = $1',
    [tripId]
  );
  if (!trip || trip.deleted_at) throw new NotFoundError('Trip');

  // Owner always has full access
  if (trip.user_id === userId) return 'owner';

  // Check collaborator
  const collab = await queryOne<{ role: CollaboratorRoleType; accepted_at: Date | null }>(
    'SELECT role, accepted_at FROM trip_collaborators WHERE trip_id = $1 AND user_id = $2',
    [tripId, userId]
  );

  if (!collab || !collab.accepted_at) throw new ForbiddenError('You do not have access to this trip');

  const perms = ROLE_PERMISSIONS[collab.role];
  if (!perms[requiredPermission]) {
    throw new ForbiddenError(`Your role (${collab.role}) does not have permission for this action`);
  }

  return collab.role;
}

/**
 * Get user's effective role on a trip (null = no access).
 */
export async function getTripRole(tripId: UUID, userId: UUID): Promise<CollaboratorRoleType | null> {
  const trip = await queryOne<{ user_id: UUID }>('SELECT user_id FROM trips WHERE id = $1', [tripId]);
  if (!trip) return null;
  if (trip.user_id === userId) return 'owner';

  const collab = await queryOne<{ role: CollaboratorRoleType; accepted_at: Date | null }>(
    'SELECT role, accepted_at FROM trip_collaborators WHERE trip_id = $1 AND user_id = $2',
    [tripId, userId]
  );
  if (!collab || !collab.accepted_at) return null;
  return collab.role;
}
