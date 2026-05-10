import { Request, Response } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { sendSuccess, sendCreated, sendNoContent, sendPaginated } from '../../lib/response';
import { buildPaginationMeta } from '../../lib/pagination';
import { AuthenticatedRequest } from '../../types';
import * as expenseService from './expense.service';

export const create = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const expense = await expenseService.createExpense(authReq.user!.userId, req.params.tripId, req.body);
  sendCreated(res, expense, 'Expense created');
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const expense = await expenseService.updateExpense(authReq.user!.userId, req.params.id, req.body);
  sendSuccess(res, expense, 'Expense updated');
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  await expenseService.deleteExpense(authReq.user!.userId, req.params.id);
  sendNoContent(res);
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const expense = await expenseService.getExpense(authReq.user!.userId, req.params.id);
  sendSuccess(res, expense);
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const filters = req.query as unknown as Parameters<typeof expenseService.listExpenses>[2];
  const { rows, total } = await expenseService.listExpenses(authReq.user!.userId, req.params.tripId, filters);
  const pagination = buildPaginationMeta(total, Number(filters.page) || 1, Number(filters.limit) || 50);
  sendPaginated(res, rows, pagination);
});

export const getAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const data = await expenseService.getAnalytics(authReq.user!.userId, req.params.tripId);
  sendSuccess(res, data);
});

export const getBudgetSummary = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const data = await expenseService.getBudgetSummary(authReq.user!.userId, req.params.tripId);
  sendSuccess(res, data);
});

export const uploadReceipt = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  if (!req.file) {
    res.status(400).json({ success: false, error: { code: 'NO_FILE', message: 'No receipt file uploaded' } });
    return;
  }
  const expense = await expenseService.uploadReceipt(authReq.user!.userId, req.params.id, req.file.filename);
  sendSuccess(res, expense, 'Receipt uploaded');
});

export const updateBudgetSettings = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const settings = await expenseService.updateBudgetSettings(authReq.user!.userId, req.params.tripId, req.body);
  sendSuccess(res, settings, 'Budget settings updated');
});
