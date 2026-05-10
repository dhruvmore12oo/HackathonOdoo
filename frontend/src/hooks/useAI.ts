'use client';

import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api, getErrorMessage } from '@/lib/api';
import type { ApiResponse } from '@/types';

export interface AISuggestionResponse {
  itinerary: {
    day: number;
    title: string;
    sections: {
      type: string;
      title: string;
      activities: {
        name: string;
        description: string;
        estimatedCost: number;
        durationHours: number;
        location?: string;
        tips?: string;
      }[];
    }[];
  }[];
  tips: string[];
  estimatedBudget?: { min: number; max: number; currency: string };
}

export function useGenerateItinerary() {
  return useMutation({
    mutationFn: async (data: {
      destination: string;
      startDate: string;
      endDate: string;
      budget?: number;
      currency?: string;
      interests?: string[];
      travelStyle?: string;
    }) => {
      const res = await api.post<ApiResponse<AISuggestionResponse>>('/ai/generate-itinerary', data);
      return res.data.data;
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}
