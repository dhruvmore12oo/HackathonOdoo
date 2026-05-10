import { Request, Response } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { AuthenticatedRequest } from '../../types';
import { sendPaginated, sendSuccess, sendNoContent } from '../../lib/response';
import { buildPaginationMeta } from '../../lib/pagination';
import * as notificationService from './notification.service';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const { rows, total } = await notificationService.getUserNotifications(authReq.user!.userId, page, limit);
  sendPaginated(res, rows, buildPaginationMeta(total, page, limit));
});

export const unreadCount = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const count = await notificationService.getUnreadCount(authReq.user!.userId);
  sendSuccess(res, { count });
});

export const markRead = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  await notificationService.markAsRead(req.params.id, authReq.user!.userId);
  sendNoContent(res);
});

export const markAllRead = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  await notificationService.markAllRead(authReq.user!.userId);
  sendNoContent(res);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  await notificationService.remove(req.params.id, authReq.user!.userId);
  sendNoContent(res);
});
