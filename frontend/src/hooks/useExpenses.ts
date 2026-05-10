'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api, getErrorMessage } from '@/lib/api';
import type { Expense, ExpenseAnalytics, BudgetSummary, ApiResponse, PaginatedResponse } from '@/types';

// ── Query Keys ──
export const expenseKeys = {
  all: ['expenses'] as const,
  list: (tripId: string) => [...expenseKeys.all, 'list', tripId] as const,
  detail: (id: string) => [...expenseKeys.all, id] as const,
  analytics: (tripId: string) => [...expenseKeys.all, 'analytics', tripId] as const,
  budget: (tripId: string) => [...expenseKeys.all, 'budget', tripId] as const,
};

// ── List Expenses ──
export function useExpenses(tripId: string, filters?: Record<string, string>) {
  const params = new URLSearchParams(filters);
  return useQuery({
    queryKey: [...expenseKeys.list(tripId), filters],
    queryFn: async () => {
      const res = await api.get<PaginatedResponse<Expense>>(`/trips/${tripId}/expenses?${params}`);
      return res.data;
    },
    enabled: !!tripId,
  });
}

// ── Single Expense ──
export function useExpense(id: string) {
  return useQuery({
    queryKey: expenseKeys.detail(id),
    queryFn: async () => {
      const res = await api.get<ApiResponse<Expense>>(`/expenses/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });
}

// ── Create Expense ──
export function useCreateExpense(tripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await api.post<ApiResponse<Expense>>(`/trips/${tripId}/expenses`, data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.list(tripId) });
      queryClient.invalidateQueries({ queryKey: expenseKeys.analytics(tripId) });
      queryClient.invalidateQueries({ queryKey: expenseKeys.budget(tripId) });
      toast.success('Expense added');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

// ── Update Expense ──
export function useUpdateExpense(tripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Record<string, unknown>) => {
      const res = await api.patch<ApiResponse<Expense>>(`/expenses/${id}`, data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.list(tripId) });
      queryClient.invalidateQueries({ queryKey: expenseKeys.analytics(tripId) });
      queryClient.invalidateQueries({ queryKey: expenseKeys.budget(tripId) });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

// ── Delete Expense ──
export function useDeleteExpense(tripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/expenses/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.list(tripId) });
      queryClient.invalidateQueries({ queryKey: expenseKeys.analytics(tripId) });
      queryClient.invalidateQueries({ queryKey: expenseKeys.budget(tripId) });
      toast.success('Expense removed');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

// ── Analytics ──
export function useExpenseAnalytics(tripId: string) {
  return useQuery({
    queryKey: expenseKeys.analytics(tripId),
    queryFn: async () => {
      const res = await api.get<ApiResponse<ExpenseAnalytics>>(`/trips/${tripId}/expenses/analytics`);
      return res.data.data;
    },
    enabled: !!tripId,
  });
}

// ── Budget Summary ──
export function useBudgetSummary(tripId: string) {
  return useQuery({
    queryKey: expenseKeys.budget(tripId),
    queryFn: async () => {
      const res = await api.get<ApiResponse<BudgetSummary>>(`/trips/${tripId}/budget-summary`);
      return res.data.data;
    },
    enabled: !!tripId,
  });
}

// ── Upload Receipt ──
export function useUploadReceipt(tripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ expenseId, file }: { expenseId: string; file: File }) => {
      const formData = new FormData();
      formData.append('receipt', file);
      const res = await api.patch<ApiResponse<Expense>>(`/expenses/${expenseId}/receipt`, formData, {
        headers: { 'Content-Type': undefined },
      });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.list(tripId) });
      toast.success('Receipt uploaded');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}
