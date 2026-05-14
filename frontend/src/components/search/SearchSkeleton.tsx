'use client';

import { Skeleton } from '@/components/ui';

export function SearchSkeleton() {
  return (
    <div className="animate-in">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-24" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-gray-200 overflow-hidden bg-white"
          >
            {/* Image skeleton with shimmer */}
            <div className="relative aspect-[16/10] bg-gray-100 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-pulse" />
            </div>

            {/* Content skeleton */}
            <div className="p-4 space-y-2.5">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
