import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/auth';
import { uploadSingle } from '../../lib/upload';
import {
  createExpenseSchema, updateExpenseSchema, expenseFilterSchema,
  budgetSettingsSchema, tripIdParamSchema, expenseIdParamSchema,
} from './expense.schema';
import * as ctrl from './expense.controller';

const router = Router();

router.use(authenticate);

// ── Trip-scoped endpoints ──
router.post('/trips/:tripId/expenses', validate(tripIdParamSchema, 'params'), validate(createExpenseSchema), ctrl.create);
router.get('/trips/:tripId/expenses', validate(tripIdParamSchema, 'params'), validate(expenseFilterSchema, 'query'), ctrl.list);
router.get('/trips/:tripId/expenses/analytics', validate(tripIdParamSchema, 'params'), ctrl.getAnalytics);
router.get('/trips/:tripId/budget-summary', validate(tripIdParamSchema, 'params'), ctrl.getBudgetSummary);
router.patch('/trips/:tripId/budget-settings', validate(tripIdParamSchema, 'params'), validate(budgetSettingsSchema), ctrl.updateBudgetSettings);

// ── Expense-scoped endpoints ──
router.get('/expenses/:id', validate(expenseIdParamSchema, 'params'), ctrl.getOne);
router.patch('/expenses/:id', validate(expenseIdParamSchema, 'params'), validate(updateExpenseSchema), ctrl.update);
router.delete('/expenses/:id', validate(expenseIdParamSchema, 'params'), ctrl.remove);
router.patch('/expenses/:id/receipt', validate(expenseIdParamSchema, 'params'), uploadSingle('receipt'), ctrl.uploadReceipt);

export default router;
