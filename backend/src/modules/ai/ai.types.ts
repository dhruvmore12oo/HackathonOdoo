import { UUID } from '../../types';

export interface AISuggestionRequest {
  tripId: UUID;
  destination: string;
  startDate: string;
  endDate: string;
  budget?: number;
  currency?: string;
  interests?: string[];
  travelStyle?: string;
}

export interface AISuggestionResponse {
  itinerary: AIDaySuggestion[];
  tips: string[];
  estimatedBudget?: { min: number; max: number; currency: string };
}

export interface AIDaySuggestion {
  day: number;
  title: string;
  sections: AISectionSuggestion[];
}

export interface AISectionSuggestion {
  type: 'morning' | 'afternoon' | 'evening' | 'night';
  title: string;
  activities: AIActivitySuggestion[];
}

export interface AIActivitySuggestion {
  name: string;
  description: string;
  estimatedCost: number;
  durationHours: number;
  location?: string;
  tips?: string;
}

export interface AIProvider {
  name: string;
  generateItinerary(req: AISuggestionRequest): Promise<AISuggestionResponse>;
}
