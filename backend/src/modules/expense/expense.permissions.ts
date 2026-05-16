import { UUID } from '../../types';
import { NotFoundError } from '../../errors';
import { queryOne } from '../../lib/db';
import { assertTripAccess } from '../share/share.permissions';
import { CollaboratorRoleType } from '../share/share.constants';

/**
 * Verify the user has the given permission on the trip for expense operations.
 */
export async function assertExpenseTripAccess(
  tripId: UUID,
  userId: UUID,
  permission: 'canView' | 'canEdit'
): Promise<CollaboratorRoleType> {
  return assertTripAccess(tripId, userId, permission);
}

/**
 * Assert that an expense exists and the user has the given permission on its trip.
 */
export async function assertExpenseAccess(
  expenseId: UUID,
  userId: UUID,
  permission: 'canView' | 'canEdit'
): Promise<{ id: UUID; trip_id: UUID }> {
  const expense = await queryOne<{ id: UUID; trip_id: UUID }>(
    `SELECT e.id, e.trip_id
     FROM expenses e JOIN trips t ON t.id = e.trip_id
     WHERE e.id = $1 AND t.deleted_at IS NULL`,
    [expenseId]
  );
  if (!expense) throw new NotFoundError('Expense');

  await assertTripAccess(expense.trip_id, userId, permission);
  return { id: expense.id, trip_id: expense.trip_id };
}
