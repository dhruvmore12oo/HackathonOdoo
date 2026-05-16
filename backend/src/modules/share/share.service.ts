import { UUID } from '../../types';
import { logger } from '../../config/logger';
import { NotFoundError, ForbiddenError } from '../../errors';
import * as repo from './share.repository';
import { assertTripAccess } from './share.permissions';
import {
  CreateShareLinkInput, InviteCollaboratorInput, UpdateCollaboratorInput, PublicTripsQuery,
} from './share.schema';
import { FEED_ACTIONS } from './share.constants';
import {
  ShareLinkRow, CollaboratorRow, ActivityFeedRow, PublicTripData,
} from './share.types';

// ── Share Links ──

export async function createShareLink(
  userId: UUID, tripId: UUID, data: CreateShareLinkInput
): Promise<ShareLinkRow> {
  await assertTripAccess(tripId, userId, 'canManageShare');
  const link = await repo.createShareLink(tripId, userId, data);
  await repo.logActivity(tripId, userId, FEED_ACTIONS.TRIP_SHARED, { slug: link.slug });
  logger.info('Share link created', { userId, tripId, slug: link.slug });
  return link;
}

export async function revokeShareLink(userId: UUID, linkId: UUID): Promise<void> {
  const link = await repo.getShareLinkById(linkId);
  if (!link) throw new NotFoundError('Share link');
  await assertTripAccess(link.trip_id, userId, 'canManageShare');
  await repo.revokeShareLink(linkId);
  logger.info('Share link revoked', { userId, linkId, tripId: link.trip_id });
}

export async function regenerateShareLink(
  userId: UUID, linkId: UUID
): Promise<ShareLinkRow> {
  const link = await repo.getShareLinkById(linkId);
  if (!link) throw new NotFoundError('Share link');
  await assertTripAccess(link.trip_id, userId, 'canManageShare');
  return repo.regenerateShareLink(linkId, link.trip_id);
}

export async function getShareLinks(userId: UUID, tripId: UUID): Promise<ShareLinkRow[]> {
  await assertTripAccess(tripId, userId, 'canManageShare');
  return repo.getShareLinksByTrip(tripId);
}

// ── Public View ──

export async function getPublicTrip(
  slug: string,
  password?: string,
  viewerId?: UUID,
  ipHash?: string,
  userAgent?: string
): Promise<PublicTripData> {
  const link = await repo.getShareLinkBySlug(slug);
  if (!link) throw new NotFoundError('Share link');

  // Fetch the trip first to check its visibility
  const trip = await repo.getPublicTripBySlug(slug);
  if (!trip) throw new NotFoundError('Trip');

  // Only enforce expiry for non-public trips — public trips are always viewable
  const isPublicTrip = await import('../../lib/db').then(db =>
    db.queryOne<{ visibility: string }>('SELECT visibility FROM trips WHERE id = $1', [link.trip_id])
  );
  const tripIsPublic = isPublicTrip?.visibility === 'public';

  if (!tripIsPublic && link.expires_at && link.expires_at < new Date()) {
    throw new ForbiddenError('This share link has expired');
  }
  if (link.password_hash && !tripIsPublic) {
    if (!password || !repo.verifySharePassword(link.password_hash, password)) {
      throw new ForbiddenError('Invalid password');
    }
  }

  // Record view (fire-and-forget)
  repo.recordView(trip.id, viewerId ?? null, ipHash ?? null, userAgent ?? null).catch(() => {});

  return trip;
}

// ── Collaborators ──

export async function inviteCollaborator(
  userId: UUID, tripId: UUID, data: InviteCollaboratorInput
): Promise<CollaboratorRow> {
  await assertTripAccess(tripId, userId, 'canManageCollaborators');

  // Resolve email to user_id
  const targetUser = await import('../../lib/db').then(db =>
    db.queryOne<{ id: UUID }>('SELECT id FROM users WHERE email = $1', [data.email])
  );
  if (!targetUser) throw new NotFoundError('User with that email');
  if (targetUser.id === userId) throw new ForbiddenError('Cannot invite yourself');

  const collab = await repo.inviteCollaborator(tripId, userId, { user_id: targetUser.id, role: data.role });
  await repo.logActivity(tripId, userId, FEED_ACTIONS.COLLABORATOR_INVITED, {
    invitedUserId: targetUser.id, role: data.role,
  });
  logger.info('Collaborator invited', { userId, tripId, invitedUserId: targetUser.id });
  return collab;
}

export async function acceptInvitation(userId: UUID, tripId: UUID): Promise<CollaboratorRow> {
  const collab = await repo.acceptInvitation(tripId, userId);
  if (!collab) throw new NotFoundError('Invitation');
  await repo.logActivity(tripId, userId, FEED_ACTIONS.COLLABORATOR_ACCEPTED, {});
  return collab;
}

export async function updateCollaborator(
  userId: UUID, collaboratorId: UUID, data: UpdateCollaboratorInput
): Promise<CollaboratorRow> {
  const collab = await repo.getCollaboratorById(collaboratorId);
  if (!collab) throw new NotFoundError('Collaborator');
  await assertTripAccess(collab.trip_id, userId, 'canManageCollaborators');
  const updated = await repo.updateCollaboratorRole(collaboratorId, data.role);
  if (!updated) throw new NotFoundError('Collaborator');
  await repo.logActivity(collab.trip_id, userId, FEED_ACTIONS.COLLABORATOR_ROLE_CHANGED, {
    collaboratorId, newRole: data.role,
  });
  return updated;
}

export async function removeCollaborator(
  userId: UUID, collaboratorId: UUID
): Promise<void> {
  const collab = await repo.getCollaboratorById(collaboratorId);
  if (!collab) throw new NotFoundError('Collaborator');
  await assertTripAccess(collab.trip_id, userId, 'canManageCollaborators');
  await repo.removeCollaborator(collaboratorId);
  await repo.logActivity(collab.trip_id, userId, FEED_ACTIONS.COLLABORATOR_REMOVED, { collaboratorId });
}

export async function listCollaborators(userId: UUID, tripId: UUID): Promise<CollaboratorRow[]> {
  await assertTripAccess(tripId, userId, 'canView');
  return repo.getCollaboratorsByTrip(tripId);
}

// ── Activity Feed ──

export async function getActivityFeed(userId: UUID, tripId: UUID): Promise<ActivityFeedRow[]> {
  await assertTripAccess(tripId, userId, 'canView');
  return repo.getActivityFeed(tripId, 30);
}

// ── My Invitations ──

export async function getMyInvitations(userId: UUID) {
  return repo.getPendingInvitationsByUser(userId);
}

export async function declineInvitation(userId: UUID, tripId: UUID): Promise<void> {
  await repo.declineInvitation(tripId, userId);
  logger.info('Invitation declined', { userId, tripId });
}

// ── Community ──

export async function getPublicTrips(query: PublicTripsQuery) {
  return repo.getPublicTrips(query.q, query.tags, query.page, query.limit);
}
