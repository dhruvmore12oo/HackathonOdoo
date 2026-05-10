import { queryOne, queryMany, query } from '../../lib/db';
import { UUID } from '../../types';
import { ExpenseRow, BudgetSettingsRow } from './expense.types';
import { CreateExpenseInput, UpdateExpenseInput, ExpenseFilters } from './expense.schema';

// ══════════════════════════════════════
// EXPENSES CRUD
// ══════════════════════════════════════

export async function createExpense(tripId: UUID, data: CreateExpenseInput): Promise<ExpenseRow> {
  const result = await queryOne<ExpenseRow>(
    `INSERT INTO expenses
       (trip_id, title, description, category, amount, currency, quantity,
        status, payment_method, vendor, expense_date, is_estimated, notes,
        section_id, activity_id, is_paid)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
     RETURNING *`,
    [
      tripId, data.title || null, data.description, data.category,
      data.amount, data.currency ?? 'INR', data.quantity ?? 1,
      data.status ?? 'planned', data.payment_method || null,
      data.vendor || null, data.expense_date || null,
      data.is_estimated ?? false, data.notes || null,
      data.section_id || null, data.activity_id || null,
      data.status === 'paid',
    ]
  );
  return result!;
}

export async function updateExpense(expenseId: UUID, data: UpdateExpenseInput): Promise<ExpenseRow> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (data.title !== undefined) { fields.push(`title = $${idx++}`); values.push(data.title); }
  if (data.description !== undefined) { fields.push(`description = $${idx++}`); values.push(data.description); }
  if (data.category !== undefined) { fields.push(`category = $${idx++}`); values.push(data.category); }
  if (data.amount !== undefined) { fields.push(`amount = $${idx++}`); values.push(data.amount); }
  if (data.currency !== undefined) { fields.push(`currency = $${idx++}`); values.push(data.currency); }
  if (data.quantity !== undefined) { fields.push(`quantity = $${idx++}`); values.push(data.quantity); }
  if (data.status !== undefined) {
    fields.push(`status = $${idx++}`); values.push(data.status);
    fields.push(`is_paid = $${idx++}`); values.push(data.status === 'paid');
  }
  if (data.payment_method !== undefined) { fields.push(`payment_method = $${idx++}`); values.push(data.payment_method); }
  if (data.vendor !== undefined) { fields.push(`vendor = $${idx++}`); values.push(data.vendor); }
  if (data.expense_date !== undefined) { fields.push(`expense_date = $${idx++}`); values.push(data.expense_date); }
  if (data.is_estimated !== undefined) { fields.push(`is_estimated = $${idx++}`); values.push(data.is_estimated); }
  if (data.notes !== undefined) { fields.push(`notes = $${idx++}`); values.push(data.notes); }
  if (data.section_id !== undefined) { fields.push(`section_id = $${idx++}`); values.push(data.section_id); }
  if (data.activity_id !== undefined) { fields.push(`activity_id = $${idx++}`); values.push(data.activity_id); }

  if (fields.length === 0) return (await findExpenseById(expenseId))!;

  values.push(expenseId);
  return (await queryOne<ExpenseRow>(
    `UPDATE expenses SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  ))!;
}

export async function findExpenseById(id: UUID): Promise<ExpenseRow | null> {
  return queryOne<ExpenseRow>('SELECT * FROM expenses WHERE id = $1', [id]);
}

export async function deleteExpense(id: UUID): Promise<void> {
  await query('DELETE FROM expenses WHERE id = $1', [id]);
}

export async function updateReceipt(expenseId: UUID, receiptUrl: string): Promise<ExpenseRow> {
  return (await queryOne<ExpenseRow>(
    'UPDATE expenses SET receipt_url = $1 WHERE id = $2 RETURNING *',
    [receiptUrl, expenseId]
  ))!;
}

// ══════════════════════════════════════
// EXPENSE LISTING
// ══════════════════════════════════════

export async function findExpensesByTrip(
  tripId: UUID,
  filters: ExpenseFilters
): Promise<{ rows: ExpenseRow[]; total: number }> {
  const conditions: string[] = ['e.trip_id = $1'];
  const values: unknown[] = [tripId];
  let idx = 2;

  if (filters.category) { conditions.push(`e.category = $${idx++}`); values.push(filters.category); }
  if (filters.status) { conditions.push(`e.status = $${idx++}`); values.push(filters.status); }
  if (filters.is_estimated === 'true') { conditions.push('e.is_estimated = true'); }
  if (filters.is_estimated === 'false') { conditions.push('e.is_estimated = false'); }
  if (filters.from_date) { conditions.push(`e.expense_date >= $${idx++}`); values.push(filters.from_date); }
  if (filters.to_date) { conditions.push(`e.expense_date <= $${idx++}`); values.push(filters.to_date); }
  if (filters.q) {
    conditions.push(`(e.description ILIKE $${idx} OR e.title ILIKE $${idx} OR e.vendor ILIKE $${idx})`);
    values.push(`%${filters.q}%`);
    idx++;
  }

  const where = conditions.join(' AND ');
  const sortBy = filters.sortBy || 'created_at';
  const sortOrder = filters.sortOrder || 'DESC';
  const limit = filters.limit || 50;
  const offset = ((filters.page || 1) - 1) * limit;

  const countResult = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM expenses e WHERE ${where}`,
    values
  );

  const rows = await queryMany<ExpenseRow>(
    `SELECT e.* FROM expenses e WHERE ${where}
     ORDER BY e.${sortBy} ${sortOrder} NULLS LAST
     LIMIT ${limit} OFFSET ${offset}`,
    values
  );

  return { rows, total: Number(countResult?.count || 0) };
}

// ══════════════════════════════════════
// BUDGET SETTINGS
// ══════════════════════════════════════

export async function getBudgetSettings(tripId: UUID): Promise<BudgetSettingsRow | null> {
  return queryOne<BudgetSettingsRow>(
    'SELECT * FROM budget_settings WHERE trip_id = $1',
    [tripId]
  );
}

export async function upsertBudgetSettings(tripId: UUID, data: Record<string, unknown>): Promise<BudgetSettingsRow> {
  const fields: string[] = [];
  const values: unknown[] = [tripId];
  let idx = 2;

  if (data.daily_budget !== undefined) { fields.push(`daily_budget = $${idx++}`); values.push(data.daily_budget); }
  if (data.category_limits !== undefined) { fields.push(`category_limits = $${idx++}`); values.push(JSON.stringify(data.category_limits)); }
  if (data.warning_threshold !== undefined) { fields.push(`warning_threshold = $${idx++}`); values.push(data.warning_threshold); }
  if (data.preferred_currency !== undefined) { fields.push(`preferred_currency = $${idx++}`); values.push(data.preferred_currency); }

  if (fields.length === 0) return (await getBudgetSettings(tripId))!;

  const setClause = fields.join(', ');
  return (await queryOne<BudgetSettingsRow>(
    `INSERT INTO budget_settings (trip_id)
     VALUES ($1)
     ON CONFLICT (trip_id)
     DO UPDATE SET ${setClause}
     RETURNING *`,
    values
  ))!;
}
