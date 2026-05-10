import { z } from 'zod';
import { uuidSchema, dateSchema } from '../../schemas/common.schema';
import { EXPENSE_CATEGORIES, EXPENSE_STATUSES, PAYMENT_METHODS } from './expense.constants';

export const createExpenseSchema = z.object({
  title: z.string().min(1).max(200).trim().optional().nullable(),
  description: z.string().min(1).max(300).trim(),
  category: z.enum(EXPENSE_CATEGORIES),
  amount: z.coerce.number().min(0).multipleOf(0.01),
  currency: z.string().length(3).optional().default('INR'),
  quantity: z.coerce.number().int().min(1).optional().default(1),
  status: z.enum(EXPENSE_STATUSES).optional().default('planned'),
  payment_method: z.enum(PAYMENT_METHODS).optional().nullable(),
  vendor: z.string().max(200).trim().optional().nullable(),
  expense_date: dateSchema.optional().nullable(),
  is_estimated: z.boolean().optional().default(false),
  notes: z.string().max(2000).trim().optional().nullable(),
  section_id: uuidSchema.optional().nullable(),
  activity_id: uuidSchema.optional().nullable(),
});

export const updateExpenseSchema = z.object({
  title: z.string().min(1).max(200).trim().optional().nullable(),
  description: z.string().min(1).max(300).trim().optional(),
  category: z.enum(EXPENSE_CATEGORIES).optional(),
  amount: z.coerce.number().min(0).multipleOf(0.01).optional(),
  currency: z.string().length(3).optional(),
  quantity: z.coerce.number().int().min(1).optional(),
  status: z.enum(EXPENSE_STATUSES).optional(),
  payment_method: z.enum(PAYMENT_METHODS).optional().nullable(),
  vendor: z.string().max(200).trim().optional().nullable(),
  expense_date: dateSchema.optional().nullable(),
  is_estimated: z.boolean().optional(),
  notes: z.string().max(2000).trim().optional().nullable(),
  section_id: uuidSchema.optional().nullable(),
  activity_id: uuidSchema.optional().nullable(),
});

export const expenseFilterSchema = z.object({
  category: z.string().optional(),
  status: z.string().optional(),
  is_estimated: z.string().optional(),
  from_date: z.string().optional(),
  to_date: z.string().optional(),
  q: z.string().optional(),
  sortBy: z.enum(['expense_date', 'amount', 'created_at', 'category']).optional().default('created_at'),
  sortOrder: z.enum(['ASC', 'DESC']).optional().default('DESC'),
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(50),
});

export const budgetSettingsSchema = z.object({
  daily_budget: z.coerce.number().min(0).optional(),
  category_limits: z.record(z.coerce.number().min(0)).optional(),
  warning_threshold: z.coerce.number().min(0).max(100).optional(),
  preferred_currency: z.string().length(3).optional(),
});

export const tripIdParamSchema = z.object({ tripId: uuidSchema });
export const expenseIdParamSchema = z.object({ id: uuidSchema });

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type ExpenseFilters = z.infer<typeof expenseFilterSchema>;
export type BudgetSettingsInput = z.infer<typeof budgetSettingsSchema>;
