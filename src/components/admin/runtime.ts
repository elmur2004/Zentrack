'use client';
/**
 * Browser-side helpers for the dashboard:
 * - run(): wraps a server action with offline/timeout detection.
 * - draft memory: unsaved text kept in memory (not storage) so it survives a language switch or a
 *   failed save, without persisting confidential text in the browser.
 * - notify(): visible toast + polite screen-reader announcement.
 */
import { useCallback, useEffect, useState } from 'react';
import type { ErrorCode } from '@/server/admin/errors';
import type { AdminMessages } from '@/i18n/admin';

export type ClientErrorCode = ErrorCode | 'offline' | 'timeout' | 'rate_limited';
export type Result<T> = { ok: true; data: T } | { ok: false; code: ClientErrorCode; details?: Record<string, string | number | boolean> };

export async function run<T>(fn: () => Promise<Result<T> | { ok: true; data: T } | { ok: false; code: ErrorCode; details?: Record<string, string | number | boolean> }>, timeoutMs = 20000): Promise<Result<T>> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return { ok: false, code: 'offline' };
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const timeout = new Promise<Result<T>>((resolve) => {
      timer = setTimeout(() => resolve({ ok: false, code: 'timeout' }), timeoutMs);
    });
    return (await Promise.race([fn(), timeout])) as Result<T>;
  } catch {
    return { ok: false, code: typeof navigator !== 'undefined' && navigator.onLine === false ? 'offline' : 'unavailable' };
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export function errorText(t: AdminMessages, code: ClientErrorCode, details?: Record<string, string | number | boolean>): string {
  const field = details?.field ? String(details.field) : '';
  const fields = t.errors.fields as Record<string, string>;
  if (code === 'validation' && field && fields[field]) return fields[field];
  return (t.errors as unknown as Record<string, string>)[code] ?? t.errors.unavailable;
}

// ---------------------------------------------------------------- drafts
const drafts = new Map<string, string>();

export function useDraft(key: string, initial = ''): [string, (v: string) => void, () => void] {
  const [value, setValue] = useState(() => drafts.get(key) ?? initial);
  const set = useCallback(
    (v: string) => {
      setValue(v);
      if (v && v !== initial) drafts.set(key, v);
      else drafts.delete(key);
    },
    [key, initial],
  );
  const clear = useCallback(() => {
    drafts.delete(key);
    setValue(initial);
  }, [key, initial]);
  return [value, set, clear];
}

export function hasUnsavedDrafts(): boolean {
  return drafts.size > 0;
}

// ---------------------------------------------------------------- inbox memory
/** Search text per list view (memory only; never in the URL) and the last list URL for "Back". */
export const listMemory: { search: Record<string, string>; lastListHref: string | null } = { search: {}, lastListHref: null };

/** Remembers a list's search text for this tab (memory only). */
export function rememberSearch(key: string, value: string) {
  listMemory.search[key] = value;
}

// ---------------------------------------------------------------- toasts
type Toast = { id: number; text: string; tone: 'ok' | 'error' | 'info' };
let toastId = 0;
const listeners = new Set<(t: Toast) => void>();

export function notify(text: string, tone: Toast['tone'] = 'ok') {
  const toast = { id: ++toastId, text, tone };
  listeners.forEach((l) => l(toast));
}

export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  useEffect(() => {
    const add = (t: Toast) => {
      setToasts((list) => [...list.slice(-2), t]);
      setTimeout(() => setToasts((list) => list.filter((x) => x.id !== t.id)), 5000);
    };
    listeners.add(add);
    return () => {
      listeners.delete(add);
    };
  }, []);
  return toasts;
}
