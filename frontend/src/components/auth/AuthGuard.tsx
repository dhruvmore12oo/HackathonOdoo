'use client';

import { useEffect, useState } from 'react';
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
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Timeout fallback — don't hang forever if backend is unreachable
  useEffect(() => {
    if (isHydrated) return;
    const timer = setTimeout(() => setTimedOut(true), 8000);
    return () => clearTimeout(timer);
  }, [isHydrated]);

  useEffect(() => {
    if (isHydrated && !isLoading && !isAuthenticated) {
      router.replace(redirectTo);
    }
  }, [isHydrated, isLoading, isAuthenticated, router, redirectTo]);

  if (timedOut && !isHydrated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-brand-100 flex items-center justify-center mx-auto">
            <svg className="h-6 w-6 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Connection Issue</h2>
          <p className="text-sm text-gray-500 max-w-sm">
            Unable to verify your session. Please check your connection and try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-4 py-2 bg-brand-500 text-white text-sm font-medium rounded-lg hover:bg-brand-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!isHydrated || isLoading) {
    return <PageSpinner />;
  }

  if (!isAuthenticated) {
    return <PageSpinner />;
  }

  return <>{children}</>;
}
