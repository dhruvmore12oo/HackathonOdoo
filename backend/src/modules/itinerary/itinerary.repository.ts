import { queryOne, queryMany, withTransaction } from '../../lib/db';
import { UUID } from '../../types';
import { SectionRow, ActivityRow, FullItinerary } from './itinerary.types';
import { CreateSectionInput, UpdateSectionInput, CreateActivityInput, UpdateActivityInput } from './itinerary.schema';
import { ORDER_GAP } from './itinerary.constants';

// ══════════════════════════════════════
// SECTIONS
// ══════════════════════════════════════

export async function createSection(tripId: UUID, data: CreateSectionInput): Promise<SectionRow> {
  // Auto-calculate sort_order if not provided
  let sortOrder = data.sort_order;
  if (sortOrder === undefined) {
    const max = await queryOne<{ max_order: number }>(
      'SELECT COALESCE(MAX(sort_order), 0) as max_order FROM itinerary_sections WHERE trip_id = $1',
      [tripId]
    );
    sortOrder = (max?.max_order ?? 0) + ORDER_GAP;
  }

  const result = await queryOne<SectionRow>(
    `INSERT INTO itinerary_sections
       (trip_id, title, description, day_number, section_type, budget, notes, sort_order)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      tripId, data.title, data.description || null,
      data.day_number, data.section_type ?? 'custom',
      data.budget ?? 0, data.notes || null, sortOrder,
    ]
  );
  return result!;
}

export async function updateSection(sectionId: UUID, data: UpdateSectionInput): Promise<SectionRow> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (data.title !== undefined) { fields.push(`title = $${idx++}`); values.push(data.title); }
  if (data.description !== undefined) { fields.push(`description = $${idx++}`); values.push(data.description); }
  if (data.day_number !== undefined) { fields.push(`day_number = $${idx++}`); values.push(data.day_number); }
  if (data.section_type !== undefined) { fields.push(`section_type = $${idx++}`); values.push(data.section_type); }
  if (data.budget !== undefined) { fields.push(`budget = $${idx++}`); values.push(data.budget); }
  if (data.notes !== undefined) { fields.push(`notes = $${idx++}`); values.push(data.notes); }

  if (fields.length === 0) {
    return (await findSectionById(sectionId))!;
  }

  values.push(sectionId);
  const result = await queryOne<SectionRow>(
    `UPDATE itinerary_sections SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );
  return result!;
}

export async function findSectionById(sectionId: UUID): Promise<SectionRow | null> {
  return queryOne<SectionRow>('SELECT * FROM itinerary_sections WHERE id = $1', [sectionId]);
}

export async function deleteSection(sectionId: UUID): Promise<void> {
  // CASCADE will delete activities
  await queryOne('DELETE FROM itinerary_sections WHERE id = $1', [sectionId]);
}

export async function findSectionsByTrip(tripId: UUID): Promise<SectionRow[]> {
  return queryMany<SectionRow>(
    'SELECT * FROM itinerary_sections WHERE trip_id = $1 ORDER BY day_number ASC, sort_order ASC',
    [tripId]
  );
}

// ══════════════════════════════════════
// ACTIVITIES
// ══════════════════════════════════════

export async function createActivity(sectionId: UUID, data: CreateActivityInput): Promise<ActivityRow> {
  let sortOrder = data.sort_order;
  if (sortOrder === undefined) {
    const max = await queryOne<{ max_order: number }>(
      'SELECT COALESCE(MAX(sort_order), 0) as max_order FROM section_activities WHERE section_id = $1',
      [sectionId]
    );
    sortOrder = (max?.max_order ?? 0) + ORDER_GAP;
  }

  const result = await queryOne<ActivityRow>(
    `INSERT INTO section_activities
       (section_id, name, title, description, type, location_name, latitude, longitude, address,
        start_time, end_time, estimated_duration_minutes, estimated_cost, currency, status,
        notes, tips, sort_order)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
     RETURNING *`,
    [
      sectionId, data.name, data.title || null, data.description || null,
      data.type || null, data.location_name || null,
      data.latitude ?? null, data.longitude ?? null, data.address || null,
      data.start_time || null, data.end_time || null,
      data.estimated_duration_minutes ?? null,
      data.estimated_cost ?? 0, data.currency ?? 'INR',
      data.status ?? 'planned', data.notes || null, data.tips || null,
      sortOrder,
    ]
  );
  return result!;
}

