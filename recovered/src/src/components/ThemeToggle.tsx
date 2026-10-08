'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { MoonIcon, SunMediumIcon, type ThemeIconHandle } from './ThemeIcons';
import { readTheme, switchTheme, type Theme } from '@/lib/theme';

/**
 * Light/dark switch as a text row ("Night mode"), styled like the LinkedIn /
 * Resume rows. Used where there is no cursor to pick (the mobile menu); the
 * desktop rail and case-study gutter use ThemeCursorSwitch instead.
 */

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('light');
  const [hovered, setHovered] = useState(false);
  const sunRef = useRef<ThemeIconHandle>(null);
  const moonRef = useRef<ThemeIconHandle>(null);
  const rowRef = useRef<HTMLButtonElement>(null);

  // Mirror whatever the pre-paint script in <head> already decided.
  useEffect(() => {
    setTheme(readTheme());
  }, []);

  const toggle = useCallback(() => {
    switchTheme(rowRef.current, setTheme);
  }, []);

  // Hovering the row plays the icon's own animation, same as the arrows above.
  const onEnter = () => {
    setHovered(true);
    (theme === 'dark' ? sunRef : moonRef).current?.startAnimation();
  };
  const onLeave = () => {
    setHovered(false);
    (theme === 'dark' ? sunRef : moonRef).current?.stopAnimation();
  };

  // Names the destination: the dark side is called "Night".
  const label = theme === 'dark' ? 'Light' : 'Night';

  return (
    <button
      ref={rowRef}
      type="button"
      className="framer-q9vgl8 theme-toggle"
      aria-label={`Switch to ${label.toLowerCase()} theme`}
      onClick={toggle}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onFocus={onEnter}
      onBlur={onLeave}
      style={{ opacity: hovered ? 1 : 0.36 }}
    >
      <span className="theme-toggle__icon">
        {/* Both name the destination: in light mode you see the moon and "Dark
            mode", because that is what clicking gets you. */}
        {/* 13 -> 11.7: 10% smaller, matching the LinkedIn/Resume icons above. */}
        {theme === 'dark' ? (
          <SunMediumIcon ref={sunRef} size={11.7} />
        ) : (
          <MoonIcon ref={moonRef} size={11.7} />
        )}
      </span>
      <span className="theme-toggle__label">{label} mode</span>
    </button>
  );
}
