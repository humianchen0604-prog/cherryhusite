'use client';

import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'motion/react';
import { FoldersIcon, type FoldersIconHandle } from '@/components/icons/FoldersIcon';

/** How often the folders separate and settle back, and how long they stay apart. */
const CYCLE_MS = 3000;
const HOLD_MS = 700;

/**
 * The inline folders mark in the HMW title. Unlike the other case-study icons,
 * this one isn't waiting for a hover — it's punctuation inside a heading nobody
 * would think to point at, so it plays itself on a loop instead. Hover still
 * triggers it, which keeps it behaving like every other icon if someone does.
 */
export default function LoomFoldersMark({ size = 20 }: { size?: number }) {
  const icon = useRef<FoldersIconHandle>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;

    let holdTimer: number | undefined;

    const play = () => {
      icon.current?.startAnimation();
      holdTimer = window.setTimeout(() => icon.current?.stopAnimation(), HOLD_MS);
    };

    const cycle = window.setInterval(play, CYCLE_MS);
    return () => {
      window.clearInterval(cycle);
      if (holdTimer != null) window.clearTimeout(holdTimer);
    };
  }, [reduced]);

  return (
    <FoldersIcon
      ref={icon}
      className="loom-title-folders"
      size={size}
      aria-hidden
      onMouseEnter={() => icon.current?.startAnimation()}
      onMouseLeave={() => icon.current?.stopAnimation()}
    />
  );
}
