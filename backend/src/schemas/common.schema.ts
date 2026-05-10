import { z } from 'zod';

// ── Reusable field schemas ──
export const uuidSchema = z.string().uuid();

export const emailSchema = z.string().email('Invalid email address').max(255);

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be at most 128 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[!@#$%^&*(),.?":{}|<>_\-+=~`[\]\\\/]/, 'Password must contain at least one special character');

export const nameSchema = z.string().min(1).max(80).trim();

export const phoneSchema = z
  .string()
  .max(20)
  .regex(/^\+?[0-9\s\-()]+$/, 'Invalid phone number')
  .optional()
  .nullable();

export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format');

export const costIndexSchema = z.enum(['budget', 'mid', 'luxury']);

export const expenseCategorySchema = z.enum([
  'lodging', 'flights', 'activities', 'food', 'transport', 'misc',
]);

export const packingCategorySchema = z.enum([
  'documents', 'clothing', 'electronics', 'toiletries', 'misc',
]);

export const tripStatusSchema = z.enum(['upcoming', 'ongoing', 'completed']);

export const userRoleSchema = z.enum(['user', 'admin']);

// ── Pagination query schema ──
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(50).optional().default(20),
});

// ── Sort query schema ──
export const sortQuerySchema = z.object({
  sortBy: z.string().optional().default('created_at'),
  sortOrder: z.enum(['ASC', 'DESC']).optional().default('DESC'),
});

// ── Search query schema ──
export const searchQuerySchema = z.object({
  q: z.string().min(2).max(100).optional(),
});

// ── UUID params schema ──
export const idParamSchema = z.object({
  id: uuidSchema,
});

export const slugParamSchema = z.object({
  slug: z.string().min(1).max(50),
});
