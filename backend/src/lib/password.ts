import bcrypt from 'bcryptjs';
import { env } from '../config/env';

/**
 * Hash a plain-text password.
 */
export async function hashPassword(plainText: string): Promise<string> {
  return bcrypt.hash(plainText, env.BCRYPT_SALT_ROUNDS);
}

/**
 * Compare plain-text password with a hash.
 */
export async function comparePassword(
  plainText: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plainText, hash);
}
