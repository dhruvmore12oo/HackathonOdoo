import { z } from 'zod';
import { dateSchema, uuidSchema } from '../../schemas/common.schema';

// ── Create Trip ──
export const createTripSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200).trim(),
  description: z.string().max(2000).trim().optional().nullable(),
  start_date: dateSchema,
  end_date: dateSchema,
  destination_summary: z.string().max(300).trim().optional().nullable(),
  total_budget: z.coerce.number().min(0).optional().default(0),
  tags: z.array(z.string().max(50)).max(10).optional().default([]),
  visibility: z.enum(['private', 'shared', 'public']).optional().default('private'),
  status: z.enum(['upcoming', 'ongoing', 'completed']).optional().default('upcoming'),
}).refine((d) => new Date(d.end_date) >= new Date(d.start_date), {
  message: 'End date must be on or after start date',
  path: ['end_date'],
});

// ── Update Trip ──
export const updateTripSchema = z.object({
  title: z.string().min(3).max(200).trim().optional(),
  description: z.string().max(2000).trim().optional().nullable(),
  start_date: dateSchema.optional(),
  end_date: dateSchema.optional(),
  destination_summary: z.string().max(300).trim().optional().nullable(),
  total_budget: z.coerce.number().min(0).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  visibility: z.enum(['private', 'shared', 'public']).optional(),
  status: z.enum(['upcoming', 'ongoing', 'completed']).optional(),
});

// ── Trip list query ──
export const tripListQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(50).optional().default(12),
  q: z.string().max(100).optional(),
  status: z.enum(['upcoming', 'ongoing', 'completed']).optional(),
  visibility: z.enum(['private', 'shared', 'public']).optional(),
  sortBy: z.enum(['created_at', 'updated_at', 'start_date', 'end_date', 'title', 'total_budget']).optional().default('created_at'),
  sortOrder: z.enum(['ASC', 'DESC']).optional().default('DESC'),
});

// ── ID param ──
export const tripIdParamSchema = z.object({
  id: uuidSchema,
});

export type CreateTripInput = z.infer<typeof createTripSchema>;
export type UpdateTripInput = z.infer<typeof updateTripSchema>;
export type TripListQuery = z.infer<typeof tripListQuerySchema>;
