import { UUID } from '../../types';
import { logger } from '../../config/logger';
import * as repo from './itinerary.repository';
import * as reorder from './itinerary.reorder';
import { assertItineraryTripAccess, assertSectionAccess, assertActivityAccess } from './itinerary.permissions';
import { CreateSectionInput, UpdateSectionInput, CreateActivityInput, UpdateActivityInput } from './itinerary.schema';
import { FullItinerary, SectionRow, ActivityRow, ReorderItem, ActivityMovePayload } from './itinerary.types';

// ══════════════════════════════════════
// ITINERARY
// ══════════════════════════════════════

export async function getFullItinerary(userId: UUID, tripId: UUID): Promise<FullItinerary> {
  await assertItineraryTripAccess(tripId, userId, 'canView');
  return repo.getFullItinerary(tripId);
}

// ══════════════════════════════════════
// SECTIONS
// ══════════════════════════════════════

export async function createSection(userId: UUID, tripId: UUID, data: CreateSectionInput): Promise<SectionRow> {
  await assertItineraryTripAccess(tripId, userId, 'canEdit');
  const section = await repo.createSection(tripId, data);
  logger.info('Section created', { userId, tripId, sectionId: section.id });
  return section;
}

export async function updateSection(userId: UUID, sectionId: UUID, data: UpdateSectionInput): Promise<SectionRow> {
  await assertSectionAccess(sectionId, userId, 'canEdit');
  const section = await repo.updateSection(sectionId, data);
  logger.info('Section updated', { userId, sectionId });
  return section;
}

export async function deleteSection(userId: UUID, sectionId: UUID): Promise<void> {
  const { trip_id } = await assertSectionAccess(sectionId, userId, 'canEdit');
  await repo.deleteSection(sectionId);
  logger.info('Section deleted', { userId, sectionId, tripId: trip_id });
}

export async function reorderSections(userId: UUID, tripId: UUID, items: ReorderItem[]): Promise<FullItinerary> {
  await assertItineraryTripAccess(tripId, userId, 'canEdit');
  await reorder.reorderSections(items);
  logger.info('Sections reordered', { userId, tripId, count: items.length });
  return repo.getFullItinerary(tripId);
}

// ══════════════════════════════════════
// ACTIVITIES
// ══════════════════════════════════════

export async function createActivity(userId: UUID, sectionId: UUID, data: CreateActivityInput): Promise<ActivityRow> {
  await assertSectionAccess(sectionId, userId, 'canEdit');
  const activity = await repo.createActivity(sectionId, data);
  logger.info('Activity created', { userId, sectionId, activityId: activity.id });
  return activity;
}

export async function updateActivity(userId: UUID, activityId: UUID, data: UpdateActivityInput): Promise<ActivityRow> {
  await assertActivityAccess(activityId, userId, 'canEdit');
  const activity = await repo.updateActivity(activityId, data);
  logger.info('Activity updated', { userId, activityId });
  return activity;
}

export async function deleteActivity(userId: UUID, activityId: UUID): Promise<void> {
  const { section_id } = await assertActivityAccess(activityId, userId, 'canEdit');
  await repo.deleteActivity(activityId);
  logger.info('Activity deleted', { userId, activityId, sectionId: section_id });
}

export async function reorderActivities(userId: UUID, tripId: UUID, items: ActivityMovePayload[]): Promise<FullItinerary> {
  await assertItineraryTripAccess(tripId, userId, 'canEdit');
  await reorder.reorderActivities(items);
  logger.info('Activities reordered', { userId, tripId, count: items.length });
  return repo.getFullItinerary(tripId);
}

// ══════════════════════════════════════
// DUPLICATE
// ══════════════════════════════════════

export async function duplicateItinerary(userId: UUID, sourceTripId: UUID, targetTripId: UUID): Promise<FullItinerary> {
  await assertItineraryTripAccess(sourceTripId, userId, 'canView');
  await assertItineraryTripAccess(targetTripId, userId, 'canEdit');
  const result = await repo.duplicateItinerary(sourceTripId, targetTripId);
  logger.info('Itinerary duplicated', { userId, sourceTripId, targetTripId });
  return result;
}
