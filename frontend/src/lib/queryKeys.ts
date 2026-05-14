/**
 * Centralized React Query key factories.
 * Ensures cache consistency, predictable invalidation, and socket sync support.
 */
export const queryKeys = {
  // Auth
  auth: {
    session: ['auth', 'session'] as const,
    profile: ['auth', 'profile'] as const,
  },

  // Trips
  trips: {
    all: ['trips'] as const,
    list: (filters?: object) => ['trips', 'list', filters] as const,
    detail: (id: string) => ['trips', id] as const,
    dashboard: ['trips', 'dashboard'] as const,
  },

  // Itinerary
  itinerary: {
    byTrip: (tripId: string) => ['itinerary', tripId] as const,
  },

  // Expenses
  expenses: {
    byTrip: (tripId: string) => ['expenses', tripId] as const,
    summary: (tripId: string) => ['budget-summary', tripId] as const,
    settings: (tripId: string) => ['budget-settings', tripId] as const,
  },

  // Share & Collaboration
  share: {
    links: (tripId: string) => ['share', 'links', tripId] as const,
    collaborators: (tripId: string) => ['share', 'collaborators', tripId] as const,
    feed: (tripId: string) => ['share', 'feed', tripId] as const,
    public: (slug: string) => ['share', 'public', slug] as const,
    community: (filters?: object) => ['community', filters] as const,
  },

  // Notifications
  notifications: {
    all: ['notifications'] as const,
    list: (page: number) => ['notifications', page] as const,
    unread: ['notifications', 'unread'] as const,
  },

  // Search
  search: {
    cities: (q: string, country?: string) => ['search', 'cities', q, country] as const,
    trending: ['search', 'trending'] as const,
    recent: ['search', 'recent'] as const,
  },
} as const;
