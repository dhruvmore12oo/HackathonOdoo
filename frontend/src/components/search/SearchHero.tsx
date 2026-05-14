'use client';

import { MapPin, Compass } from 'lucide-react';

export function SearchHero() {
  return (
    <section className="relative overflow-hidden rounded-2xl mb-8">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-700 via-brand-500 to-accent-400" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNCI+PHBhdGggZD0iTTM2IDM0djJIMjR2LTJoMTJ6bTAtOHYySDI0di0yaDEyem0wLTh2MkgyNHYtMmgxMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />

      {/* Floating decorative elements */}
      <div className="absolute top-6 right-8 w-20 h-20 rounded-full bg-white/10 blur-xl animate-pulse" />
      <div className="absolute bottom-4 left-12 w-16 h-16 rounded-full bg-accent-300/20 blur-lg" />

      <div className="relative z-10 px-6 py-12 sm:px-10 sm:py-16 text-center">
        <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-1.5 text-white/90 text-xs font-medium mb-5">
          <Compass className="h-3.5 w-3.5" />
          Explore destinations worldwide
        </div>

        <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-3 tracking-tight">
          Where do you want to go?
        </h1>
        <p className="text-white/80 text-base sm:text-lg max-w-xl mx-auto mb-2">
          Search cities across the globe. Discover stunning destinations and plan your next adventure.
        </p>

        <div className="flex items-center justify-center gap-2 text-white/60 text-xs mt-4">
          <MapPin className="h-3.5 w-3.5" />
          <span>Powered by real-time global city data</span>
        </div>
      </div>
    </section>
  );
}
