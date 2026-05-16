import { z } from 'zod';
import { uuidSchema } from '../../schemas/common.schema';

const MANAGEABLE_COLLABORATOR_ROLES = ['editor', 'viewer'] as const;

export const createShareLinkSchema = z.object({
  visibility: z.enum(['public', 'unlisted']).default('public'),
  expires_in_days: z.coerce.number().int().min(1).max(365).optional(),
  password: z.string().min(4).max(50).optional(),
});

export const verifyPasswordSchema = z.object({
  password: z.string().min(1),
});

export const inviteCollaboratorSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  role: z.enum(MANAGEABLE_COLLABORATOR_ROLES).default('viewer'),
});

export const updateCollaboratorSchema = z.object({
  role: z.enum(MANAGEABLE_COLLABORATOR_ROLES),
});

export const publicTripsQuerySchema = z.object({
  q: z.string().optional(),
  tags: z.string().optional(),
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(20),
});

export const tripIdParamSchema = z.object({ tripId: uuidSchema });
export const collaboratorIdParamSchema = z.object({ id: uuidSchema });
export const slugParamSchema = z.object({ slug: z.string().min(1).max(100) });
export const shareIdParamSchema = z.object({ id: uuidSchema });

export type CreateShareLinkInput = z.infer<typeof createShareLinkSchema>;
export type InviteCollaboratorInput = z.infer<typeof inviteCollaboratorSchema>;
export type UpdateCollaboratorInput = z.infer<typeof updateCollaboratorSchema>;
export type PublicTripsQuery = z.infer<typeof publicTripsQuerySchema>;
