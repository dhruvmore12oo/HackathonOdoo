import { ConflictError, InvalidCredentialsError, NotFoundError, BadRequestError, TokenExpiredError } from '../../errors';
import { hashPassword, comparePassword } from '../../lib/password';
import { generateTokens, verifyRefreshToken, generateRandomToken, hashToken } from '../../lib/token';
import { AuthTokens, TokenPayload, UserPublic, UUID, User } from '../../types';
import * as authRepo from './auth.repository';
import { RegisterInput, LoginInput } from './auth.schema';
import { logger } from '../../config/logger';

function sanitizeUser(user: User): UserPublic {
  const { password_hash, ...publicUser } = user;
  return publicUser as UserPublic;
}

export async function register(data: RegisterInput): Promise<{ user: UserPublic; tokens: AuthTokens }> {
  const existing = await authRepo.findUserByEmail(data.email);
  if (existing) {
    throw new ConflictError('An account with this email already exists');
  }

  const password_hash = await hashPassword(data.password);
  const user = await authRepo.createUser({
    first_name: data.first_name,
    last_name: data.last_name,
    email: data.email,
    password_hash,
    phone: data.phone,
    city: data.city,
    country: data.country,
  });

  const payload: TokenPayload = { userId: user.id, email: user.email, role: user.role };
  const tokens = generateTokens(payload);

  // Store refresh token hash
  await authRepo.storeRefreshToken({
    user_id: user.id,
    token_hash: hashToken(tokens.refreshToken),
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  logger.info('User registered', { userId: user.id, email: user.email });
  return { user: sanitizeUser(user), tokens };
}

export async function login(
  data: LoginInput,
  meta?: { ip?: string; userAgent?: string }
): Promise<{ user: UserPublic; tokens: AuthTokens }> {
  const user = await authRepo.findUserByEmail(data.email);
  if (!user) {
    throw new InvalidCredentialsError();
  }

  const valid = await comparePassword(data.password, user.password_hash);
  if (!valid) {
    logger.warn('Failed login attempt', { email: data.email, ip: meta?.ip });
    throw new InvalidCredentialsError();
  }

  const payload: TokenPayload = { userId: user.id, email: user.email, role: user.role };
  const tokens = generateTokens(payload);

  await authRepo.storeRefreshToken({
    user_id: user.id,
    token_hash: hashToken(tokens.refreshToken),
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    ip_address: meta?.ip,
    user_agent: meta?.userAgent,
  });

  await authRepo.updateLastLogin(user.id);
  logger.info('User logged in', { userId: user.id });
  return { user: sanitizeUser(user), tokens };
}

export async function refresh(
  oldRefreshToken: string,
  meta?: { ip?: string; userAgent?: string }
): Promise<{ tokens: AuthTokens }> {
  let decoded: TokenPayload;
  try {
    decoded = verifyRefreshToken(oldRefreshToken);
  } catch {
    throw new TokenExpiredError('Invalid or expired refresh token');
  }

  const tokenHash = hashToken(oldRefreshToken);
  const storedToken = await authRepo.findRefreshToken(tokenHash);

  if (!storedToken || storedToken.revoked_at) {
    // Possible token reuse — revoke ALL user tokens (security measure)
    if (decoded.userId) {
      await authRepo.revokeAllUserRefreshTokens(decoded.userId);
    }
    throw new TokenExpiredError('Refresh token has been revoked');
  }

  if (new Date(storedToken.expires_at) < new Date()) {
    throw new TokenExpiredError('Refresh token has expired');
  }

  // Revoke old token (token rotation)
  await authRepo.revokeRefreshToken(tokenHash);

  const user = await authRepo.findUserById(decoded.userId);
  if (!user) {
    throw new NotFoundError('User');
  }

  const payload: TokenPayload = { userId: user.id, email: user.email, role: user.role };
  const tokens = generateTokens(payload);

  await authRepo.storeRefreshToken({
    user_id: user.id,
    token_hash: hashToken(tokens.refreshToken),
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    ip_address: meta?.ip,
    user_agent: meta?.userAgent,
  });

  return { tokens };
}

export async function logout(refreshToken: string): Promise<void> {
  if (refreshToken) {
    await authRepo.revokeRefreshToken(hashToken(refreshToken));
  }
}

export async function getMe(userId: UUID): Promise<UserPublic> {
  const user = await authRepo.findUserById(userId);
  if (!user) {
    throw new NotFoundError('User');
  }
  return sanitizeUser(user);
}

export async function forgotPassword(email: string): Promise<void> {
  const user = await authRepo.findUserByEmail(email);
  // Always return success to prevent user enumeration
  if (!user) {
    logger.info('Password reset requested for non-existent email', { email });
    return;
  }

  const plainToken = generateRandomToken();
  const tokenHash = hashToken(plainToken);

  await authRepo.storePasswordResetToken({
    user_id: user.id,
    token_hash: tokenHash,
    expires_at: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
  });

  // In production, send email with reset link containing plainToken
  // For hackathon, log the token
  logger.info('Password reset token generated', { userId: user.id, token: plainToken });
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const tokenHash = hashToken(token);
  const resetToken = await authRepo.findPasswordResetToken(tokenHash);

  if (!resetToken) {
    throw new BadRequestError('Invalid or expired reset token');
  }

  if (resetToken.used_at) {
    throw new BadRequestError('Reset token has already been used');
  }

  if (new Date(resetToken.expires_at) < new Date()) {
    throw new TokenExpiredError('Reset token has expired');
  }

  const newHash = await hashPassword(newPassword);
  await authRepo.updatePassword(resetToken.user_id, newHash);
  await authRepo.markPasswordResetUsed(tokenHash);
  // Revoke all refresh tokens for security
  await authRepo.revokeAllUserRefreshTokens(resetToken.user_id);

  logger.info('Password reset completed', { userId: resetToken.user_id });
}
