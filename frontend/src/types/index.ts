// ── Shared Types — mirrors backend types for full-stack type safety ──

export type UUID = string;

// ── User ──
export type UserRole = 'user' | 'admin';

export interface User {
  id: UUID;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  city: string | null;
  country: string | null;
  profile_photo_url: string | null;
  bio: string | null;
  role: UserRole;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

// ── Trip ──
export type TripStatus = 'upcoming' | 'ongoing' | 'completed';
export type TripVisibility = 'private' | 'shared' | 'public';

export interface Trip {
  id: UUID;
  user_id: UUID;
  title: string;
  name: string;
  description: string | null;
  start_date: string;
  end_date: string;
  cover_photo_url: string | null;
  status: TripStatus;
  visibility: TripVisibility;
  is_public: boolean;
  share_slug: string | null;
  total_budget: number;
  destination_summary: string | null;
  tags: string[];
  deleted_at: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

// ── Itinerary Section ──
export type SectionType = 'morning' | 'afternoon' | 'evening' | 'night' | 'custom';

export interface ItinerarySection {
  id: UUID;
  trip_id: UUID;
  title: string;
  description: string | null;
  day_number: number;
  section_type: SectionType;
  start_date: string | null;
  end_date: string | null;
  budget: number;
  notes: string | null;
  sort_order: number;
  activities?: SectionActivity[];
  created_at: string;
  updated_at: string;
}

// ── Section Activity ──
export type ActivityStatus = 'planned' | 'booked' | 'completed' | 'skipped';

export interface SectionActivity {
  id: UUID;
  section_id: UUID;
  name: string;
  title: string | null;
  description: string | null;
  type: string | null;
  location_name: string | null;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  start_time: string | null;
  end_time: string | null;
  estimated_duration_minutes: number | null;
  estimated_cost: number;
  currency: string;
  status: ActivityStatus;
  notes: string | null;
  tips: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// ── Full Itinerary Response ──
export interface FullItinerary {
  sections: (ItinerarySection & { activities: SectionActivity[] })[];
  summary: {
    total_sections: number;
    total_activities: number;
    total_estimated_cost: number;
    days: number;
  };
}

// ── City ──
export type CostIndex = 'budget' | 'mid' | 'luxury';

export interface City {
  id: UUID;
  name: string;
  country: string;
  region: string;
  cost_index: CostIndex;
  popularity_score: number;
  lat: number;
  lng: number;
}

// ── Activity Catalogue ──
export interface ActivityCatalogue {
  id: UUID;
  city_id: UUID | null;
  name: string;
  category: string;
  avg_cost: number;
  duration_hours: number | null;
  description: string | null;
  thumbnail_url: string | null;
}

// ── Expense ──
export type ExpenseCategory = 'transport' | 'food' | 'hotel' | 'lodging' | 'flights' | 'activities' | 'shopping' | 'emergency' | 'misc' | 'other';
export type ExpenseStatus = 'planned' | 'pending' | 'paid' | 'refunded' | 'cancelled';

export interface Expense {
  id: UUID;
  trip_id: UUID;
  section_id: UUID | null;
  activity_id: UUID | null;
  title: string | null;
  description: string;
  category: ExpenseCategory;
  amount: number;
  currency: string;
  quantity: number;
  status: ExpenseStatus;
  payment_method: string | null;
  vendor: string | null;
  receipt_url: string | null;
  transaction_reference: string | null;
  expense_date: string | null;
  is_estimated: boolean;
  is_paid: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Budget Settings ──
export interface BudgetSettings {
  id: UUID;
  trip_id: UUID;
  daily_budget: number;
  category_limits: Record<string, number>;
  warning_threshold: number;
  preferred_currency: string;
}

// ── Expense Analytics ──
export interface ExpenseAnalytics {
  total_budget: number;
  total_spent: number;
  total_estimated: number;
  total_actual: number;
  remaining: number;
  spent_percentage: number;
  by_category: CategoryBreakdown[];
  by_status: { status: string; total: number; count: number }[];
  daily_spending: { date: string; total: number; count: number }[];
  budget_health: 'healthy' | 'warning' | 'danger';
  warning_threshold: number;
}

export interface CategoryBreakdown {
  category: string;
  total: number;
  count: number;
  percentage: number;
}

export interface BudgetSummary {
  total_budget: number;
  total_spent: number;
  total_estimated: number;
  remaining: number;
  spent_percentage: number;
  daily_budget: number;
  daily_average: number;
  category_breakdown: CategoryBreakdown[];
  budget_health: 'healthy' | 'warning' | 'danger';
  top_categories: CategoryBreakdown[];
  recent_expenses: Expense[];
}

// ── Packing Item ──
export type PackingCategory = 'documents' | 'clothing' | 'electronics' | 'toiletries' | 'misc';

export interface PackingItem {
  id: UUID;
  trip_id: UUID;
  name: string;
  category: PackingCategory;
  is_packed: boolean;
  quantity: number;
  sort_order: number;
}

// ── Trip Note ──
export interface TripNote {
  id: UUID;
  trip_id: UUID;
  section_id: UUID | null;
  title: string | null;
  body: string;
  note_date: string | null;
  created_at: string;
}

// ── API Response Types ──
export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Array<{ field: string; message: string }>;
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: PaginationMeta;
}

// ── Auth Types ──
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phone?: string;
  city?: string;
  country?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

// ── Budget ──
export interface BudgetBreakdown {
  total: number;
  byCategory: Record<string, number>;
  perDay: number;
  isOverBudget: boolean;
}

// ── Phase 5: Sharing & Collaboration ──
export type CollaboratorRole = 'owner' | 'editor' | 'viewer';

export interface Collaborator {
  id: UUID;
  trip_id: UUID;
  user_id: UUID;
  role: CollaboratorRole;
  invited_by: UUID | null;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  avatar_url?: string | null;
}

export interface ShareLink {
  id: UUID;
  trip_id: UUID;
  slug: string;
  visibility: 'public' | 'unlisted';
  expires_at: string | null;
  password_hash: string | null;
  created_by: UUID;
  created_at: string;
}

export interface ActivityFeedItem {
  id: UUID;
  trip_id: UUID;
  actor_id: UUID | null;
  action_type: string;
  metadata: Record<string, unknown>;
  created_at: string;
  actor_name?: string;
  actor_avatar?: string | null;
}

export interface PublicTripData {
  id: UUID;
  title: string;
  destination_summary: string | null;
  description: string | null;
  cover_photo_url: string | null;
  start_date: string;
  end_date: string;
  tags: string[];
  status: string;
  view_count: number;
  share_count: number;
  sections: PublicSection[];
  owner: { first_name: string; last_name: string; avatar_url: string | null };
}

export interface PublicSection {
  id: UUID;
  title: string;
  day_number: number;
  section_type: string;
  activities: PublicActivity[];
}

export interface PublicActivity {
  id: UUID;
  name: string;
  location_name: string | null;
  start_time: string | null;
  estimated_cost: number;
  status: string;
}
