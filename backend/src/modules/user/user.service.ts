import { NotFoundError, BadRequestError } from '../../errors';
import { hashPassword, comparePassword } from '../../lib/password';
import { UserPublic, UUID, User } from '../../types';
import * as userRepo from './user.repository';
import * as authRepo from '../auth/auth.repository';
import { UpdateProfileInput } from './user.schema';

function sanitize(user: User): UserPublic {
  const { password_hash, ...pub } = user;
  return pub as UserPublic;
}

export async function updateProfile(userId: UUID, data: UpdateProfileInput): Promise<UserPublic> {
  const user = await userRepo.updateProfile(userId, data);
  return sanitize(user);
}

export async function uploadAvatar(userId: UUID, filename: string): Promise<UserPublic> {
  const photoUrl = `/uploads/${filename}`;
  const user = await userRepo.updateAvatar(userId, photoUrl);
  return sanitize(user);
}

export async function changePassword(
  userId: UUID,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const user = await userRepo.findById(userId);
  if (!user) throw new NotFoundError('User');

  const valid = await comparePassword(currentPassword, user.password_hash);
  if (!valid) throw new BadRequestError('Current password is incorrect');

  const newHash = await hashPassword(newPassword);
  await userRepo.updatePasswordHash(userId, newHash);
  // Revoke all refresh tokens after password change
  await authRepo.revokeAllUserRefreshTokens(userId);
}

export async function deleteAccount(userId: UUID, password: string): Promise<void> {
  const user = await userRepo.findById(userId);
  if (!user) throw new NotFoundError('User');

  const valid = await comparePassword(password, user.password_hash);
  if (!valid) throw new BadRequestError('Password is incorrect');

  await userRepo.deleteUser(userId);
}
