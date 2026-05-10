import { Request, Response } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { sendSuccess, sendCreated, sendNoContent } from '../../lib/response';
import { AuthenticatedRequest } from '../../types';
import * as itineraryService from './itinerary.service';

// ── Full Itinerary ──
export const getItinerary = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const data = await itineraryService.getFullItinerary(authReq.user!.userId, req.params.tripId);
  sendSuccess(res, data);
});

// ── Sections ──
export const createSection = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const section = await itineraryService.createSection(authReq.user!.userId, req.params.tripId, req.body);
  sendCreated(res, section, 'Section created');
});

export const updateSection = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const section = await itineraryService.updateSection(authReq.user!.userId, req.params.id, req.body);
  sendSuccess(res, section, 'Section updated');
});

export const deleteSection = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  await itineraryService.deleteSection(authReq.user!.userId, req.params.id);
  sendNoContent(res);
});

export const reorderSections = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  // tripId extracted from the first item's section lookup or passed via body
  const tripId = req.body.tripId;
  const data = await itineraryService.reorderSections(authReq.user!.userId, tripId, req.body.items);
  sendSuccess(res, data, 'Sections reordered');
});

// ── Activities ──
export const createActivity = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const activity = await itineraryService.createActivity(authReq.user!.userId, req.params.sectionId, req.body);
  sendCreated(res, activity, 'Activity added');
});

export const updateActivity = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const activity = await itineraryService.updateActivity(authReq.user!.userId, req.params.id, req.body);
  sendSuccess(res, activity, 'Activity updated');
});

export const deleteActivity = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  await itineraryService.deleteActivity(authReq.user!.userId, req.params.id);
  sendNoContent(res);
});

export const reorderActivities = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const tripId = req.body.tripId;
  const data = await itineraryService.reorderActivities(authReq.user!.userId, tripId, req.body.items);
  sendSuccess(res, data, 'Activities reordered');
});

// ── Duplicate ──
export const duplicateItinerary = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const { targetTripId } = req.body;
  const data = await itineraryService.duplicateItinerary(authReq.user!.userId, req.params.tripId, targetTripId);
  sendCreated(res, data, 'Itinerary duplicated');
});
