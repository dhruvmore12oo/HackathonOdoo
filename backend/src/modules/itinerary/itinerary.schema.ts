import { z } from 'zod';
import { uuidSchema } from '../../schemas/common.schema';
import { SECTION_TYPES, ACTIVITY_STATUSES } from './itinerary.constants';

// ── Section Schemas ──

export const createSectionSchema = z.object({
  title: z.string().min(1).max(150).trim(),
  description: z.string().max(2000).trim().optional().nullable(),
  day_number: z.coerce.number().int().positive(),
  section_type: z.enum(SECTION_TYPES).optional().default('custom'),
  budget: z.coerce.number().min(0).optional().default(0),
  notes: z.string().max(5000).trim().optional().nullable(),
  sort_order: z.coerce.number().int().optional(),
});

export const updateSectionSchema = z.object({
  title: z.string().min(1).max(150).trim().optional(),
  description: z.string().max(2000).trim().optional().nullable(),
  day_number: z.coerce.number().int().positive().optional(),
  section_type: z.enum(SECTION_TYPES).optional(),
  budget: z.coerce.number().min(0).optional(),
  notes: z.string().max(5000).trim().optional().nullable(),
});

export const reorderSectionsSchema = z.object({
  items: z.array(z.object({
    id: uuidSchema,
    sort_order: z.coerce.number().int(),
  })).min(1),
});

// ── Activity Schemas ──

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const createActivitySchema = z.object({
  name: z.string().min(1).max(200).trim(),
  title: z.string().max(200).trim().optional().nullable(),
  description: z.string().max(5000).trim().optional().nullable(),
  type: z.string().max(50).trim().optional().nullable(),
  location_name: z.string().max(300).trim().optional().nullable(),
  latitude: z.coerce.number().min(-90).max(90).optional().nullable(),
  longitude: z.coerce.number().min(-180).max(180).optional().nullable(),
  address: z.string().max(500).trim().optional().nullable(),
  start_time: z.string().regex(timeRegex, 'Time must be HH:MM').optional().nullable(),
  end_time: z.string().regex(timeRegex, 'Time must be HH:MM').optional().nullable(),
  estimated_duration_minutes: z.coerce.number().int().min(0).max(1440).optional().nullable(),
  estimated_cost: z.coerce.number().min(0).optional().default(0),
  currency: z.string().length(3).optional().default('INR'),
  status: z.enum(ACTIVITY_STATUSES).optional().default('planned'),
  notes: z.string().max(5000).trim().optional().nullable(),
  tips: z.string().max(5000).trim().optional().nullable(),
  sort_order: z.coerce.number().int().optional(),
});

export const updateActivitySchema = z.object({
  name: z.string().min(1).max(200).trim().optional(),
  title: z.string().max(200).trim().optional().nullable(),
  description: z.string().max(5000).trim().optional().nullable(),
  type: z.string().max(50).trim().optional().nullable(),
  location_name: z.string().max(300).trim().optional().nullable(),
  latitude: z.coerce.number().min(-90).max(90).optional().nullable(),
  longitude: z.coerce.number().min(-180).max(180).optional().nullable(),
  address: z.string().max(500).trim().optional().nullable(),
  start_time: z.string().regex(timeRegex, 'Time must be HH:MM').optional().nullable(),
  end_time: z.string().regex(timeRegex, 'Time must be HH:MM').optional().nullable(),
  estimated_duration_minutes: z.coerce.number().int().min(0).max(1440).optional().nullable(),
  estimated_cost: z.coerce.number().min(0).optional(),
  currency: z.string().length(3).optional(),
  status: z.enum(ACTIVITY_STATUSES).optional(),
  notes: z.string().max(5000).trim().optional().nullable(),
  tips: z.string().max(5000).trim().optional().nullable(),
});

export const reorderActivitiesSchema = z.object({
  items: z.array(z.object({
    id: uuidSchema,
    sort_order: z.coerce.number().int(),
    section_id: uuidSchema.optional(), // for cross-section moves
  })).min(1),
});

// ── Param Schemas ──
export const tripIdParamSchema = z.object({ tripId: uuidSchema });
export const sectionIdParamSchema = z.object({ id: uuidSchema });
export const activityIdParamSchema = z.object({ id: uuidSchema });
export const sectionIdForActivitySchema = z.object({ sectionId: uuidSchema });

// ── Inferred types ──
export type CreateSectionInput = z.infer<typeof createSectionSchema>;
export type UpdateSectionInput = z.infer<typeof updateSectionSchema>;
export type CreateActivityInput = z.infer<typeof createActivitySchema>;
export type UpdateActivityInput = z.infer<typeof updateActivitySchema>;
