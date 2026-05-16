import { UUID } from '../../types';
import { NotFoundError } from '../../errors';
import { logger } from '../../config/logger';
import { assertTripOwnership } from './trip.permissions';
import { assertTripAccess } from '../share/share.permissions';
import * as tripRepo from './trip.repository';
import { CreateTripInput, UpdateTripInput, TripListQuery } from './trip.schema';

export async function createTrip(userId: UUID, data: CreateTripInput) {
  const trip = await tripRepo.createTrip(userId, data);
  logger.info('Trip created', { userId, tripId: trip.id, title: trip.title });
  return trip;
}

export async function updateTrip(userId: UUID, tripId: UUID, data: UpdateTripInput) {
  const role = await assertTripAccess(tripId, userId, 'canEdit');
  const trip = await tripRepo.updateTrip(tripId, data);
  logger.info('Trip updated', { userId, tripId });
  return { ...trip, current_user_role: role };
}

export async function getTrip(userId: UUID, tripId: UUID) {
  await assertTripAccess(tripId, userId, 'canView');
  const trip = await tripRepo.findAccessibleById(tripId, userId);
  if (!trip) throw new NotFoundError('Trip');
  return trip;
}

export async function getMyTrips(userId: UUID, filters: TripListQuery) {
  return tripRepo.findByUser(userId, filters);
}

export async function softDeleteTrip(userId: UUID, tripId: UUID) {
  await assertTripOwnership(tripId, userId);
  await tripRepo.softDelete(tripId);
  logger.info('Trip soft-deleted', { userId, tripId });
}

export async function archiveTrip(userId: UUID, tripId: UUID) {
  await assertTripOwnership(tripId, userId);
  const trip = await tripRepo.archive(tripId);
  logger.info('Trip archived', { userId, tripId });
  return trip;
}

export async function restoreTrip(userId: UUID, tripId: UUID) {
  // Check on raw record (may be deleted or archived)
  const raw = await tripRepo.findByIdIncludeDeleted(tripId);
  if (!raw) throw new NotFoundError('Trip');
  if (raw.user_id !== userId) throw new NotFoundError('Trip');
  const trip = await tripRepo.restore(tripId);
  logger.info('Trip restored', { userId, tripId });
  return trip;
}

export async function duplicateTrip(userId: UUID, tripId: UUID) {
  await assertTripOwnership(tripId, userId);
  const trip = await tripRepo.duplicateTrip(tripId, userId);
  logger.info('Trip duplicated', { userId, originalId: tripId, newId: trip.id });
  return trip;
}

export async function uploadCover(userId: UUID, tripId: UUID, filename: string) {
  const role = await assertTripAccess(tripId, userId, 'canEdit');
  const coverUrl = `/uploads/${filename}`;
  const trip = await tripRepo.updateCoverImage(tripId, coverUrl);
  logger.info('Trip cover updated', { userId, tripId });
  return { ...trip, current_user_role: role };
}

export async function getStats(userId: UUID) {
  return tripRepo.getTripStats(userId);
}
