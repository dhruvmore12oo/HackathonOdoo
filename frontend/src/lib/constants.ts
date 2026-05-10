export const APP_NAME = 'Traveloop';

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  DASHBOARD: '/dashboard',
  TRIPS: '/trips',
  NEW_TRIP: '/trips/new',
  TRIP: (id: string) => `/trips/${id}`,
  TRIP_ITINERARY: (id: string) => `/trips/${id}/itinerary`,
  TRIP_EXPENSES: (id: string) => `/trips/${id}/expenses`,
  TRIP_SHARE: (id: string) => `/trips/${id}/share`,
  SHARE: (slug: string) => `/share/${slug}`,
  COMMUNITY: '/community',
  TRIP_BUILD: (id: string) => `/trips/${id}/build`,
  TRIP_PACKING: (id: string) => `/trips/${id}/packing`,
  TRIP_NOTES: (id: string) => `/trips/${id}/notes`,
  TRIP_INVOICE: (id: string) => `/trips/${id}/invoice`,
  SEARCH_CITIES: '/search/cities',
  SEARCH_ACTIVITIES: '/search/activities',
  PROFILE: '/profile',
  ADMIN: '/admin',
} as const;

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
  },
  TRIPS: '/trips',
  SECTIONS: '/sections',
  ACTIVITIES: '/activities',
  CITIES: '/cities/search',
  ACTIVITY_CATALOGUE: '/activities/search',
  COMMUNITY: '/community',
  SHARE: '/share',
  ADMIN: '/admin/stats',
  HEALTH: '/health',
} as const;

export const PACKING_CATEGORIES = [
  'documents',
  'clothing',
  'electronics',
  'toiletries',
  'misc',
] as const;

export const EXPENSE_CATEGORIES = [
  'lodging',
  'flights',
  'activities',
  'food',
  'transport',
  'misc',
] as const;

export const COST_INDEX_LABELS = {
  budget: '💰 Budget',
  mid: '✨ Mid-Range',
  luxury: '👑 Luxury',
} as const;

export const TRIP_STATUS_COLORS = {
  upcoming: 'bg-blue-100 text-blue-700',
  ongoing: 'bg-green-100 text-green-700',
  completed: 'bg-gray-100 text-gray-600',
} as const;
