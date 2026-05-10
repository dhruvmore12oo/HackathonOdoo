import { UUID } from '../../types';
import { NotFoundError, ForbiddenError } from '../../errors';
import { queryOne } from '../../lib/db';

export async function assertExpenseTripOwnership(tripId: UUID, userId: UUID): Promise<void> {
  const trip = await queryOne<{ id: UUID; user_id: UUID; deleted_at: Date | null }>(
    'SELECT id, user_id, deleted_at FROM trips WHERE id = $1',
    [tripId]
  );
  if (!trip || trip.deleted_at) throw new NotFoundError('Trip');
  if (trip.user_id !== userId) throw new ForbiddenError('You do not have permission to access this trip');
}

export async function assertExpenseOwnership(
  expenseId: UUID,
  userId: UUID
): Promise<{ id: UUID; trip_id: UUID }> {
  const expense = await queryOne<{ id: UUID; trip_id: UUID; user_id: UUID }>(
    `SELECT e.id, e.trip_id, t.user_id
     FROM expenses e JOIN trips t ON t.id = e.trip_id
     WHERE e.id = $1 AND t.deleted_at IS NULL`,
    [expenseId]
  );
  if (!expense) throw new NotFoundError('Expense');
  if (expense.user_id !== userId) throw new ForbiddenError('You do not have permission to modify this expense');
  return { id: expense.id, trip_id: expense.trip_id };
}
