'use client';

import { useRef, type KeyboardEvent } from 'react';
import {
  NIGHT_CURSOR_MODES,
  setNightCursorMode,
  useNightCursorMode,
  type NightCursorMode,
} from '@/lib/nightCursor';

/**
 * Stars / Meteor / Asteroid picker for the night cursor. Icon-only segmented
 * control with a sliding selection; CSS shows it only in night mode on a fine
 * pointer (see `.night-cursor-toggle` in globals.css).
 *
 * It is a radio group with a roving tabindex: arrow keys move the selection
 * itself, so the sliding highlight doubles as the focus indicator.
 */

export const LABELS: Record<NightCursorMode, string> = {
  stars: 'Stars',
  meteor: 'Meteor',
  asteroid: 'Asteroid',
};

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {/* Even four-point star: equal arms, concave sides, rounded tips */}
      <path
        transform="translate(12 12) scale(0.75) translate(-12 -12)"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        d="M12 3 C13 8.6 15.4 11 21 12 C15.4 13 13 15.4 12 21 C11 15.4 8.6 13 3 12 C8.6 11 11 8.6 12 3 Z"
      />
    </svg>
  );
}

function MeteorIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <linearGradient id="night-cursor-meteor-tail" x1="3.5" y1="3.5" x2="16" y2="16" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="currentColor" stopOpacity="0" />
          <stop offset="1" stopColor="currentColor" stopOpacity=".6" />
        </linearGradient>
      </defs>
      {/* Tail + ball morph as one piece, so the tail's rounded front always
          sits exactly on the ball's edge, round or stretched. */}
      <g className="meteor-icon__body">
        {/* Teardrop: leaves the ball on its tangents (r 4.2 at 16,16), and
            its front is the ball's own arc */}
        <path
          fill="url(#night-cursor-meteor-tail)"
          d="M18.97 13.03 A4.2 4.2 0 0 1 13.03 18.97 L4.13 4.52 Q3.5 3.5 4.52 4.13 Z"
        />
        {/* Hover: dashes of light that run down the tail into the ball */}
        <line
          className="meteor-icon__glint"
          x1="4.6"
          y1="4.6"
          x2="14"
          y2="14"
          stroke="url(#night-cursor-meteor-tail)"
          strokeWidth="1.1"
          strokeLinecap="round"
          strokeDasharray="2.5 7"
        />
        <circle cx="16" cy="16" r="4.2" fill="currentColor" />
      </g>
    </svg>
  );
}

function AsteroidIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        {/* Craters are cut out of the rock, so they read on any background */}
        <mask id="night-cursor-asteroid-craters" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
          <rect width="24" height="24" fill="#fff" />
          <circle cx="10.1" cy="8.4" r="1.25" fill="#000" />
          <ellipse cx="15.3" cy="11.6" rx="1.05" ry="1.5" transform="rotate(20 15.3 11.6)" fill="#000" />
          <circle cx="9.2" cy="14.3" r="2" fill="#000" />
        </mask>
      </defs>
      <path
        fill="currentColor"
        mask="url(#night-cursor-asteroid-craters)"
        d="M9.52 5.19 Q12.00 3.10 14.50 5.14 Q17.53 5.41 18.15 8.45 Q20.86 10.44 19.29 13.28 Q19.53 16.35 16.63 17.52 Q15.06 20.41 12.00 19.35 Q9.08 20.03 7.47 17.40 Q4.34 16.43 4.81 13.27 Q3.43 10.49 5.81 8.43 Q6.34 5.26 9.52 5.19 Z"
      />
    </svg>
  );
}

export const ICONS: Record<NightCursorMode, () => React.ReactElement> = {
  stars: StarIcon,
  meteor: MeteorIcon,
  asteroid: AsteroidIcon,
};

export default function NightCursorToggle({ className = '' }: { className?: string }) {
  const mode = useNightCursorMode();
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const index = NIGHT_CURSOR_MODES.indexOf(mode);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    let next: number | null = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (index + 1) % 3;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (index + 2) % 3;
    if (next === null) return;
    e.preventDefault();
    setNightCursorMode(NIGHT_CURSOR_MODES[next]);
    itemRefs.current[next]?.focus();
  };

  return (
    <div
      className={`night-cursor-toggle ${className}`.trim()}
      role="radiogroup"
      aria-label="Night cursor"
      style={{ '--i': index } as React.CSSProperties}
      onKeyDown={onKeyDown}
    >
      <span className="night-cursor-toggle__pill" aria-hidden="true" />
      {NIGHT_CURSOR_MODES.map((m, i) => {
        const Icon = ICONS[m];
        const checked = m === mode;
        return (
          <button
            key={m}
            ref={(el) => {
              itemRefs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            aria-label={LABELS[m]}
            title={LABELS[m]}
            tabIndex={checked ? 0 : -1}
            className="night-cursor-toggle__item"
            data-mode={m}
            onClick={() => setNightCursorMode(m)}
          >
            <Icon />
          </button>
        );
      })}
    </div>
  );
}
