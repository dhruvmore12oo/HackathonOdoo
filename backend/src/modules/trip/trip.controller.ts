import { Request, Response } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { sendSuccess, sendCreated, sendNoContent, sendPaginated } from '../../lib/response';
import { buildPaginationMeta } from '../../lib/pagination';
import { AuthenticatedRequest } from '../../types';
import * as tripService from './trip.service';

export const create = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const trip = await tripService.createTrip(authReq.user!.userId, req.body);
  sendCreated(res, trip, 'Trip created');
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const trip = await tripService.updateTrip(authReq.user!.userId, req.params.id, req.body);
  sendSuccess(res, trip, 'Trip updated');
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const trip = await tripService.getTrip(authReq.user!.userId, req.params.id);
  sendSuccess(res, trip);
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const filters = req.query as unknown as {
    page?: number; limit?: number; q?: string;
    status?: string; visibility?: string;
    sortBy?: string; sortOrder?: 'ASC' | 'DESC';
  };
  const { rows, total } = await tripService.getMyTrips(authReq.user!.userId, filters as Parameters<typeof tripService.getMyTrips>[1]);
  const pagination = buildPaginationMeta(total, filters.page ?? 1, filters.limit ?? 12);
  sendPaginated(res, rows, pagination);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  await tripService.softDeleteTrip(authReq.user!.userId, req.params.id);
  sendNoContent(res);
});

export const archiveTrip = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const trip = await tripService.archiveTrip(authReq.user!.userId, req.params.id);
  sendSuccess(res, trip, 'Trip archived');
});

export const restoreTrip = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const trip = await tripService.restoreTrip(authReq.user!.userId, req.params.id);
  sendSuccess(res, trip, 'Trip restored');
});

export const duplicate = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const trip = await tripService.duplicateTrip(authReq.user!.userId, req.params.id);
  sendCreated(res, trip, 'Trip duplicated');
});

export const uploadCover = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  if (!req.file) {
    res.status(400).json({ success: false, error: { code: 'NO_FILE', message: 'No file uploaded' } });
    return;
  }
  const trip = await tripService.uploadCover(authReq.user!.userId, req.params.id, req.file.filename);
  sendSuccess(res, trip, 'Cover image updated');
});

export const stats = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const data = await tripService.getStats(authReq.user!.userId);
  sendSuccess(res, data);
});
