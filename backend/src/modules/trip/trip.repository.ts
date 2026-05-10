import { query, queryOne, queryMany, withTransaction } from '../../lib/db';
import { UUID } from '../../types';
import { CreateTripInput, UpdateTripInput, TripListQuery } from './trip.schema';
import { TRIP_SORTABLE_FIELDS, DEFAULT_TRIP_SORT, DEFAULT_TRIP_ORDER } from './trip.constants';
import { generateSlug } from '../../utils';

export interface TripRow {
  id: UUID;
  user_id: UUID;
  title: string;
  name: string;
  description: string | null;
  start_date: string;
  end_date: string;
  cover_photo_url: string | null;
  status: string;
  visibility: string;
  is_public: boolean;
  share_slug: string | null;
  total_budget: number;
  destination_summary: string | null;
  tags: string[];
  deleted_at: Date | null;
  archived_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

interface CountRow {
  count: string;
}

// ── Create ──

export async function createTrip(userId: UUID, data: CreateTripInput): Promise<TripRow> {
  const slug = generateSlug(12);
  const result = await queryOne<TripRow>(
    `INSERT INTO trips (user_id, title, name, description, start_date, end_date,
       total_budget, tags, visibility, status, destination_summary, share_slug, is_public)
     VALUES ($1, $2, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING *`,
    [
      userId, data.title, data.description || null,
      data.start_date, data.end_date,
      data.total_budget ?? 0, data.tags ?? [],
      data.visibility ?? 'private', data.status ?? 'upcoming',
      data.destination_summary || null, slug,
      data.visibility === 'public',
    ]
  );
  return result!;
}

// ── Update ──

export async function updateTrip(tripId: UUID, data: UpdateTripInput): Promise<TripRow> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (data.title !== undefined) { fields.push(`title = $${idx}`); fields.push(`name = $${idx++}`); values.push(data.title); }
  if (data.description !== undefined) { fields.push(`description = $${idx++}`); values.push(data.description); }
  if (data.start_date !== undefined) { fields.push(`start_date = $${idx++}`); values.push(data.start_date); }
  if (data.end_date !== undefined) { fields.push(`end_date = $${idx++}`); values.push(data.end_date); }
  if (data.total_budget !== undefined) { fields.push(`total_budget = $${idx++}`); values.push(data.total_budget); }
  if (data.tags !== undefined) { fields.push(`tags = $${idx++}`); values.push(data.tags); }
  if (data.visibility !== undefined) {
    fields.push(`visibility = $${idx++}`); values.push(data.visibility);
    fields.push(`is_public = $${idx++}`); values.push(data.visibility === 'public');
  }
  if (data.status !== undefined) { fields.push(`status = $${idx++}`); values.push(data.status); }
  if (data.destination_summary !== undefined) { fields.push(`destination_summary = $${idx++}`); values.push(data.destination_summary); }

  if (fields.length === 0) {
    return (await findById(tripId))!;
  }

  values.push(tripId);
  const result = await queryOne<TripRow>(
    `UPDATE trips SET ${fields.join(', ')} WHERE id = $${idx} AND deleted_at IS NULL RETURNING *`,
    values
  );
  return result!;
}

// ── Find ──

export async function findById(tripId: UUID): Promise<TripRow | null> {
  return queryOne<TripRow>(
    'SELECT * FROM trips WHERE id = $1 AND deleted_at IS NULL',
    [tripId]
  );
}

export async function findByIdIncludeDeleted(tripId: UUID): Promise<TripRow | null> {
  return queryOne<TripRow>('SELECT * FROM trips WHERE id = $1', [tripId]);
}

// ── List with filtering, sorting, pagination, search ──

