'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { ROUTES } from '@/lib/constants';

interface GuestGuardProps {
  children: React.ReactNode;
}

/**
 * Redirects authenticated users away from auth pages (login, register).
 */
export function GuestGuard({ children }: GuestGuardProps) {
  const { isAuthenticated, isHydrated, hydrate } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (isHydrated && isAuthenticated) {
      router.replace(ROUTES.DASHBOARD);
    }
  }, [isHydrated, isAuthenticated, router]);

  return <>{children}</>;
}
