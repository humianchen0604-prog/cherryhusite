'use client';

import { useEffect, useRef, useState } from 'react';
import { INTERACTIVE } from '@/components/ClickSpark';
import { getActiveNightCursorMode, subscribeNightCursorMode } from '@/lib/nightCursor';
import { startNightCursor } from './engine';

type Engine = { setMode: (mode: string) => void; destroy: () => void };

/**
 * Site-wide night cursor (home and case studies). Runs only while
 * `data-theme="dark"` on a real mouse/trackpad; light mode and touch get
 * nothing at all — no canvas, no listeners.
 *
 * While it runs, `<html data-night-cursor="stars|meteor|asteroid">` is set:
 * CSS uses it to hide the native pointer for the drawn cursors, and
 * ClickSpark uses it to step aside so clicks don't burst twice.
 */
export default function NightCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [active, setActive] = useState(false);

  // Follow the same data-theme the theme toggle writes, and the pointer type.
  useEffect(() => {
    const root = document.documentElement;
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    const sync = () => setActive(root.dataset.theme === 'dark' && fine.matches);
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    fine.addEventListener('change', sync);
    return () => {
      observer.disconnect();
      fine.removeEventListener('change', sync);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!active || !canvas) return;
    const root = document.documentElement;

    const engine = startNightCursor({
      canvas,
      initialMode: getActiveNightCursorMode(),
      hoverSelector: INTERACTIVE,
    }) as Engine;
    let shown = getActiveNightCursorMode();
    root.dataset.nightCursor = shown;

    // Fires for hover previews as well as saved picks.
    const unsubscribe = subscribeNightCursorMode(() => {
      const mode = getActiveNightCursorMode();
      if (mode === shown) return;
      shown = mode;
      engine.setMode(mode);
      root.dataset.nightCursor = mode;
    });

    return () => {
      unsubscribe();
      engine.destroy();
      delete root.dataset.nightCursor;
    };
  }, [active]);

  if (!active) return null;
  return <canvas ref={canvasRef} className="night-cursor-canvas" aria-hidden="true" />;
}