export async function findByUser(
  userId: UUID,
  filters: TripListQuery
): Promise<{ rows: TripRow[]; total: number }> {
  const conditions: string[] = ['t.user_id = $1', 't.deleted_at IS NULL'];
  const params: unknown[] = [userId];
  let paramIdx = 2;

  if (filters.status) {
    conditions.push(`t.status = $${paramIdx++}`);
    params.push(filters.status);
  }

  if (filters.visibility) {
    conditions.push(`t.visibility = $${paramIdx++}`);
    params.push(filters.visibility);
  }

  if (filters.q) {
    conditions.push(`(t.title ILIKE $${paramIdx} OR t.description ILIKE $${paramIdx})`);
    params.push(`%${filters.q}%`);
    paramIdx++;
  }

  const whereClause = conditions.join(' AND ');

  // Safe sort column mapping
  const sortCol = TRIP_SORTABLE_FIELDS[filters.sortBy ?? DEFAULT_TRIP_SORT] || TRIP_SORTABLE_FIELDS[DEFAULT_TRIP_SORT];
  const sortDir = filters.sortOrder === 'ASC' ? 'ASC' : DEFAULT_TRIP_ORDER;

  const limit = filters.limit ?? 12;
  const offset = ((filters.page ?? 1) - 1) * limit;

  const [countResult, rows] = await Promise.all([
    queryOne<CountRow>(`SELECT COUNT(*) as count FROM trips t WHERE ${whereClause}`, params),
    queryMany<TripRow>(
      `SELECT t.* FROM trips t
       WHERE ${whereClause}
       ORDER BY ${sortCol} ${sortDir}
       LIMIT ${limit} OFFSET ${offset}`,
      params
    ),
  ]);

  return { rows, total: parseInt(countResult?.count ?? '0', 10) };
}

// ── Soft Delete ──

export async function softDelete(tripId: UUID): Promise<void> {
  await query('UPDATE trips SET deleted_at = NOW() WHERE id = $1', [tripId]);
}

export async function restore(tripId: UUID): Promise<TripRow> {
  const result = await queryOne<TripRow>(
    'UPDATE trips SET deleted_at = NULL, archived_at = NULL WHERE id = $1 RETURNING *',
    [tripId]
  );
  return result!;
}

// ── Archive ──

export async function archive(tripId: UUID): Promise<TripRow> {
  const result = await queryOne<TripRow>(
    'UPDATE trips SET archived_at = NOW() WHERE id = $1 AND deleted_at IS NULL RETURNING *',
    [tripId]
  );
  return result!;
}

export async function unarchive(tripId: UUID): Promise<TripRow> {
  const result = await queryOne<TripRow>(
    'UPDATE trips SET archived_at = NULL WHERE id = $1 AND deleted_at IS NULL RETURNING *',
    [tripId]
  );
  return result!;
}

// ── Duplicate ──

export async function duplicateTrip(tripId: UUID, userId: UUID): Promise<TripRow> {
  return withTransaction(async (client) => {
    const original = await queryOne<TripRow>(
      'SELECT * FROM trips WHERE id = $1 AND deleted_at IS NULL',
      [tripId]
    );
    if (!original) throw new Error('Trip not found');

    const slug = generateSlug(12);
    const result = await client.query<TripRow>(
      `INSERT INTO trips (user_id, title, name, description, start_date, end_date,
         total_budget, tags, visibility, status, destination_summary, share_slug, is_public, cover_photo_url)
       VALUES ($1, $2, $2, $3, $4, $5, $6, $7, 'private', 'upcoming', $8, $9, false, $10)
       RETURNING *`,
      [
        userId, `${original.title} (Copy)`, original.description,
        original.start_date, original.end_date,
        original.total_budget, original.tags,
        original.destination_summary, slug, original.cover_photo_url,
      ]
    );
    return result.rows[0];
  });
}

// ── Cover Image ──

export async function updateCoverImage(tripId: UUID, coverUrl: string): Promise<TripRow> {
  const result = await queryOne<TripRow>(
    'UPDATE trips SET cover_photo_url = $1 WHERE id = $2 AND deleted_at IS NULL RETURNING *',
    [coverUrl, tripId]
  );
  return result!;
}

// ── Stats ──

export async function getTripStats(userId: UUID): Promise<{
  total: number;
  upcoming: number;
  ongoing: number;
  completed: number;
}> {
  const result = await queryOne<{
    total: string; upcoming: string; ongoing: string; completed: string;
  }>(
    `SELECT
       COUNT(*) as total,
       COUNT(*) FILTER (WHERE status = 'upcoming') as upcoming,
       COUNT(*) FILTER (WHERE status = 'ongoing') as ongoing,
       COUNT(*) FILTER (WHERE status = 'completed') as completed
     FROM trips WHERE user_id = $1 AND deleted_at IS NULL`,
    [userId]
  );
  return {
    total: parseInt(result?.total ?? '0', 10),
    upcoming: parseInt(result?.upcoming ?? '0', 10),
    ongoing: parseInt(result?.ongoing ?? '0', 10),
    completed: parseInt(result?.completed ?? '0', 10),
  };
}
