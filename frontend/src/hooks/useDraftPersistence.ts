'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const DRAFT_PREFIX = 'traveloop_draft_';
const MAX_DRAFTS = 10;
const DEBOUNCE_MS = 2000;

interface DraftMeta<T> {
  data: T;
  savedAt: number;
  version: number;
}

/**
 * Persist form data to localStorage with debounced auto-save.
 * Use with react-hook-form's watch() to auto-save on every change.
 */
export function useDraftPersistence<T extends Record<string, unknown>>(draftKey: string) {
  const fullKey = `${DRAFT_PREFIX}${draftKey}`;
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [hasDraft, setHasDraft] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check for existing draft on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(fullKey);
      setHasDraft(!!raw);
    } catch {
      setHasDraft(false);
    }
  }, [fullKey]);

  // Get saved draft
  const getSavedDraft = useCallback((): T | null => {
    try {
      const raw = localStorage.getItem(fullKey);
      if (!raw) return null;
      const meta: DraftMeta<T> = JSON.parse(raw);
      // Ignore drafts older than 7 days
      if (Date.now() - meta.savedAt > 7 * 24 * 60 * 60 * 1000) {
        localStorage.removeItem(fullKey);
        setHasDraft(false);
        return null;
      }
      return meta.data;
    } catch {
      return null;
    }
  }, [fullKey]);

  // Save draft (debounced)
  const saveDraft = useCallback((data: T) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      try {
        const meta: DraftMeta<T> = {
          data,
          savedAt: Date.now(),
          version: 1,
        };
        localStorage.setItem(fullKey, JSON.stringify(meta));
        setLastSavedAt(new Date());
        setHasDraft(true);
        evictOldDrafts();
      } catch {
        // localStorage full or unavailable — fail silently
      }
    }, DEBOUNCE_MS);
  }, [fullKey]);

  // Clear draft
  const clearDraft = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    try {
      localStorage.removeItem(fullKey);
    } catch { /* ignore */ }
    setHasDraft(false);
    setLastSavedAt(null);
  }, [fullKey]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { getSavedDraft, saveDraft, clearDraft, hasDraft, lastSavedAt };
}

/** Evict oldest drafts if we exceed MAX_DRAFTS */
function evictOldDrafts() {
  try {
    const keys: { key: string; savedAt: number }[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(DRAFT_PREFIX)) {
        try {
          const meta = JSON.parse(localStorage.getItem(key) || '');
          keys.push({ key, savedAt: meta.savedAt || 0 });
        } catch {
          keys.push({ key, savedAt: 0 });
        }
      }
    }
    if (keys.length > MAX_DRAFTS) {
      keys.sort((a, b) => a.savedAt - b.savedAt);
      const toRemove = keys.slice(0, keys.length - MAX_DRAFTS);
      toRemove.forEach(({ key }) => localStorage.removeItem(key));
    }
  } catch { /* ignore */ }
}
