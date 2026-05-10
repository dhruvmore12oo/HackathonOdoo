import { withTransaction } from '../../lib/db';
import { ReorderItem, ActivityMovePayload } from './itinerary.types';

/**
 * Reorder sections atomically within a transaction.
 * Each item has { id, sort_order }.
 */
export async function reorderSections(items: ReorderItem[]): Promise<void> {
  await withTransaction(async (client) => {
    for (const item of items) {
      await client.query(
        'UPDATE itinerary_sections SET sort_order = $1 WHERE id = $2',
        [item.sort_order, item.id]
      );
    }
  });
}

/**
 * Reorder activities atomically, supporting cross-section moves.
 * Each item has { id, sort_order, section_id? }.
 */
export async function reorderActivities(items: ActivityMovePayload[]): Promise<void> {
  await withTransaction(async (client) => {
    for (const item of items) {
      if (item.target_section_id) {
        // Cross-section move
        await client.query(
          'UPDATE section_activities SET sort_order = $1, section_id = $2 WHERE id = $3',
          [item.sort_order, item.target_section_id, item.id]
        );
      } else {
        // Same-section reorder
        await client.query(
          'UPDATE section_activities SET sort_order = $1 WHERE id = $2',
          [item.sort_order, item.id]
        );
      }
    }
  });
}
