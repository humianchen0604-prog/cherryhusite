'use client';

import { useSyncExternalStore } from 'react';

/**
 * Which night-mode cursor is on. One tiny store shared by the toggle (in the
 * home rail and the case-study gutter) and the canvas engine, remembered
 * across visits.
 */

export const NIGHT_CURSOR_MODES = ['stars', 'meteor', 'asteroid'] as const;
export type NightCursorMode = (typeof NIGHT_CURSOR_MODES)[number];

const STORAGE_KEY = 'night-cursor';
const listeners = new Set<() => void>();
let current: NightCursorMode | null = null;
/** Hovering an option in the picker tries it on without committing to it. */
let preview: NightCursorMode | null = null;

function isMode(value: unknown): value is NightCursorMode {
  return NIGHT_CURSOR_MODES.includes(value as NightCursorMode);
}

export function getNightCursorMode(): NightCursorMode {
  if (current) return current;
  let saved: string | null = null;
  try {
    saved = localStorage.getItem(STORAGE_KEY);
  } catch {
    /* private mode — fall back to the default */
  }
  current = isMode(saved) ? saved : 'stars';
  return current;
}

export function setNightCursorMode(next: NightCursorMode) {
  if (next === current) return;
  current = next;
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    /* private mode — still works for this session */
  }
  listeners.forEach((fn) => fn());
}

/** What the canvas should draw right now: the hovered option, else the saved one. */
export function getActiveNightCursorMode(): NightCursorMode {
  return preview ?? getNightCursorMode();
}

export function setNightCursorPreview(next: NightCursorMode | null) {
  if (next === preview) return;
  preview = next;
  listeners.forEach((fn) => fn());
}

export function subscribeNightCursorMode(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function useNightCursorMode(): NightCursorMode {
  return useSyncExternalStore(subscribeNightCursorMode, getNightCursorMode, () => 'stars');
}
