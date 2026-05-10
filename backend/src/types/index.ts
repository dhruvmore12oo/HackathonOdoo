import { Request } from 'express';

// ── UUID ──
export type UUID = string;

// ── User ──
export type UserRole = 'user' | 'admin';

export interface User {
  id: UUID;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  password_hash: string;
  city: string | null;
  country: string | null;
  profile_photo_url: string | null;
  bio: string | null;
  role: UserRole;
  email_verified: boolean;
  created_at: Date;
  updated_at: Date;
}

export type UserPublic = Omit<User, 'password_hash'>;

// ── Trip ──
export type TripStatus = 'upcoming' | 'ongoing' | 'completed';

export interface Trip {
  id: UUID;
  user_id: UUID;
  name: string;
  description: string | null;
  start_date: string;
  end_date: string;
  cover_photo_url: string | null;
  status: TripStatus;
  is_public: boolean;
  share_slug: string | null;
  total_budget: number;
  created_at: Date;
  updated_at: Date;
}

// ── Itinerary Section ──
export interface ItinerarySection {
  id: UUID;
  trip_id: UUID;
  title: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  budget: number;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
}

// ── City (reference) ──
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
  created_at: Date;
}

// ── Activity Catalogue (reference) ──
export interface ActivityCatalogue {
  id: UUID;
  city_id: UUID | null;
  name: string;
  category: string;
  avg_cost: number;
  duration_hours: number | null;
  description: string | null;
  thumbnail_url: string | null;
  created_at: Date;
}

// ── Section Activity (user-created) ──
export interface SectionActivity {
  id: UUID;
  section_id: UUID;
  name: string;
  type: string | null;
  estimated_cost: number;
  duration_hours: number | null;
  notes: string | null;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
}

// ── Expense ──
export type ExpenseCategory = 'lodging' | 'flights' | 'activities' | 'food' | 'transport' | 'misc';

export interface Expense {
  id: UUID;
  trip_id: UUID;
  section_id: UUID | null;
  category: ExpenseCategory;
  description: string;
  amount: number;
  quantity: number;
  is_paid: boolean;
  created_at: Date;
  updated_at: Date;
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
  created_at: Date;
  updated_at: Date;
}

// ── Trip Note ──
export interface TripNote {
  id: UUID;
  trip_id: UUID;
  section_id: UUID | null;
  title: string | null;
  body: string;
  note_date: string | null;
  created_at: Date;
  updated_at: Date;
}

// ── Trip City (junction) ──
export interface TripCity {
  id: UUID;
  trip_id: UUID;
  city_id: UUID;
  sort_order: number;
  created_at: Date;
}

// ── API Types ──
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
    details?: unknown;
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
export interface TokenPayload {
  userId: UUID;
  email: string;
  role: UserRole;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// ── Request Extensions ──
export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

// ── Query Helpers ──
export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export interface SortParams {
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
}
