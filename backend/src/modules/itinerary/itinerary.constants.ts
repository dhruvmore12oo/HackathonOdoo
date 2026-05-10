// ── Section types ──
export const SECTION_TYPES = ['morning', 'afternoon', 'evening', 'night', 'custom'] as const;
export type SectionType = (typeof SECTION_TYPES)[number];

// ── Activity statuses ──
export const ACTIVITY_STATUSES = ['planned', 'booked', 'completed', 'skipped'] as const;
export type ActivityStatusType = (typeof ACTIVITY_STATUSES)[number];

// ── Ordering ──
export const ORDER_GAP = 1000;  // Gap between sort_order values for stable ordering
export const DEFAULT_CURRENCY = 'INR';
