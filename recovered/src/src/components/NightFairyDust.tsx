'use client';

import { useEffect, useState } from 'react';
import FairyDustCursor from './FairyDustCursor';

/** Light yellows for night-mode fairy dust — warm, soft, starry. */
const YELLOW_HUES = [
  '#FFF8D6',
  '#FFE9A8',
  '#FFF1B8',
  '#F5E6A0',
  '#FFE566',
  '#FFF3C4',
  '#F0D878',
];

/**
 * Home-only night-mode cursor trail. Mounts the fairy-dust canvas while
 * `data-theme="dark"` and tears it down on light mode / reduced motion.
 */
export default function NightFairyDust() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => {
      setActive(
        document.documentElement.dataset.theme === 'dark' && !reduced.matches,
      );
    };
    sync();

    const themeObserver = new MutationObserver(sync);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    reduced.addEventListener('change', sync);

    return () => {
      themeObserver.disconnect();
      reduced.removeEventListener('change', sync);
    };
  }, []);

  if (!active) return null;

  return (
    <FairyDustCursor
      colors={YELLOW_HUES}
      particleSize={14}
      particleCount={3}
      maxParticles={16}
      gravity={0.008}
      fadeSpeed={0.948}
      initialVelocity={{ min: 0.02, max: 0.14 }}
      spawnDistance={12}
    />
  );
}
