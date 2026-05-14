'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  isLoading?: boolean;
  placeholder?: string;
}

export function SearchInput({ value, onChange, isLoading, placeholder = 'Search cities...' }: SearchInputProps) {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClear = useCallback(() => {
    onChange('');
    inputRef.current?.focus();
  }, [onChange]);

  // Keyboard shortcut: / to focus
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  return (
    <div
      className={cn(
        'relative flex items-center w-full bg-white border-2 rounded-xl transition-all duration-200 shadow-sm',
        focused
          ? 'border-brand-500 shadow-brand-500/10 shadow-lg'
          : 'border-gray-200 hover:border-gray-300',
      )}
    >
      <div className="flex items-center justify-center w-12 h-12 shrink-0">
        {isLoading ? (
          <Loader2 className="h-5 w-5 text-brand-500 animate-spin" />
        ) : (
          <Search className="h-5 w-5 text-gray-400" />
        )}
      </div>

      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        className="flex-1 h-12 bg-transparent text-gray-900 text-base placeholder:text-gray-400 focus:outline-none font-medium"
        aria-label="Search cities"
        id="city-search-input"
        autoComplete="off"
      />

      {value && (
        <button
          onClick={handleClear}
          className="flex items-center justify-center w-10 h-10 mr-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      {!value && !focused && (
        <div className="hidden sm:flex items-center mr-3">
          <kbd className="px-2 py-0.5 text-xs font-mono text-gray-400 bg-gray-100 rounded border border-gray-200">/</kbd>
        </div>
      )}
    </div>
  );
}
