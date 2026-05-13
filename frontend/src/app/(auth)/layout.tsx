import type { Metadata } from 'next';
import Image from 'next/image';

export const metadata: Metadata = {
  title: {
    default: 'Sign In',
    template: '%s | Traveloop',
  },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left: Brand Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-500 via-brand-600 to-brand-700 relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white" />
          <div className="absolute bottom-10 left-10 w-60 h-60 rounded-full bg-white" />
          <div className="absolute top-1/3 left-1/4 w-40 h-40 rounded-full bg-white" />
        </div>
        <div className="relative z-10 text-white text-center px-12">
          <div className="flex justify-center mb-6">
            <div className="bg-white/95 rounded-2xl px-6 py-4 shadow-2xl backdrop-blur-sm">
              <Image src="/logo.png" alt="Traveloop" width={400} height={160} className="h-28 w-auto object-contain" priority />
            </div>
          </div>
          <p className="text-white/80 text-lg leading-relaxed max-w-md">
            Plan your perfect journey. Organize multi-city itineraries,
            track budgets, and share adventures with the community.
          </p>
          <div className="mt-10 flex items-center justify-center gap-8 text-white/60 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">30+</div>
              <div>Cities</div>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <div className="text-2xl font-bold text-white">25+</div>
              <div>Activities</div>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <div className="text-2xl font-bold text-white">∞</div>
              <div>Adventures</div>
            </div>
          </div>
        </div>
      </div>
      {/* Right: Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-background">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
