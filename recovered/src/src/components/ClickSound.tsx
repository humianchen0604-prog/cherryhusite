'use client';

import { useEffect } from 'react';
import { isMuted, playClick, primeSamples } from '@/lib/sfx';

/**
 * A tick on every click, site-wide.
 *
 * Fires on pointerdown rather than click: the sound belongs with the press, and
 * on touch `click` lands up to 100ms late, which reads as lag.
 */

/** Two clicks closer than this would crackle rather than sound twice. */
const MIN_INTERVAL_MS = 35;

export default function ClickSound() {
  useEffect(() => {
    let last = 0;
    let primed = false;

    function tick(e: PointerEvent) {
      if (e.button !== 0) return; // primary press only
      if (isMuted()) return;

      // The first gesture is the earliest an AudioContext may start, so it is
      // also the first chance to fetch the samples.
      if (!primed) {
        primed = true;
        primeSamples();
      }

      const now = performance.now();
      if (now - last < MIN_INTERVAL_MS) return;
      last = now;
      playClick();
    }

    document.addEventListener('pointerdown', tick);
    return () => document.removeEventListener('pointerdown', tick);
  }, []);

  return null;
}
