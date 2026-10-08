'use client';

import { useSyncExternalStore } from 'react';

/**
 * The landing-page versions shown on /explorations, one at a time, picked from
 * the side nav (ExplorationSwitch). The pick lives in the URL (?v=tulip) so a
 * version can be linked to directly, and is remembered for the next visit.
 *
 *  - current      the live hero: blue sky gradient + layered photo cloud
 *  - Sunset sky   coral/mauve sunset band with one of three cloud renderers
 *                 (SunsetClouds + clouds/*), recovered from Sep 28
 *  - Hero         decorations to the right of the intro copy, from
 *                 _archive/hero-decorations and _playground/tulip-dots
 */

export type ExplorationId =
  | 'current'
  | 'volumetric'
  | 'particles'
  | 'illustrated'
  | 'tulip'
  | 'sparkle'
  | 'flowers'
  | 'shapes';

export type SunsetStyle = 'volumetric' | 'particles' | 'illustrated';

export const EXPLORATION_GROUPS: readonly {
  caption: string | null;
  /** Shown under the caption while in dark mode. */
  darkHint?: string;
  items: readonly { id: ExplorationId; label: string }[];
}[] = [
  { caption: null, items: [{ id: 'current', label: 'Current' }] },
  {
    caption: 'Sunset sky',
    darkHint: 'Light mode only',
    items: [
      { id: 'volumetric', label: 'Volumetric' },
      { id: 'particles', label: 'Particles' },
      { id: 'illustrated', label: 'Illustrated' },
    ],
  },
  {
    caption: 'Hero',
    items: [
      { id: 'tulip', label: 'Tulip' },
      { id: 'sparkle', label: 'Sparkle dots' },
      { id: 'flowers', label: 'Flower curve' },
      { id: 'shapes', label: 'Shapes' },
    ],
  },
];

export const EXPLORATION_IDS: readonly ExplorationId[] = EXPLORATION_GROUPS.flatMap((g) =>
  g.items.map((i) => i.id),
);

export function sunsetStyleOf(id: ExplorationId): SunsetStyle | null {
  return id === 'volumetric' || id === 'particles' || id === 'illustrated' ? id : null;
}

const STORAGE_KEY = 'exploration';
const PARAM = 'v';
const DEFAULT: ExplorationId = 'current';
const listeners = new Set<() => void>();
let current: ExplorationId | null = null;

function isId(value: unknown): value is ExplorationId {
  return EXPLORATION_IDS.includes(value as ExplorationId);
}

function getExploration(): ExplorationId {
  if (current) return current;
  const fromUrl = new URLSearchParams(window.location.search).get(PARAM);
  let saved: string | null = null;
  try {
    saved = localStorage.getItem(STORAGE_KEY);
  } catch {
    /* private mode — fall back to the default */
  }
  current = isId(fromUrl) ? fromUrl : isId(saved) ? saved : DEFAULT;
  return current;
}

export function setExploration(next: ExplorationId) {
  if (next === current) return;
  current = next;
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    /* private mode — still works for this visit */
  }
  const url = new URL(window.location.href);
  url.searchParams.set(PARAM, next);
  window.history.replaceState(window.history.state, '', url);
  listeners.forEach((fn) => fn());
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function useExploration(): ExplorationId {
  return useSyncExternalStore(subscribe, getExploration, () => DEFAULT);
}
