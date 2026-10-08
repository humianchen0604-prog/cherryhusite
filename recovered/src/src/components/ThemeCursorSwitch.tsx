'use client';

import { useEffect, useRef, useState, type KeyboardEvent, type MouseEvent } from 'react';
import { MoonIcon, SunMediumIcon, type ThemeIconHandle } from './ThemeIcons';
import { CursorFollowPill, useCursorFollowPill } from '@/components/casestudy/CursorFollowPill';
import { ICONS, LABELS } from '@/components/night-cursor/NightCursorToggle';
import { readTheme, switchTheme, type Theme } from '@/lib/theme';
import {
  NIGHT_CURSOR_MODES,
  setNightCursorMode,
  setNightCursorPreview,
  useNightCursorMode,
  type NightCursorMode,
} from '@/lib/nightCursor';

/**
 * Theme switch and night-cursor picker, side by side.
 *
 * "sun / moon" are two bare buttons in the LinkedIn / Resume / Email column:
 * the current mode is lit, and only the other one reacts to hover. In night
 * mode the cursor picker (Stars / Meteor / Asteroid) opens in its own frame to
 * the right — it only exists while it means something.
 *
 * Hovering a cursor option names it in the site's cursor-follow pill
 * ("Meteor") and tries it on live, so you see the effect before you pick it.
 *
 * The picker isn't always out. Switching to night opens it; if no cursor is
 * picked within 5s it folds away. Hovering (or focusing) the moon brings it
 * back, and it folds again shortly after the pointer leaves the switch. While
 * the pointer is anywhere on the switch it never closes.
 */

/** How long the picker stays out after switching to night, untouched. */
const OPEN_AFTER_SWITCH_MS = 5000;
/** Grace after the pointer leaves, so crossing the gap to the picker is safe. */
const CLOSE_AFTER_LEAVE_MS = 1200;

const MODE_LABEL: Record<Theme, string> = { light: 'Light mode', dark: 'Night mode' };

