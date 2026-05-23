'use client';

import { useState, useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { createQueryClient } from '@/lib/queryClient';
import { useSocketConnection, useRealtimeNotifications } from '@/lib/socket';
import { useAuthStore } from '@/stores/authStore';

import { GoogleOAuthProvider } from '@react-oauth/google';

/** Hydrate auth state once at app startup — before any protected route renders. */
function AuthHydrator({ children }: { children: React.ReactNode }) {
  const hydrate = useAuthStore((s) => s.hydrate);
  useEffect(() => { hydrate(); }, [hydrate]);
  return <>{children}</>;
}

function SocketProvider({ children }: { children: React.ReactNode }) {
  useSocketConnection();
  useRealtimeNotifications();
  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => createQueryClient());

  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''}>
      <QueryClientProvider client={queryClient}>
        <AuthHydrator><SocketProvider>{children}</SocketProvider></AuthHydrator>
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: '10px',
            background: '#1C1C1E',
            color: '#fff',
            fontSize: '14px',
            fontFamily: 'DM Sans, sans-serif',
          },
          success: {
            iconTheme: { primary: '#1A6B5A', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#E04B3A', secondary: '#fff' },
          },
        }}
      />
      </QueryClientProvider>
    </GoogleOAuthProvider>
  );
}
