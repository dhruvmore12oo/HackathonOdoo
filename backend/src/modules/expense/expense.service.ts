import { UUID } from '../../types';
import { logger } from '../../config/logger';
import * as repo from './expense.repository';
import * as analytics from './expense.analytics';
import { assertExpenseTripAccess, assertExpenseAccess } from './expense.permissions';
import { CreateExpenseInput, UpdateExpenseInput, ExpenseFilters, BudgetSettingsInput } from './expense.schema';
import { ExpenseRow, ExpenseAnalytics, BudgetSummary, BudgetSettingsRow } from './expense.types';

// ── Expenses ──

export async function createExpense(userId: UUID, tripId: UUID, data: CreateExpenseInput): Promise<ExpenseRow> {
  await assertExpenseTripAccess(tripId, userId, 'canEdit');
  const expense = await repo.createExpense(tripId, data);
  logger.info('Expense created', { userId, tripId, expenseId: expense.id });
  return expense;
}

export async function updateExpense(userId: UUID, expenseId: UUID, data: UpdateExpenseInput): Promise<ExpenseRow> {
  await assertExpenseAccess(expenseId, userId, 'canEdit');
  const expense = await repo.updateExpense(expenseId, data);
  logger.info('Expense updated', { userId, expenseId });
  return expense;
}

export async function deleteExpense(userId: UUID, expenseId: UUID): Promise<void> {
  const { trip_id } = await assertExpenseAccess(expenseId, userId, 'canEdit');
  await repo.deleteExpense(expenseId);
  logger.info('Expense deleted', { userId, expenseId, tripId: trip_id });
}

export async function getExpense(userId: UUID, expenseId: UUID): Promise<ExpenseRow> {
  const { id } = await assertExpenseAccess(expenseId, userId, 'canView');
  return (await repo.findExpenseById(id))!;
}

export async function listExpenses(
  userId: UUID, tripId: UUID, filters: ExpenseFilters
): Promise<{ rows: ExpenseRow[]; total: number }> {
  await assertExpenseTripAccess(tripId, userId, 'canView');
  return repo.findExpensesByTrip(tripId, filters);
}

export async function uploadReceipt(userId: UUID, expenseId: UUID, filename: string): Promise<ExpenseRow> {
  await assertExpenseAccess(expenseId, userId, 'canEdit');
  const receiptUrl = `/uploads/${filename}`;
  const expense = await repo.updateReceipt(expenseId, receiptUrl);
  logger.info('Receipt uploaded', { userId, expenseId });
  return expense;
}

// ── Analytics ──

export async function getAnalytics(userId: UUID, tripId: UUID): Promise<ExpenseAnalytics> {
  await assertExpenseTripAccess(tripId, userId, 'canView');
  return analytics.getExpenseAnalytics(tripId);
}

export async function getBudgetSummary(userId: UUID, tripId: UUID): Promise<BudgetSummary> {
  await assertExpenseTripAccess(tripId, userId, 'canView');
  return analytics.getBudgetSummary(tripId);
}

// ── Budget Settings ──

export async function getBudgetSettings(userId: UUID, tripId: UUID): Promise<BudgetSettingsRow | null> {
  await assertExpenseTripAccess(tripId, userId, 'canView');
  return repo.getBudgetSettings(tripId);
}

export async function updateBudgetSettings(userId: UUID, tripId: UUID, data: BudgetSettingsInput): Promise<BudgetSettingsRow> {
  await assertExpenseTripAccess(tripId, userId, 'canEdit');
  const settings = await repo.upsertBudgetSettings(tripId, data);
  logger.info('Budget settings updated', { userId, tripId });
  return settings;
}