export async function updateActivity(activityId: UUID, data: UpdateActivityInput): Promise<ActivityRow> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (data.name !== undefined) { fields.push(`name = $${idx++}`); values.push(data.name); }
  if (data.title !== undefined) { fields.push(`title = $${idx++}`); values.push(data.title); }
  if (data.description !== undefined) { fields.push(`description = $${idx++}`); values.push(data.description); }
  if (data.type !== undefined) { fields.push(`type = $${idx++}`); values.push(data.type); }
  if (data.location_name !== undefined) { fields.push(`location_name = $${idx++}`); values.push(data.location_name); }
  if (data.latitude !== undefined) { fields.push(`latitude = $${idx++}`); values.push(data.latitude); }
  if (data.longitude !== undefined) { fields.push(`longitude = $${idx++}`); values.push(data.longitude); }
  if (data.address !== undefined) { fields.push(`address = $${idx++}`); values.push(data.address); }
  if (data.start_time !== undefined) { fields.push(`start_time = $${idx++}`); values.push(data.start_time); }
  if (data.end_time !== undefined) { fields.push(`end_time = $${idx++}`); values.push(data.end_time); }
  if (data.estimated_duration_minutes !== undefined) { fields.push(`estimated_duration_minutes = $${idx++}`); values.push(data.estimated_duration_minutes); }
  if (data.estimated_cost !== undefined) { fields.push(`estimated_cost = $${idx++}`); values.push(data.estimated_cost); }
  if (data.currency !== undefined) { fields.push(`currency = $${idx++}`); values.push(data.currency); }
  if (data.status !== undefined) { fields.push(`status = $${idx++}`); values.push(data.status); }
  if (data.notes !== undefined) { fields.push(`notes = $${idx++}`); values.push(data.notes); }
  if (data.tips !== undefined) { fields.push(`tips = $${idx++}`); values.push(data.tips); }

  if (fields.length === 0) {
    return (await findActivityById(activityId))!;
  }

  values.push(activityId);
  const result = await queryOne<ActivityRow>(
    `UPDATE section_activities SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );
  return result!;
}

export async function findActivityById(activityId: UUID): Promise<ActivityRow | null> {
  return queryOne<ActivityRow>('SELECT * FROM section_activities WHERE id = $1', [activityId]);
}

export async function deleteActivity(activityId: UUID): Promise<void> {
  await queryOne('DELETE FROM section_activities WHERE id = $1', [activityId]);
}

export async function findActivitiesBySection(sectionId: UUID): Promise<ActivityRow[]> {
  return queryMany<ActivityRow>(
    'SELECT * FROM section_activities WHERE section_id = $1 ORDER BY sort_order ASC',
    [sectionId]
  );
}

// ══════════════════════════════════════
// FULL ITINERARY
// ══════════════════════════════════════

export async function getFullItinerary(tripId: UUID): Promise<FullItinerary> {
  const sections = await findSectionsByTrip(tripId);
  const sectionIds = sections.map((s) => s.id);

  let allActivities: ActivityRow[] = [];
  if (sectionIds.length > 0) {
    const placeholders = sectionIds.map((_, i) => `$${i + 1}`).join(',');
    allActivities = await queryMany<ActivityRow>(
      `SELECT * FROM section_activities WHERE section_id IN (${placeholders}) ORDER BY sort_order ASC`,
      sectionIds
    );
  }

  // Group activities by section_id
  const activitiesBySection = new Map<string, ActivityRow[]>();
  for (const a of allActivities) {
    const list = activitiesBySection.get(a.section_id) || [];
    list.push(a);
    activitiesBySection.set(a.section_id, list);
  }

  const enrichedSections = sections.map((s) => ({
    ...s,
    activities: activitiesBySection.get(s.id) || [],
  }));

  const totalCost = allActivities.reduce((sum, a) => sum + Number(a.estimated_cost || 0), 0);
  const maxDay = sections.reduce((max, s) => Math.max(max, s.day_number), 0);

  return {
    sections: enrichedSections,
    summary: {
      total_sections: sections.length,
      total_activities: allActivities.length,
      total_estimated_cost: totalCost,
      days: maxDay,
    },
  };
}

// ══════════════════════════════════════
// DUPLICATE ITINERARY
// ══════════════════════════════════════

export async function duplicateItinerary(tripId: UUID, targetTripId: UUID): Promise<FullItinerary> {
  return withTransaction(async (client) => {
    const sections = await queryMany<SectionRow>(
      'SELECT * FROM itinerary_sections WHERE trip_id = $1 ORDER BY sort_order ASC',
      [tripId]
    );

    for (const section of sections) {
      const newSection = await client.query<SectionRow>(
        `INSERT INTO itinerary_sections
           (trip_id, title, description, day_number, section_type, budget, notes, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          targetTripId, section.title, section.description,
          section.day_number, section.section_type, section.budget,
          section.notes, section.sort_order,
        ]
      );
      const newSectionId = newSection.rows[0].id;

      const activities = await queryMany<ActivityRow>(
        'SELECT * FROM section_activities WHERE section_id = $1 ORDER BY sort_order ASC',
        [section.id]
      );

      for (const activity of activities) {
        await client.query(
          `INSERT INTO section_activities
             (section_id, name, title, description, type, location_name, latitude, longitude, address,
              start_time, end_time, estimated_duration_minutes, estimated_cost, currency, status,
              notes, tips, sort_order)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
          [
            newSectionId, activity.name, activity.title, activity.description,
            activity.type, activity.location_name, activity.latitude, activity.longitude,
            activity.address, activity.start_time, activity.end_time,
            activity.estimated_duration_minutes, activity.estimated_cost, activity.currency,
            'planned', activity.notes, activity.tips, activity.sort_order,
          ]
        );
      }
    }

    return getFullItinerary(targetTripId);
  });
}
