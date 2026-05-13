import { create } from 'zustand';
import axios from 'axios';
import type { User } from '@/types';
import { api, setApiToken, clearApiToken } from '@/lib/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isHydrated: boolean;

  setUser: (user: User, accessToken: string) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  updateUser: (updates: Partial<User>) => void;
  hydrate: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isHydrated: false,

  setUser: (user, accessToken) => {
    setApiToken(accessToken);
    set({ user, isAuthenticated: true, isLoading: false, isHydrated: true });
  },

  clearAuth: () => {
    clearApiToken();
    set({ user: null, isAuthenticated: false, isLoading: false, isHydrated: true });
  },

  setLoading: (isLoading) => set({ isLoading }),

  updateUser: (updates) => {
    const current = get().user;
    if (current) {
      set({ user: { ...current, ...updates } });
    }
  },

  hydrate: async () => {
    if (get().isHydrated) return;
    set({ isLoading: true });
    try {
      // Use raw axios (not the api instance) to avoid interceptor interference.
      // withCredentials ensures the HttpOnly refresh token cookie is sent.
      const refreshRes = await axios.post(
        `${API_BASE_URL}/auth/refresh`,
        {},
        { withCredentials: true }
      );
      const newToken = refreshRes.data.data.accessToken;
      setApiToken(newToken);

      // Now fetch current user using the api instance (which has the token set)
      const meRes = await api.get('/auth/me');
      set({
        user: meRes.data.data,
        isAuthenticated: true,
        isLoading: false,
        isHydrated: true,
      });
    } catch (err: unknown) {
      // Distinguish between network errors (backend down) and auth failures
      const isNetworkError =
        axios.isAxiosError(err) &&
        (!err.response || err.code === 'ERR_NETWORK' || err.code === 'ECONNABORTED');

      if (isNetworkError) {
        // Backend is unreachable — don't clear existing auth state.
        // Just mark as hydrated so the UI isn't stuck loading forever.
        set({
          isLoading: false,
          isHydrated: true,
        });
      } else {
        // Genuine auth failure (401, 403, etc.) — clear session
        clearApiToken();
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          isHydrated: true,
        });
      }
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Continue logout even if API call fails
    }
    clearApiToken();
    set({ user: null, isAuthenticated: false, isLoading: false });
  },
}));
