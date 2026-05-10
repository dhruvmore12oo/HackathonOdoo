export const TRIP_STATUS = {
  UPCOMING: 'upcoming',
  ONGOING: 'ongoing',
  COMPLETED: 'completed',
} as const;

export const TRIP_VISIBILITY = {
  PRIVATE: 'private',
  SHARED: 'shared',
  PUBLIC: 'public',
} as const;

export const TRIP_SORTABLE_FIELDS: Record<string, string> = {
  created_at: 't.created_at',
  updated_at: 't.updated_at',
  start_date: 't.start_date',
  end_date: 't.end_date',
  title: 't.title',
  total_budget: 't.total_budget',
};

export const DEFAULT_TRIP_SORT = 'created_at';
export const DEFAULT_TRIP_ORDER = 'DESC';
