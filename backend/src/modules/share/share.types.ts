import { UUID } from '../../types';

export interface CollaboratorRow {
  id: UUID;
  trip_id: UUID;
  user_id: UUID;
  role: string;
  invited_by: UUID | null;
  accepted_at: Date | null;
  created_at: Date;
  updated_at: Date;
  // joined from users
  first_name?: string;
  last_name?: string;
  email?: string;
  avatar_url?: string | null;
}

export interface ShareLinkRow {
  id: UUID;
  trip_id: UUID;
  slug: string;
  visibility: string;
  expires_at: Date | null;
  password_hash: string | null;
  created_by: UUID;
  created_at: Date;
}

export interface TripViewRow {
  id: UUID;
  trip_id: UUID;
  viewer_id: UUID | null;
  ip_hash: string | null;
  user_agent: string | null;
  viewed_at: Date;
}

export interface ActivityFeedRow {
  id: UUID;
  trip_id: UUID;
  actor_id: UUID | null;
  action_type: string;
  metadata: Record<string, unknown>;
  created_at: Date;
  // joined
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

export interface ShareAnalytics {
  total_views: number;
  unique_viewers: number;
  share_count: number;
  collaborator_count: number;
  recent_views: { date: string; count: number }[];
}
