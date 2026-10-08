import { playToggle } from '@/lib/sfx';

/**
 * Light/night switching, shared by every theme control on the site.
 *
 * The transition is jib.design's: a View Transition where the incoming theme is
 * revealed by a radial mask growing out of the control you clicked, while the
 * outgoing one blurs away behind it.
 */

export type Theme = 'light' | 'dark';
const STORAGE_KEY = 'theme';
/** Must match the soft edge in the mask (see --reveal-feather in globals.css). */
const REVEAL_FEATHER = 160;

export function readTheme(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

function applyTheme(next: Theme) {
  document.documentElement.dataset.theme = next;
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    /* private mode — the toggle still works for this session */
  }
}

/**
 * Flip to the other theme, revealing it from `origin`. `onApplied` runs at the
 * moment the theme actually changes (inside the view transition's update), so
 * React state set there lands in the new snapshot.
 */
export function switchTheme(origin: Element | null, onApplied?: (next: Theme) => void): Theme {
  const next: Theme = readTheme() === 'dark' ? 'light' : 'dark';
  playToggle(next === 'dark');
  const root = document.documentElement;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canTransition = typeof document.startViewTransition === 'function' && !reduced;

  if (!canTransition) {
    applyTheme(next);
    onApplied?.(next);
    return next;
  }

  // Grow the reveal from the control itself, and make the radius reach whichever
  // corner is furthest away so the mask always clears the viewport.
  const r = origin?.getBoundingClientRect();
  const x = r ? r.left + r.width / 2 : window.innerWidth / 2;
  const y = r ? r.top + r.height / 2 : window.innerHeight / 2;
  // The mask fades over REVEAL_FEATHER before its stated radius, so the fully
  // opaque edge has to travel that much further or the far corner — the one
  // diagonally opposite the switch — never fully lands.
  const toCorner = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
  const radius = toCorner + REVEAL_FEATHER;

  root.style.setProperty('--reveal-x', `${x}px`);
  root.style.setProperty('--reveal-y', `${y}px`);
  root.style.setProperty('--reveal-r', `${Math.ceil(radius)}px`);
  /*
   * Blurring the outgoing snapshot makes its outermost pixels semi-transparent
   * — and at a corner two edges compound, so it was compositing against the
   * incoming theme and leaving a grey fringe. Park the colour it is leaving
   * behind the whole transition so that bleed lands on the right colour.
   */
  root.style.setProperty('--vt-from-bg', getComputedStyle(root).getPropertyValue('--page-bg').trim());

  const transition = document.startViewTransition(() => {
    applyTheme(next);
    onApplied?.(next);
  });
  // A skipped transition (hidden tab, rapid re-click) rejects `ready`; the theme
  // has still been applied, so there is nothing to handle.
  transition.ready.catch(() => {});
  transition.finished.finally(() => {
    root.style.removeProperty('--reveal-x');
    root.style.removeProperty('--reveal-y');
    root.style.removeProperty('--reveal-r');
    root.style.removeProperty('--vt-from-bg');
  });
  return next;
}
