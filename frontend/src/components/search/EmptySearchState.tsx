'use client';

import { SearchX, RefreshCw, MapPin } from 'lucide-react';

interface EmptySearchStateProps {
  query: string;
  onRetry?: () => void;
}

export function EmptySearchState({ query, onRetry }: EmptySearchStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-in">
      <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-5">
        <SearchX className="h-8 w-8 text-gray-400" />
      </div>

      <h3 className="font-heading text-lg font-bold text-gray-900 mb-2">
        No destinations found
      </h3>
      <p className="text-sm text-gray-500 max-w-sm mb-6">
        We couldn&apos;t find any cities matching &ldquo;<span className="font-medium text-gray-700">{query}</span>&rdquo;. 
        Try a different search term or remove the country filter.
      </p>

      <div className="flex items-center gap-3">
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 text-white text-sm font-semibold rounded-lg hover:bg-brand-600 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
        )}
      </div>

      {/* Tips */}
      <div className="mt-10 w-full max-w-md">
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-3">Search tips</p>
        <div className="space-y-2">
          {[
            'Try searching for a well-known city name (e.g. Paris, Tokyo)',
            'Remove the country filter to search globally',
            'Use at least 2 characters for the search',
          ].map((tip, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-gray-500">
              <MapPin className="h-3.5 w-3.5 text-brand-400 shrink-0 mt-0.5" />
              <span>{tip}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
