import { query, queryOne, queryMany } from '../../lib/db';
import { User, UUID } from '../../types';

// ── User queries for auth ──

export async function findUserByEmail(email: string): Promise<User | null> {
  return queryOne<User>(
    'SELECT * FROM users WHERE email = $1',
    [email.toLowerCase()]
  );
}

export async function findUserById(id: UUID): Promise<User | null> {
  return queryOne<User>('SELECT * FROM users WHERE id = $1', [id]);
}

export async function createUser(data: {
  first_name: string;
  last_name: string;
  email: string;
  password_hash: string;
  phone?: string | null;
  city?: string;
  country?: string;
}): Promise<User> {
  const result = await queryOne<User>(
    `INSERT INTO users (first_name, last_name, email, password_hash, phone, city, country)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [data.first_name, data.last_name, data.email.toLowerCase(), data.password_hash, data.phone || null, data.city || null, data.country || null]
  );
  return result!;
}

export async function updateLastLogin(userId: UUID): Promise<void> {
  await query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [userId]);
}

export async function updatePassword(userId: UUID, passwordHash: string): Promise<void> {
  await query(
    'UPDATE users SET password_hash = $1, password_changed_at = NOW() WHERE id = $2',
    [passwordHash, userId]
  );
}

export async function verifyUserEmail(userId: UUID): Promise<void> {
  await query('UPDATE users SET email_verified = true WHERE id = $1', [userId]);
}

// ── Refresh Tokens ──

export async function storeRefreshToken(data: {
  user_id: UUID;
  token_hash: string;
  expires_at: Date;
  ip_address?: string;
  user_agent?: string;
}): Promise<void> {
  await query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5)`,
    [data.user_id, data.token_hash, data.expires_at, data.ip_address || null, data.user_agent || null]
  );
}

export async function findRefreshToken(tokenHash: string): Promise<{
  id: UUID; user_id: UUID; token_hash: string; expires_at: Date; revoked_at: Date | null;
} | null> {
  return queryOne(
    'SELECT id, user_id, token_hash, expires_at, revoked_at FROM refresh_tokens WHERE token_hash = $1',
    [tokenHash]
  );
}

export async function revokeRefreshToken(tokenHash: string): Promise<void> {
  await query('UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = $1', [tokenHash]);
}

export async function revokeAllUserRefreshTokens(userId: UUID): Promise<void> {
  await query(
    'UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL',
    [userId]
  );
}

// ── Password Reset Tokens ──

export async function storePasswordResetToken(data: {
  user_id: UUID;
  token_hash: string;
  expires_at: Date;
}): Promise<void> {
  // Invalidate existing unused tokens first
  await query(
    'UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL',
    [data.user_id]
  );
  await query(
    'INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
    [data.user_id, data.token_hash, data.expires_at]
  );
}

export async function findPasswordResetToken(tokenHash: string): Promise<{
  id: UUID; user_id: UUID; expires_at: Date; used_at: Date | null;
} | null> {
  return queryOne(
    'SELECT id, user_id, expires_at, used_at FROM password_reset_tokens WHERE token_hash = $1',
    [tokenHash]
  );
}

export async function markPasswordResetUsed(tokenHash: string): Promise<void> {
  await query('UPDATE password_reset_tokens SET used_at = NOW() WHERE token_hash = $1', [tokenHash]);
}

// ── Delete user ──

export async function deleteUser(userId: UUID): Promise<void> {
  await query('DELETE FROM users WHERE id = $1', [userId]);
}
