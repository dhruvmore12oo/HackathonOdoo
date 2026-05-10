import { queryOne, queryMany } from '../../lib/db';
import { UUID } from '../../types';
import { ExpenseAnalytics, BudgetSummary, CategoryBreakdown, DailySpending, StatusBreakdown, ExpenseRow } from './expense.types';
import { DEFAULT_WARNING_THRESHOLD } from './expense.constants';
import * as repo from './expense.repository';

/**
 * Calculate full analytics for a trip's expenses.
 */
export async function getExpenseAnalytics(tripId: UUID): Promise<ExpenseAnalytics> {
  // Get trip budget
  const trip = await queryOne<{ total_budget: number }>('SELECT total_budget FROM trips WHERE id = $1', [tripId]);
  const totalBudget = Number(trip?.total_budget || 0);

  // Get budget settings
  const settings = await repo.getBudgetSettings(tripId);
  const warningThreshold = Number(settings?.warning_threshold || DEFAULT_WARNING_THRESHOLD);

  // Aggregated totals
  const totals = await queryOne<{
    total_spent: string; total_estimated: string; total_actual: string; expense_count: string;
  }>(
    `SELECT
       COALESCE(SUM(amount * quantity), 0) as total_spent,
       COALESCE(SUM(CASE WHEN is_estimated THEN amount * quantity ELSE 0 END), 0) as total_estimated,
       COALESCE(SUM(CASE WHEN NOT is_estimated THEN amount * quantity ELSE 0 END), 0) as total_actual,
       COUNT(*) as expense_count
     FROM expenses WHERE trip_id = $1`,
    [tripId]
  );

  const totalSpent = Number(totals?.total_spent || 0);
  const totalEstimated = Number(totals?.total_estimated || 0);
  const totalActual = Number(totals?.total_actual || 0);
  const remaining = totalBudget - totalSpent;
  const spentPercentage = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  // Category breakdown
  const categoryRows = await queryMany<{ category: string; total: string; count: string }>(
    `SELECT category, COALESCE(SUM(amount * quantity), 0) as total, COUNT(*) as count
     FROM expenses WHERE trip_id = $1
     GROUP BY category ORDER BY total DESC`,
    [tripId]
  );

  const byCategory: CategoryBreakdown[] = categoryRows.map((r) => ({
    category: r.category,
    total: Number(r.total),
    count: Number(r.count),
    percentage: totalSpent > 0 ? Math.round((Number(r.total) / totalSpent) * 100) : 0,
  }));

  // Status breakdown
  const statusRows = await queryMany<{ status: string; total: string; count: string }>(
    `SELECT status, COALESCE(SUM(amount * quantity), 0) as total, COUNT(*) as count
     FROM expenses WHERE trip_id = $1
     GROUP BY status`,
    [tripId]
  );

  const byStatus: StatusBreakdown[] = statusRows.map((r) => ({
    status: r.status,
    total: Number(r.total),
    count: Number(r.count),
  }));

  // Daily spending
  const dailyRows = await queryMany<{ date: string; total: string; count: string }>(
    `SELECT expense_date as date, COALESCE(SUM(amount * quantity), 0) as total, COUNT(*) as count
     FROM expenses WHERE trip_id = $1 AND expense_date IS NOT NULL
     GROUP BY expense_date ORDER BY expense_date ASC`,
    [tripId]
  );

  const dailySpending: DailySpending[] = dailyRows.map((r) => ({
    date: r.date,
    total: Number(r.total),
    count: Number(r.count),
  }));

  // Budget health
  let budgetHealth: 'healthy' | 'warning' | 'danger' = 'healthy';
  if (spentPercentage >= 100) budgetHealth = 'danger';
  else if (spentPercentage >= warningThreshold) budgetHealth = 'warning';

  return {
    total_budget: totalBudget,
    total_spent: totalSpent,
    total_estimated: totalEstimated,
    total_actual: totalActual,
    remaining,
    spent_percentage: spentPercentage,
    by_category: byCategory,
    by_status: byStatus,
    daily_spending: dailySpending,
    budget_health: budgetHealth,
    warning_threshold: warningThreshold,
  };
}

/**
 * Full budget summary for dashboard.
 */
export async function getBudgetSummary(tripId: UUID): Promise<BudgetSummary> {
  const analytics = await getExpenseAnalytics(tripId);
  const settings = await repo.getBudgetSettings(tripId);

  // Trip date range for daily average
  const trip = await queryOne<{ start_date: string; end_date: string }>(
    'SELECT start_date, end_date FROM trips WHERE id = $1',
    [tripId]
  );
  const tripDays = trip
    ? Math.max(1, Math.ceil((new Date(trip.end_date).getTime() - new Date(trip.start_date).getTime()) / (1000 * 60 * 60 * 24)) + 1)
    : 1;

  const dailyAverage = analytics.total_spent / tripDays;

  // Recent expenses
  const recent = await queryMany<ExpenseRow>(
    'SELECT * FROM expenses WHERE trip_id = $1 ORDER BY created_at DESC LIMIT 5',
    [tripId]
  );

  // Top 3 categories
  const topCategories = analytics.by_category.slice(0, 3);

  return {
    total_budget: analytics.total_budget,
    total_spent: analytics.total_spent,
    total_estimated: analytics.total_estimated,
    remaining: analytics.remaining,
    spent_percentage: analytics.spent_percentage,
    daily_budget: Number(settings?.daily_budget || 0),
    daily_average: Math.round(dailyAverage * 100) / 100,
    category_breakdown: analytics.by_category,
    budget_health: analytics.budget_health,
    top_categories: topCategories,
    recent_expenses: recent,
  };
}
