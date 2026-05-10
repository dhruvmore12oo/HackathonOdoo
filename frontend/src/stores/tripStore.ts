import { create } from 'zustand';
import type { Trip, ItinerarySection, TripStatus, TripVisibility } from '@/types';

interface TripFilters {
  q: string;
  status: TripStatus | '';
  visibility: TripVisibility | '';
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
}

interface TripState {
  activeTrip: Trip | null;
  activeSections: ItinerarySection[];
  isDirty: boolean;
  viewMode: 'grid' | 'list';
  filters: TripFilters;

  setActiveTrip: (trip: Trip) => void;
  setActiveSections: (sections: ItinerarySection[]) => void;
  clearActiveTrip: () => void;
  setDirty: (dirty: boolean) => void;
  setViewMode: (mode: 'grid' | 'list') => void;
  setFilters: (filters: Partial<TripFilters>) => void;
  resetFilters: () => void;
}

const DEFAULT_FILTERS: TripFilters = {
  q: '',
  status: '',
  visibility: '',
  sortBy: 'created_at',
  sortOrder: 'DESC',
};

export const useTripStore = create<TripState>((set) => ({
  activeTrip: null,
  activeSections: [],
  isDirty: false,
  viewMode: 'grid',
  filters: { ...DEFAULT_FILTERS },

  setActiveTrip: (trip) => set({ activeTrip: trip }),
  setActiveSections: (sections) => set({ activeSections: sections }),
  clearActiveTrip: () =>
    set({ activeTrip: null, activeSections: [], isDirty: false }),
  setDirty: (isDirty) => set({ isDirty }),
  setViewMode: (viewMode) => set({ viewMode }),
  setFilters: (newFilters) =>
    set((state) => ({ filters: { ...state.filters, ...newFilters } })),
  resetFilters: () => set({ filters: { ...DEFAULT_FILTERS } }),
}));
