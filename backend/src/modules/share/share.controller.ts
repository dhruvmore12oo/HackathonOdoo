import { Request, Response } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { sendSuccess, sendCreated, sendNoContent, sendPaginated } from '../../lib/response';
import { buildPaginationMeta } from '../../lib/pagination';
import { AuthenticatedRequest } from '../../types';
import * as shareService from './share.service';
import { UUID } from '../../types';

// ── Share Links ──

export const createShareLink = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = (req as AuthenticatedRequest).user!;
  const link = await shareService.createShareLink(userId, req.params.tripId as UUID, req.body);
  sendCreated(res, link, 'Share link created');
});

export const revokeShareLink = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = (req as AuthenticatedRequest).user!;
  await shareService.revokeShareLink(userId, req.params.id as UUID);
  sendNoContent(res);
});

export const regenerateShareLink = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = (req as AuthenticatedRequest).user!;
  const link = await shareService.regenerateShareLink(userId, req.params.id as UUID);
  sendSuccess(res, link, 'Share link regenerated');
});

export const getShareLinks = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = (req as AuthenticatedRequest).user!;
  const links = await shareService.getShareLinks(userId, req.params.tripId as UUID);
  sendSuccess(res, links);
});

// ── Public View ──

export const getPublicTrip = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const viewerId = authReq.user?.userId as UUID | undefined;
  const ipHash = req.ip ?? undefined;
  const userAgent = req.headers['user-agent'] ?? undefined;
  const password = (req.query.password as string) ?? undefined;

  const trip = await shareService.getPublicTrip(
    req.params.slug, password, viewerId,
    ipHash, userAgent
  );
  sendSuccess(res, trip);
});

export const verifyPassword = asyncHandler(async (req: Request, res: Response) => {
  const { password } = req.body as { password: string };
  const authReq = req as AuthenticatedRequest;
  const trip = await shareService.getPublicTrip(
    req.params.slug, password,
    authReq.user?.userId as UUID | undefined,
    req.ip ?? undefined, req.headers['user-agent'] ?? undefined
  );
  sendSuccess(res, trip, 'Access granted');
});

// ── Collaborators ──

export const inviteCollaborator = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = (req as AuthenticatedRequest).user!;
  const collab = await shareService.inviteCollaborator(userId, req.params.tripId as UUID, req.body);
  sendCreated(res, collab, 'Collaborator invited');
});

export const acceptInvitation = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = (req as AuthenticatedRequest).user!;
  const collab = await shareService.acceptInvitation(userId, req.params.tripId as UUID);
  sendSuccess(res, collab, 'Invitation accepted');
});

export const updateCollaborator = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = (req as AuthenticatedRequest).user!;
  const collab = await shareService.updateCollaborator(userId, req.params.id as UUID, req.body);
  sendSuccess(res, collab, 'Collaborator updated');
});

export const removeCollaborator = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = (req as AuthenticatedRequest).user!;
  await shareService.removeCollaborator(userId, req.params.id as UUID);
  sendNoContent(res);
});

export const listCollaborators = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = (req as AuthenticatedRequest).user!;
  const collabs = await shareService.listCollaborators(userId, req.params.tripId as UUID);
  sendSuccess(res, collabs);
});

// ── Activity Feed ──

export const getActivityFeed = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = (req as AuthenticatedRequest).user!;
  const feed = await shareService.getActivityFeed(userId, req.params.tripId as UUID);
  sendSuccess(res, feed);
});

// ── My Invitations ──

export const getMyInvitations = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = (req as AuthenticatedRequest).user!;
  const invitations = await shareService.getMyInvitations(userId);
  sendSuccess(res, invitations);
});

export const declineInvitation = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = (req as AuthenticatedRequest).user!;
  await shareService.declineInvitation(userId, req.params.tripId as UUID);
  sendNoContent(res);
});

// ── Community ──

export const getPublicTrips = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as Parameters<typeof shareService.getPublicTrips>[0];
  const { rows, total } = await shareService.getPublicTrips(query);
  const pagination = buildPaginationMeta(total, Number(query.page) || 1, Number(query.limit) || 20);
  sendPaginated(res, rows, pagination);
});
