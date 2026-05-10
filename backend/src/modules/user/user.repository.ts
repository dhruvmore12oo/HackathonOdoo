import { queryOne } from '../../lib/db';
import { User, UUID } from '../../types';
import { UpdateProfileInput } from './user.schema';

export async function findById(id: UUID): Promise<User | null> {
  return queryOne<User>('SELECT * FROM users WHERE id = $1', [id]);
}

export async function updateProfile(id: UUID, data: UpdateProfileInput): Promise<User> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (data.first_name !== undefined) { fields.push(`first_name = $${idx++}`); values.push(data.first_name); }
  if (data.last_name !== undefined) { fields.push(`last_name = $${idx++}`); values.push(data.last_name); }
  if (data.phone !== undefined) { fields.push(`phone = $${idx++}`); values.push(data.phone); }
  if (data.city !== undefined) { fields.push(`city = $${idx++}`); values.push(data.city); }
  if (data.country !== undefined) { fields.push(`country = $${idx++}`); values.push(data.country); }
  if (data.bio !== undefined) { fields.push(`bio = $${idx++}`); values.push(data.bio); }

  if (fields.length === 0) {
    const user = await findById(id);
    return user!;
  }

  values.push(id);
  const result = await queryOne<User>(
    `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );
  return result!;
}

export async function updateAvatar(id: UUID, photoUrl: string): Promise<User> {
  const result = await queryOne<User>(
    'UPDATE users SET profile_photo_url = $1 WHERE id = $2 RETURNING *',
    [photoUrl, id]
  );
  return result!;
}

export async function updatePasswordHash(id: UUID, passwordHash: string): Promise<void> {
  await queryOne(
    'UPDATE users SET password_hash = $1, password_changed_at = NOW() WHERE id = $2',
    [passwordHash, id]
  );
}

export async function deleteUser(id: UUID): Promise<void> {
  await queryOne('DELETE FROM users WHERE id = $1', [id]);
}