export default function ThemeCursorSwitch() {
  const mode = useNightCursorMode();
  const index = NIGHT_CURSOR_MODES.indexOf(mode);
  const sunRef = useRef<ThemeIconHandle>(null);
  const moonRef = useRef<ThemeIconHandle>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [theme, setTheme] = useState<Theme>('light');
  const [label, setLabel] = useState('');
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<number | undefined>(undefined);
  const inside = useRef(false);
  /** When the picker is due to fold; leaving never pulls this earlier. */
  const closeAt = useRef(0);
  const { mounted, on, pillRef, pillHandlers } = useCursorFollowPill({ above: true });

  useEffect(() => {
    setTheme(readTheme());
    return () => {
      window.clearTimeout(closeTimer.current);
      // A preview must never outlive the picker.
      setNightCursorPreview(null);
    };
  }, []);

  /* --- picker open / close ---------------------------------------------- */

  const cancelClose = () => window.clearTimeout(closeTimer.current);
  const closeIn = (ms: number) => {
    cancelClose();
    closeAt.current = Date.now() + ms;
    closeTimer.current = window.setTimeout(() => {
      // Never fold away from under the pointer; leaving schedules it again.
      if (inside.current) return;
      setOpen(false);
      setNightCursorPreview(null);
    }, ms);
  };
  const openPicker = () => {
    if (readTheme() !== 'dark') return;
    cancelClose();
    setOpen(true);
  };

  const onSwitchEnter = () => {
    inside.current = true;
    cancelClose();
  };
  const onSwitchLeave = () => {
    inside.current = false;
    // Still inside the 5s after switching? Keep that; otherwise a short grace.
    if (open) closeIn(Math.max(CLOSE_AFTER_LEAVE_MS, closeAt.current - Date.now()));
  };

  /* --- sun / moon ------------------------------------------------------- */

  const glyphFor = (t: Theme) => (t === 'dark' ? moonRef : sunRef).current;

  // No pill here: the two icons say what they are. Only the option you could
  // switch to plays its animation.
  const onModeEnter = (t: Theme) => () => {
    if (t !== readTheme()) glyphFor(t)?.startAnimation();
    // Hovering the moon while it's night brings the cursor picker back out.
    else if (t === 'dark') openPicker();
  };
  const onModeLeave = (t: Theme) => () => {
    glyphFor(t)?.stopAnimation();
  };

  const onModeClick = (t: Theme) => (e: MouseEvent<HTMLButtonElement>) => {
    if (t === readTheme()) return;
    const origin = e.currentTarget;
    setNightCursorPreview(null);
    glyphFor(t)?.stopAnimation();
    switchTheme(origin, (next) => {
      setTheme(next);
      if (next === 'dark') {
        setOpen(true);
        closeIn(OPEN_AFTER_SWITCH_MS);
      } else {
        cancelClose();
        setOpen(false);
      }
    });
  };

  /* --- cursor options --------------------------------------------------- */

  const onOptionEnter = (m: NightCursorMode) => (e: MouseEvent<HTMLButtonElement>) => {
    setLabel(LABELS[m]);
    pillHandlers.onMouseEnter(e);
    setNightCursorPreview(m);
  };

  // Leaving the whole track (not one option) ends the preview, so sliding
  // across the gaps between icons doesn't flicker back to the saved cursor.
  const onTrackLeave = () => {
    pillHandlers.onMouseLeave();
    setNightCursorPreview(null);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    let next: number | null = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (index + 1) % 3;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (index + 2) % 3;
    if (next === null) return;
    e.preventDefault();
    setNightCursorMode(NIGHT_CURSOR_MODES[next]);
    itemRefs.current[next]?.focus();
  };

  const dark = theme === 'dark';
  const shown = dark && open;

  const modeButton = (t: Theme) => (
    <button
      type="button"
      className="theme-switch__mode"
      aria-pressed={theme === t}
      aria-label={MODE_LABEL[t]}
      onClick={onModeClick(t)}
      onMouseEnter={onModeEnter(t)}
      onMouseLeave={onModeLeave(t)}
      onFocus={t === 'dark' ? openPicker : undefined}
    >
      {t === 'light' ? <SunMediumIcon ref={sunRef} size={14} /> : <MoonIcon ref={moonRef} size={14} />}
    </button>
  );

  return (
    <div
      className="theme-switch"
      data-open={shown ? 'true' : 'false'}
      onMouseEnter={onSwitchEnter}
      onMouseLeave={onSwitchLeave}
      onBlur={(e) => {
        // Keyboard: fold once focus leaves the whole switch.
        if (!e.currentTarget.contains(e.relatedTarget as Node | null) && open) closeIn(CLOSE_AFTER_LEAVE_MS);
      }}
    >
      <div className="theme-switch__modes" role="group" aria-label="Theme">
        {modeButton('light')}
        <svg className="theme-switch__slash" viewBox="0 0 6 14" fill="none" aria-hidden="true">
          <path d="M5 1.5 1 12.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        </svg>
        {modeButton('dark')}
      </div>

      <div className="theme-switch__cursors" inert={!shown}>
        <span className="theme-switch__frame" aria-hidden="true" />
        <div
          className="theme-switch__track"
          role="radiogroup"
          aria-label="Night cursor"
          style={{ '--i': index } as React.CSSProperties}
          onKeyDown={onKeyDown}
          onMouseLeave={onTrackLeave}
        >
          <span className="theme-switch__selection" aria-hidden="true" />
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
                aria-label={`${LABELS[m]} cursor`}
                tabIndex={checked ? 0 : -1}
                className="theme-switch__option"
                data-mode={m}
                style={{ '--n': i } as React.CSSProperties}
                onClick={() => setNightCursorMode(m)}
                onMouseEnter={onOptionEnter(m)}
                onMouseMove={pillHandlers.onMouseMove}
              >
                <Icon />
              </button>
            );
          })}
        </div>
      </div>

      {mounted ? <CursorFollowPill pillRef={pillRef} on={on} label={label} /> : null}
    </div>
  );
}
