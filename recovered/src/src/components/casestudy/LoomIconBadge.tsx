'use client';

import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'motion/react';
import { UploadIcon, type UploadIconHandle } from '@/components/icons/UploadIcon';
import { Link2Icon, type Link2IconHandle } from '@/components/icons/Link2Icon';

/** Both icons expose the same start/stop pair, which is all the loop needs. */
type IconHandle = UploadIconHandle | Link2IconHandle;

const ICONS = {
  upload: UploadIcon,
  link: Link2Icon,
} as const;

/** How often the icon plays, and how long it holds before settling back. */
const CYCLE_MS = 2600;
const HOLD_MS = 700;

/**
 * A tinted circle holding one of the animated icons, sized to sit inline
 * against a title. Like LoomFoldersMark these play themselves — they're
 * decoration inside a heading, not something a reader would think to hover —
 * with hover kept working for anyone who does.
 *
 * `delayMs` offsets a badge from its neighbour so a row of them doesn't beat
 * in lockstep, which reads as mechanical rather than alive.
 */
export default function LoomIconBadge({
  icon,
  delayMs = 0,
}: {
  icon: keyof typeof ICONS;
  delayMs?: number;
}) {
  const handle = useRef<IconHandle>(null);
  const reduced = useReducedMotion();
  const Icon = ICONS[icon];

  useEffect(() => {
    if (reduced) return;

    let holdTimer: number | undefined;
    let cycle: number | undefined;

    const play = () => {
      handle.current?.startAnimation();
      holdTimer = window.setTimeout(() => handle.current?.stopAnimation(), HOLD_MS);
    };

    const start = window.setTimeout(() => {
      play();
      cycle = window.setInterval(play, CYCLE_MS);
    }, delayMs);

    return () => {
      window.clearTimeout(start);
      if (cycle != null) window.clearInterval(cycle);
      if (holdTimer != null) window.clearTimeout(holdTimer);
    };
  }, [reduced, delayMs]);

  return <Icon ref={handle} className="loom-badge" size={24} aria-hidden />;
}
