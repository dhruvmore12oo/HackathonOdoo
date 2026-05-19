import crypto from 'crypto';
import { queryOne, queryMany, query } from '../../lib/db';
import { UUID } from '../../types';
import {
  CollaboratorRow, ShareLinkRow, ActivityFeedRow,
  PublicTripData, PublicSection, PublicActivity,
} from './share.types';
import { CreateShareLinkInput } from './share.schema';
import { ManageableCollaboratorRoleType, SLUG_ALPHABET, SLUG_LENGTH } from './share.constants';

// ── Slug Generation ────────────────────────────────────────────────────────────

function generateSlug(length = SLUG_LENGTH): string {
  const bytes = crypto.randomBytes(length);
  return Array.from(bytes).map((b) => SLUG_ALPHABET[b % SLUG_ALPHABET.length]).join('');
}

async function generateUniqueSlug(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const slug = generateSlug();
    const existing = await queryOne('SELECT id FROM trip_share_links WHERE slug = $1', [slug]);
    if (!existing) return slug;
  }
  throw new Error('Failed to generate unique slug');
}

// ── Share Links ────────────────────────────────────────────────────────────────

export async function createShareLink(
  tripId: UUID,
  createdBy: UUID,
  data: CreateShareLinkInput
): Promise<ShareLinkRow> {
  const slug = await generateUniqueSlug();
  const expiresAt = data.expires_in_days
    ? new Date(Date.now() + data.expires_in_days * 86400000)
    : null;
  const passwordHash = data.password
    ? crypto.createHash('sha256').update(data.password).digest('hex')
    : null;

  // Update trip share_slug for the canonical link
  await query('UPDATE trips SET share_slug = $1 WHERE id = $2', [slug, tripId]);

  return (await queryOne<ShareLinkRow>(
    `INSERT INTO trip_share_links (trip_id, slug, visibility, expires_at, password_hash, created_by)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [tripId, slug, data.visibility ?? 'public', expiresAt, passwordHash, createdBy]
  ))!;
}

export async function getShareLinkBySlug(slug: string): Promise<ShareLinkRow | null> {
  return queryOne<ShareLinkRow>(
    'SELECT * FROM trip_share_links WHERE slug = $1',
    [slug]
  );
}

export async function getShareLinksByTrip(tripId: UUID): Promise<ShareLinkRow[]> {
  return queryMany<ShareLinkRow>(
    'SELECT * FROM trip_share_links WHERE trip_id = $1 ORDER BY created_at DESC',
    [tripId]
  );
}

export async function revokeShareLink(id: UUID): Promise<void> {
  await query('DELETE FROM trip_share_links WHERE id = $1', [id]);
}

export async function getShareLinkById(id: UUID): Promise<ShareLinkRow | null> {
  return queryOne<ShareLinkRow>(
    'SELECT * FROM trip_share_links WHERE id = $1',
    [id]
  );
}

export async function regenerateShareLink(id: UUID, tripId: UUID): Promise<ShareLinkRow> {
  const newSlug = await generateUniqueSlug();
  await query('UPDATE trips SET share_slug = $1 WHERE id = $2', [newSlug, tripId]);
  return (await queryOne<ShareLinkRow>(
    'UPDATE trip_share_links SET slug = $1 WHERE id = $2 RETURNING *',
    [newSlug, id]
  ))!;
}

export function verifySharePassword(stored: string | null, input: string): boolean {
  if (!stored) return true;
  const hash = crypto.createHash('sha256').update(input).digest('hex');
  return hash === stored;
}

// ── Collaborators ──────────────────────────────────────────────────────────────

export async function inviteCollaborator(
  tripId: UUID,
  invitedBy: UUID,
  data: { user_id: UUID; role: ManageableCollaboratorRoleType }
): Promise<CollaboratorRow> {
  return (await queryOne<CollaboratorRow>(
    `INSERT INTO trip_collaborators (trip_id, user_id, role, invited_by)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (trip_id, user_id) DO UPDATE SET role = EXCLUDED.role
     RETURNING *`,
    [tripId, data.user_id, data.role, invitedBy]
  ))!;
}

export async function acceptInvitation(tripId: UUID, userId: UUID): Promise<CollaboratorRow> {
  return (await queryOne<CollaboratorRow>(
    `UPDATE trip_collaborators SET accepted_at = NOW()
     WHERE trip_id = $1 AND user_id = $2 RETURNING *`,
    [tripId, userId]
  ))!;
}

export async function updateCollaboratorRole(
  collaboratorId: UUID,
  role: ManageableCollaboratorRoleType
): Promise<CollaboratorRow> {
  return (await queryOne<CollaboratorRow>(
    'UPDATE trip_collaborators SET role = $1 WHERE id = $2 RETURNING *',
    [role, collaboratorId]
  ))!;
}

export async function removeCollaborator(collaboratorId: UUID): Promise<void> {
  await query('DELETE FROM trip_collaborators WHERE id = $1', [collaboratorId]);
}

export async function getCollaboratorById(collaboratorId: UUID): Promise<CollaboratorRow | null> {
  return queryOne<CollaboratorRow>(
    `SELECT tc.*, u.first_name, u.last_name, u.email, u.profile_photo_url as avatar_url
     FROM trip_collaborators tc
     JOIN users u ON u.id = tc.user_id
     WHERE tc.id = $1`,
    [collaboratorId]
  );
}

export async function getCollaboratorsByTrip(tripId: UUID): Promise<CollaboratorRow[]> {
  return queryMany<CollaboratorRow>(
    `SELECT tc.*, u.first_name, u.last_name, u.email, u.profile_photo_url as avatar_url
     FROM trip_collaborators tc
     JOIN users u ON u.id = tc.user_id
     WHERE tc.trip_id = $1
     ORDER BY tc.created_at ASC`,
    [tripId]
  );
}

export interface PendingInvitationRow extends CollaboratorRow {
  trip_title: string;
  trip_cover_photo_url: string | null;
  trip_start_date: string;
  trip_end_date: string;
  trip_destination_summary: string | null;
  inviter_first_name: string;
  inviter_last_name: string;
  inviter_email: string;
}

export async function getPendingInvitationsByUser(userId: UUID): Promise<PendingInvitationRow[]> {
  return queryMany<PendingInvitationRow>(
    `SELECT tc.*,
            u.first_name, u.last_name, u.email, u.profile_photo_url as avatar_url,
            COALESCE(t.title, t.name) as trip_title,
            t.cover_photo_url as trip_cover_photo_url,
            t.start_date as trip_start_date,
            t.end_date as trip_end_date,
            t.destination_summary as trip_destination_summary,
            inv.first_name as inviter_first_name,
            inv.last_name as inviter_last_name,
            inv.email as inviter_email
     FROM trip_collaborators tc
     JOIN users u ON u.id = tc.user_id
     JOIN trips t ON t.id = tc.trip_id AND t.deleted_at IS NULL
     LEFT JOIN users inv ON inv.id = tc.invited_by
     WHERE tc.user_id = $1 AND tc.accepted_at IS NULL
     ORDER BY tc.created_at DESC`,
    [userId]
  );
}

export async function declineInvitation(tripId: UUID, userId: UUID): Promise<void> {
  await query(
    'DELETE FROM trip_collaborators WHERE trip_id = $1 AND user_id = $2 AND accepted_at IS NULL',
    [tripId, userId]
  );
}

// ── View Tracking ──────────────────────────────────────────────────────────────

export async function recordView(
  tripId: UUID,
  viewerId: UUID | null,
  ipHash: string | null,
  userAgent: string | null
): Promise<void> {
  await query(
    `INSERT INTO trip_views (trip_id, viewer_id, ip_hash, user_agent)
     VALUES ($1, $2, $3, $4)`,
    [tripId, viewerId, ipHash, userAgent]
  );
  await query('UPDATE trips SET view_count = view_count + 1 WHERE id = $1', [tripId]);
}

// ── Activity Feed ──────────────────────────────────────────────────────────────

export async function logActivity(
  tripId: UUID,
  actorId: UUID | null,
  actionType: string,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  await query(
    `INSERT INTO trip_activity_feed (trip_id, actor_id, action_type, metadata)
     VALUES ($1, $2, $3, $4)`,
    [tripId, actorId, actionType, JSON.stringify(metadata)]
  );
}

export async function getActivityFeed(tripId: UUID, limit = 20): Promise<ActivityFeedRow[]> {
  return queryMany<ActivityFeedRow>(
    `SELECT af.*,
       CONCAT(u.first_name, ' ', u.last_name) as actor_name,
       u.profile_photo_url as actor_avatar
     FROM trip_activity_feed af
     LEFT JOIN users u ON u.id = af.actor_id
     WHERE af.trip_id = $1
     ORDER BY af.created_at DESC LIMIT $2`,
    [tripId, limit]
  );
}

// ── Public Trip Data ───────────────────────────────────────────────────────────

export async function getPublicTripBySlug(slug: string): Promise<PublicTripData | null> {
  const link = await getShareLinkBySlug(slug);
  if (!link) return null;

  const trip = await queryOne<{
    id: UUID; title: string;
    destination_summary: string | null; description: string | null;
    cover_photo_url: string | null; start_date: string; end_date: string;
    tags: string[]; status: string; view_count: number; share_count: number;
    visibility: string;
    first_name: string; last_name: string; avatar_url: string | null;
  }>(
    `SELECT t.id, COALESCE(t.title, t.name) as title, t.destination_summary, t.description,
            t.cover_photo_url, t.start_date, t.end_date, t.tags, t.status,
            COALESCE(t.view_count, 0) as view_count, COALESCE(t.share_count, 0) as share_count, t.visibility,
            u.first_name, u.last_name, u.profile_photo_url as avatar_url
     FROM trips t JOIN users u ON u.id = t.user_id
     WHERE t.id = $1 AND t.deleted_at IS NULL`,
    [link.trip_id]
  );
  if (!trip) return null;

  // Sections + activities
  const sections = await queryMany<{
    id: UUID; title: string; day_number: number; section_type: string;
  }>(
    `SELECT id, title, day_number, section_type
     FROM itinerary_sections WHERE trip_id = $1 ORDER BY day_number, sort_order`,
    [trip.id]
  );

  const publicSections: PublicSection[] = await Promise.all(
    sections.map(async (s) => {
      const activities = await queryMany<{
        id: UUID; name: string; location_name: string | null;
        start_time: string | null; estimated_cost: number; status: string;
      }>(
        `SELECT id, name, location_name, start_time, estimated_cost, status
         FROM section_activities WHERE section_id = $1 ORDER BY sort_order`,
        [s.id]
      );
      return {
        id: s.id,
        title: s.title,
        day_number: s.day_number,
        section_type: s.section_type,
        activities: activities as PublicActivity[],
      };
    })
  );

  return {
    id: trip.id,
    title: trip.title,
    destination_summary: trip.destination_summary,
    description: trip.description,
    cover_photo_url: trip.cover_photo_url,
    start_date: trip.start_date,
    end_date: trip.end_date,
    tags: trip.tags || [],
    status: trip.status,
    view_count: trip.view_count,
    share_count: trip.share_count,
    sections: publicSections,
    owner: { first_name: trip.first_name, last_name: trip.last_name, avatar_url: trip.avatar_url },
  };
}

// ── Community / Public Trips ───────────────────────────────────────────────────

export async function getPublicTrips(
  q?: string,
  tags?: string,
  page = 1,
  limit = 20
): Promise<{ rows: PublicTripData[]; total: number }> {
  const conditions = [`t.visibility = 'public'`, `t.deleted_at IS NULL`];
  const values: unknown[] = [];
  let idx = 1;

  if (q) { conditions.push(`(COALESCE(t.title, t.name) ILIKE $${idx} OR t.destination_summary ILIKE $${idx})`); values.push(`%${q}%`); idx++; }
  if (tags) { conditions.push(`t.tags && $${idx}::text[]`); values.push(`{${tags}}`); idx++; }

  const where = conditions.join(' AND ');
  const offset = (page - 1) * limit;

  const countRes = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM trips t WHERE ${where}`, values
  );

  const rows = await queryMany<{
    id: UUID; title: string; destination_summary: string | null;
    cover_photo_url: string | null; start_date: string; end_date: string;
    tags: string[]; status: string; view_count: number; share_count: number;
    first_name: string; last_name: string; avatar_url: string | null; share_slug: string | null;
  }>(
    `SELECT t.id, COALESCE(t.title, t.name) as title, t.destination_summary, t.cover_photo_url, t.start_date,
            t.end_date, t.tags, t.status, COALESCE(t.view_count, 0) as view_count,
            COALESCE(t.share_count, 0) as share_count, t.share_slug,
            u.first_name, u.last_name, u.profile_photo_url as avatar_url
     FROM trips t JOIN users u ON u.id = t.user_id
     WHERE ${where}
     ORDER BY t.view_count DESC, t.created_at DESC
     LIMIT ${limit} OFFSET ${offset}`,
    values
  );

  const publicRows: PublicTripData[] = rows.map((r) => ({
    id: r.id, title: r.title, destination_summary: r.destination_summary,
    cover_photo_url: r.cover_photo_url, start_date: r.start_date, end_date: r.end_date,
    tags: r.tags || [], status: r.status, view_count: r.view_count, share_count: r.share_count,
    share_slug: r.share_slug,
    description: null, sections: [],
    owner: { first_name: r.first_name, last_name: r.last_name, avatar_url: r.avatar_url },
  }));

  return { rows: publicRows, total: Number(countRes?.count || 0) };
}
