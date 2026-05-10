import { create } from 'zustand';
import type { FullItinerary } from '@/types';

interface ItineraryState {
  itinerary: FullItinerary | null;
  expandedSections: Set<string>;
  activeDayFilter: number | null;
  isSaving: boolean;
  lastSavedAt: Date | null;

  setItinerary: (data: FullItinerary) => void;
  toggleSection: (sectionId: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
  setDayFilter: (day: number | null) => void;
  setSaving: (saving: boolean) => void;
  markSaved: () => void;
  reset: () => void;
}

export const useItineraryStore = create<ItineraryState>((set, get) => ({
  itinerary: null,
  expandedSections: new Set<string>(),
  activeDayFilter: null,
  isSaving: false,
  lastSavedAt: null,

  setItinerary: (data) => {
    // Auto-expand all sections on first load
    const expanded = new Set(data.sections.map((s) => s.id));
    set({ itinerary: data, expandedSections: expanded });
  },

  toggleSection: (sectionId) => {
    const current = new Set(get().expandedSections);
    if (current.has(sectionId)) {
      current.delete(sectionId);
    } else {
      current.add(sectionId);
    }
    set({ expandedSections: current });
  },

  expandAll: () => {
    const ids = get().itinerary?.sections.map((s) => s.id) || [];
    set({ expandedSections: new Set(ids) });
  },

  collapseAll: () => set({ expandedSections: new Set() }),

  setDayFilter: (day) => set({ activeDayFilter: day }),

  setSaving: (saving) => set({ isSaving: saving }),

  markSaved: () => set({ isSaving: false, lastSavedAt: new Date() }),

  reset: () => set({
    itinerary: null,
    expandedSections: new Set(),
    activeDayFilter: null,
    isSaving: false,
    lastSavedAt: null,
  }),
}));
