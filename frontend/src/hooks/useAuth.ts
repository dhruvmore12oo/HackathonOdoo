'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api, getErrorMessage } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { ROUTES } from '@/lib/constants';
import type { LoginCredentials, RegisterData, ApiResponse, AuthResponse } from '@/types';

export function useLogin() {
  const { setUser } = useAuthStore();
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: LoginCredentials) => {
      const res = await api.post<ApiResponse<{ user: AuthResponse['user']; accessToken: string }>>(
        '/auth/login',
        data
      );
      return res.data.data;
    },
    onSuccess: (data) => {
      setUser(data.user, data.accessToken);
      toast.success('Welcome back!');
      router.push(ROUTES.DASHBOARD);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useRegister() {
  const { setUser } = useAuthStore();
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: RegisterData) => {
      const res = await api.post<ApiResponse<{ user: AuthResponse['user']; accessToken: string }>>(
        '/auth/register',
        data
      );
      return res.data.data;
    },
    onSuccess: (data) => {
      setUser(data.user, data.accessToken);
      toast.success('Account created! Welcome to Traveloop!');
      router.push(ROUTES.DASHBOARD);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useLogout() {
  const { logout } = useAuthStore();
  const router = useRouter();

  return useCallback(async () => {
    await logout();
    toast.success('Logged out');
    router.push(ROUTES.LOGIN);
  }, [logout, router]);
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: async (email: string) => {
      const res = await api.post('/auth/forgot-password', { email });
      return res.data;
    },
    onSuccess: () => {
      toast.success('If an account exists, a reset link has been sent');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useResetPassword() {
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: { token: string; password: string }) => {
      const res = await api.post('/auth/reset-password', data);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Password has been reset. Please sign in.');
      router.push(ROUTES.LOGIN);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useUpdateProfile() {
  const { updateUser } = useAuthStore();

  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await api.patch('/users/profile', data);
      return res.data.data;
    },
    onSuccess: (data) => {
      updateUser(data);
      toast.success('Profile updated');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useUploadAvatar() {
  const { updateUser } = useAuthStore();

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('avatar', file);
      const res = await api.patch('/users/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data.data;
    },
    onSuccess: (data) => {
      updateUser(data);
      toast.success('Avatar updated');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: async (data: { current_password: string; new_password: string }) => {
      const res = await api.patch('/users/change-password', data);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Password changed');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useDeleteAccount() {
  const { clearAuth } = useAuthStore();
  const router = useRouter();

  return useMutation({
    mutationFn: async (password: string) => {
      await api.delete('/users/account', { data: { password } });
    },
    onSuccess: () => {
      clearAuth();
      toast.success('Account deleted');
      router.push(ROUTES.HOME);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}
