'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import ThemeCursorSwitch from './ThemeCursorSwitch';
import { openResume } from '@/lib/links';

/**
 * The fixed LinkedIn / Resume / Email / X rows in the bottom-left corner,
 * with Night mode sitting 100px below them as its own row.
 *
 * All four rows sit faded and come up to full black on hover. Their icons
 * animate on the same spring the rest of the site uses for this kind of nudge
 * (stiffness 200, damping 10, mass 1): the LinkedIn, Email and X arrows travel
 * along the same up-right diagonal (those rows leave the page), the Resume
 * arrow dips into its tray. Tapping Resume plays the dip and releases it
 * again after 400ms, so touch devices see the motion too.
 */

// The spring above, sampled as a `linear()` easing so no animation library is
// needed. It overshoots to ~1.3 and rings out; the tail past 700ms is sub-pixel.
const SPRING =
  'linear(0, 0.057, 0.2046, 0.4066, 0.6289, 0.8427, 1.0263, 1.1665, 1.2574, ' +
  '1.3001, 1.3004, 1.2678, 1.2131, 1.1472, 1.0797, 1.0185, 0.9687, 0.9334, ' +
  '0.9132, 0.907, 0.9123, 0.926, 0.9448, 0.9655, 0.9854, 1.0025, 1.0155, 1.024, 1)';
const SPRING_MS = 700;
const TAP_RELEASE_MS = 400;

const iconTransition = `transform ${SPRING_MS}ms ${SPRING}`;
const rowTransition = 'opacity 200ms ease';

const TEXT_STYLE: React.CSSProperties = {
  '--font-selector': 'RlM7U3dpdHplci1yZWd1bGFy',
  '--framer-font-family': '"Switzer", "Switzer Placeholder", sans-serif',
  '--framer-font-size': '12px',
  // Leading is authored in px here (the rest of the page uses %, which follows
  // font-size on its own), so it has to be scaled explicitly or the rows crowd
  // together once the type steps up.
  '--framer-line-height': 'calc(16.5px * var(--text-scale, 1))',
} as React.CSSProperties;

// At rest the original nests two 0.6 layers (the group and the row), so the rows
// render at 0.36. The group is flattened to 1 here so hover can actually reach
// full black; the row carries the combined resting value instead.
const REST_OPACITY = 0.36;

