import { UUID } from '../../types';

// ── Section Row from DB ──
export interface SectionRow {
  id: UUID;
  trip_id: UUID;
  title: string;
  description: string | null;
  day_number: number;
  section_type: string;
  start_date: string | null;
  end_date: string | null;
  budget: number;
  notes: string | null;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
}

// ── Activity Row from DB ──
export interface ActivityRow {
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
  status: string;
  notes: string | null;
  tips: string | null;
  metadata: Record<string, unknown>;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
}

// ── Full itinerary response ──
export interface FullItinerary {
  sections: (SectionRow & { activities: ActivityRow[] })[];
  summary: {
    total_sections: number;
    total_activities: number;
    total_estimated_cost: number;
    days: number;
  };
}

// ── Reorder payloads ──
export interface ReorderItem {
  id: UUID;
  sort_order: number;
}

export interface ActivityMovePayload {
  id: UUID;
  target_section_id: UUID;
  sort_order: number;
}
