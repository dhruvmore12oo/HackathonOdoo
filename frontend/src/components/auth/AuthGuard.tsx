'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { PageSpinner } from '@/components/ui';
import { ROUTES } from '@/lib/constants';

interface AuthGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export function AuthGuard({ children, redirectTo = ROUTES.LOGIN }: AuthGuardProps) {
  const { isAuthenticated, isLoading, isHydrated, hydrate } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (isHydrated && !isLoading && !isAuthenticated) {
      router.replace(redirectTo);
    }
  }, [isHydrated, isLoading, isAuthenticated, router, redirectTo]);

  if (!isHydrated || isLoading) {
    return <PageSpinner />;
  }

  if (!isAuthenticated) {
    return <PageSpinner />;
  }

  return <>{children}</>;
}