/** Tracks hover/focus, plus a momentary "pressed" pulse for taps. */
function useNudge() {
  const [active, setActive] = useState(false);
  const [held, setHeld] = useState(false);
  const timer = useRef<number | null>(null);

  const clear = useCallback(() => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  const pulse = useCallback(() => {
    clear();
    setHeld(true);
    timer.current = window.setTimeout(() => setHeld(false), TAP_RELEASE_MS);
  }, [clear]);

  useEffect(() => clear, [clear]);

  return {
    on: active || held,
    handlers: {
      onMouseEnter: () => { clear(); setActive(true); },
      onMouseLeave: () => { clear(); setActive(false); setHeld(false); },
      onFocus: () => setActive(true),
      onBlur: () => setActive(false),
      onClick: pulse,
      onTouchStart: pulse,
    },
  };
}

/** Icons track --text-scale so they grow with the labels beside them. */
const iconBox = (px: number): React.CSSProperties => ({
  position: 'relative',
  width: `calc(${px}px * var(--text-scale, 1))`,
  height: `calc(${px}px * var(--text-scale, 1))`,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  touchAction: 'manipulation',
});

const STROKE = {
  stroke: 'rgb(0, 0, 0)',
  strokeWidth: '1.5',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

export default function BottomLinks() {
  const linkedin = useNudge();
  const email = useNudge();
  const resume = useNudge();
  const x = useNudge();

  // The rows clip their overflow by default, which would cut the moving arrows.
  const row: React.CSSProperties = { overflow: 'visible', transition: rowTransition };

  return (
    <div className="framer-avs2fy hidden-1q647kq" data-framer-name="Bottom">
      <div className="framer-18ll6rj" data-framer-name="Frame 3">
        <div className="framer-21asa9" data-framer-name="Link" style={{ opacity: 1 }}>
          <a
            className="framer-f6wiou framer-1dt80g9"
            href="https://www.linkedin.com/in/cherryhu0604"
            target="_blank"
            rel="noopener noreferrer"
            tabIndex={0}
            style={{ ...row, opacity: linkedin.on ? 1 : REST_OPACITY }}
            data-active={linkedin.on ? 'true' : undefined}
            {...linkedin.handlers}
          >
            <div className="framer-170o46f-container">
              {/* 16 -> 14.4: 10% smaller. The box is flex-start in its row, so
                  shrinking it doesn't shift its left edge — it stays aligned
                  with the Resume and Night-mode icons below. */}
              <div style={iconBox(14.4)}>
                <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ overflow: 'visible' }}>
                  {/* The arrow points up-right, so it leaves along that diagonal. */}
                  <g
                    style={{
                      transform: linkedin.on ? 'translate(2px, -2px)' : 'translate(0px, 0px)',
                      transition: iconTransition,
                    }}
                  >
                    <path d="M7 7H17" {...STROKE} />
                    <path d="M17 7V17" {...STROKE} />
                    <path d="M7 17L17 7" {...STROKE} />
                  </g>
                </svg>
              </div>
            </div>
            <div
              className="framer-1elng6c"
              data-framer-name="LinkedIn"
              data-framer-component-type="RichTextContainer"
              style={{ justifyContent: 'center', transform: 'none' }}
            >
              <p dir="auto" style={TEXT_STYLE} className="framer-text">
                LinkedIn
              </p>
            </div>
          </a>

          <div
            className="framer-q9vgl8"
            role="button"
            tabIndex={0}
            style={{ ...row, opacity: resume.on ? 1 : REST_OPACITY }}
            data-active={resume.on ? 'true' : undefined}
            {...resume.handlers}
            // The tap animation still plays; the click also opens the résumé.
            onClick={() => { resume.handlers.onClick(); openResume(); }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); resume.handlers.onClick(); openResume(); }
            }}
          >
            <div className="framer-bnt257-container">
              {/* 15 -> 13.5: 10% smaller, same left-alignment reasoning as above. */}
              <div style={iconBox(13.5)}>
                <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ overflow: 'visible' }}>
                  {/* Tray stays put; only the arrow dips into it. */}
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" {...STROKE} />
                  <g
                    style={{
                      transform: resume.on ? 'translateY(2px)' : 'translateY(0px)',
                      transition: iconTransition,
                    }}
                  >
                    <polyline points="7 10 12 15 17 10" {...STROKE} />
                    <line x1="12" y1="15" x2="12" y2="3" {...STROKE} />
                  </g>
                </svg>
              </div>
            </div>
            <div
              className="framer-15lcj4k"
              data-framer-name="Resume"
              data-framer-component-type="RichTextContainer"
              style={{ justifyContent: 'center', transform: 'none' }}
            >
              <p dir="auto" style={TEXT_STYLE} className="framer-text">
                Resume
              </p>
            </div>
          </div>

          <a
            className="framer-f6wiou framer-1dt80g9"
            href="mailto:bycherr1hu@gmail.com"
            tabIndex={0}
            style={{ ...row, opacity: email.on ? 1 : REST_OPACITY }}
            data-active={email.on ? 'true' : undefined}
            {...email.handlers}
          >
            <div className="framer-170o46f-container">
              <div style={iconBox(14.4)}>
                <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ overflow: 'visible' }}>
                  {/* Same up-right arrow as LinkedIn — this row also leaves the page. */}
                  <g
                    style={{
                      transform: email.on ? 'translate(2px, -2px)' : 'translate(0px, 0px)',
                      transition: iconTransition,
                    }}
                  >
                    <path d="M7 7H17" {...STROKE} />
                    <path d="M17 7V17" {...STROKE} />
                    <path d="M7 17L17 7" {...STROKE} />
                  </g>
                </svg>
              </div>
            </div>
            <div
              className="framer-1elng6c"
              data-framer-name="Email"
              data-framer-component-type="RichTextContainer"
              style={{ justifyContent: 'center', transform: 'none' }}
            >
              <p dir="auto" style={TEXT_STYLE} className="framer-text">
                Email
              </p>
            </div>
          </a>

          <a
            className="framer-f6wiou framer-1dt80g9"
            href="https://x.com/bycherr1hu"
            target="_blank"
            rel="noopener noreferrer"
            tabIndex={0}
            style={{ ...row, opacity: x.on ? 1 : REST_OPACITY }}
            data-active={x.on ? 'true' : undefined}
            {...x.handlers}
          >
            <div className="framer-170o46f-container">
              <div style={iconBox(14.4)}>
                <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ overflow: 'visible' }}>
                  <g
                    style={{
                      transform: x.on ? 'translate(2px, -2px)' : 'translate(0px, 0px)',
                      transition: iconTransition,
                    }}
                  >
                    <path d="M7 7H17" {...STROKE} />
                    <path d="M17 7V17" {...STROKE} />
                    <path d="M7 17L17 7" {...STROKE} />
                  </g>
                </svg>
              </div>
            </div>
            <div
              className="framer-1elng6c"
              data-framer-name="X"
              data-framer-component-type="RichTextContainer"
              style={{ justifyContent: 'center', transform: 'none' }}
            >
              <p dir="auto" style={TEXT_STYLE} className="framer-text">
                X
              </p>
            </div>
          </a>

        </div>
        <div className="bottom-meta">
          {/* Theme + night cursor in one frame; grows rightward in night mode. */}
          <ThemeCursorSwitch />
        </div>
      </div>
    </div>
  );
}
