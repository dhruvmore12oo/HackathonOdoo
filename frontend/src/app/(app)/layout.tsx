'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useAuthStore } from '@/stores/authStore';
import { useLogout } from '@/hooks/useAuth';
import { Avatar } from '@/components/ui';
import { NotificationBell } from '@/components/ui/NotificationBell';
import {
  LayoutDashboard, Map, Search, Globe, User, Plus, LogOut,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: ROUTES.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
  { href: ROUTES.TRIPS, label: 'My Trips', icon: Map },
  { href: ROUTES.SEARCH_CITIES, label: 'Search', icon: Search },
  { href: ROUTES.COMMUNITY, label: 'Community', icon: Globe },
  { href: ROUTES.PROFILE, label: 'Profile', icon: User },
];

function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const logout = useLogout();

  return (
    <div className="min-h-screen bg-background">
      {/* Top Nav */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-200">
        <div className="container-page flex items-center justify-between h-14">
          <Link href={ROUTES.DASHBOARD} className="flex items-center gap-2">
            <Image src="/logo.png" alt="Traveloop" width={130} height={36} className="h-9 w-auto object-contain" priority />
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                  pathname.startsWith(href)
                    ? 'bg-brand-50 text-brand-600'
                    : 'text-gray-600 hover:bg-gray-50'
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href={ROUTES.NEW_TRIP}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-500 text-white text-sm font-semibold rounded-lg hover:bg-brand-600 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New Trip</span>
            </Link>
            <NotificationBell />
            {user && (
              <Link href={ROUTES.PROFILE} className="flex items-center gap-2">
                <Avatar
                  src={user.profile_photo_url}
                  firstName={user.first_name}
                  lastName={user.last_name}
                  size="sm"
                />
              </Link>
            )}
            <button
              onClick={logout}
              className="hidden md:flex items-center text-gray-400 hover:text-gray-600 transition-colors p-1.5"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container-page py-6 pb-24 md:pb-6">{children}</main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-200">
        <div className="flex justify-around py-2">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-2 py-1 text-xs transition-colors',
                pathname.startsWith(href) ? 'text-brand-500' : 'text-gray-400'
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <AppShell>{children}</AppShell>
    </AuthGuard>
  );
}
