import { z } from 'zod';
import { nameSchema, phoneSchema, passwordSchema } from '../../schemas/common.schema';

export const updateProfileSchema = z.object({
  first_name: nameSchema.optional(),
  last_name: nameSchema.optional(),
  phone: phoneSchema,
  city: z.string().max(100).trim().optional().nullable(),
  country: z.string().max(100).trim().optional().nullable(),
  bio: z.string().max(500).trim().optional().nullable(),
});

export const changePasswordSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: passwordSchema,
}).refine((data) => data.current_password !== data.new_password, {
  message: 'New password must be different from current password',
  path: ['new_password'],
});

export const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Password is required for account deletion'),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;
