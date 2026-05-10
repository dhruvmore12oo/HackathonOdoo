import { UUID } from '../../types';

export interface ExpenseRow {
  id: UUID;
  trip_id: UUID;
  section_id: UUID | null;
  activity_id: UUID | null;
  title: string | null;
  description: string;
  category: string;
  amount: number;
  currency: string;
  quantity: number;
  status: string;
  payment_method: string | null;
  vendor: string | null;
  receipt_url: string | null;
  transaction_reference: string | null;
  expense_date: string | null;
  is_estimated: boolean;
  is_paid: boolean;
  notes: string | null;
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export interface BudgetSettingsRow {
  id: UUID;
  trip_id: UUID;
  daily_budget: number;
  category_limits: Record<string, number>;
  warning_threshold: number;
  preferred_currency: string;
  created_at: Date;
  updated_at: Date;
}

export interface ExpenseAnalytics {
  total_budget: number;
  total_spent: number;
  total_estimated: number;
  total_actual: number;
  remaining: number;
  spent_percentage: number;
  by_category: CategoryBreakdown[];
  by_status: StatusBreakdown[];
  daily_spending: DailySpending[];
  budget_health: 'healthy' | 'warning' | 'danger';
  warning_threshold: number;
}

export interface CategoryBreakdown {
  category: string;
  total: number;
  count: number;
  percentage: number;
}

export interface StatusBreakdown {
  status: string;
  total: number;
  count: number;
}

export interface DailySpending {
  date: string;
  total: number;
  count: number;
}

export interface BudgetSummary {
  total_budget: number;
  total_spent: number;
  total_estimated: number;
  remaining: number;
  spent_percentage: number;
  daily_budget: number;
  daily_average: number;
  category_breakdown: CategoryBreakdown[];
  budget_health: 'healthy' | 'warning' | 'danger';
  top_categories: CategoryBreakdown[];
  recent_expenses: ExpenseRow[];
}
