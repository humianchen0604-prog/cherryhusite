'use client';

import { useInView, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

/**
 * The overlapping avatars that sit inline after "more users" in the HMW
 * heading. They arrive one at a time, left to right, and the sentence opens up
 * to make room for each one — so the motion says the thing the sentence says:
 * users accumulating. Plays once when the heading scrolls into view.
 *
 * Geometry comes from scripts/split-avatar-stack.py, which measured it off the
 * Figma export — the offsets are deliberately uneven, so they are not a
 * computed step. Values are multiples of one avatar's diameter, so the whole
 * stack scales with the heading's font size.
 */
const AVATARS = [
  { src: '/assets/images/avatar-stack-1.png', left: 0 },
  { src: '/assets/images/avatar-stack-2.png', left: 0.5575 },
  { src: '/assets/images/avatar-stack-3.png', left: 0.93314 },
];

/** How far the rightmost avatar reaches once `n` of them have landed. */
const OPEN_WIDTH = [0, ...AVATARS.map((a) => a.left + 1)];

const POP_MS = 380;
const STAGGER_MS = 130;

export default function AvatarStack() {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const reduced = useReducedMotion();
  const [arrived, setArrived] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (reduced) {
      setArrived(AVATARS.length);
      return;
    }
    let cancelled = false;
    const timers = AVATARS.map((_, i) =>
      window.setTimeout(() => {
        if (!cancelled) setArrived(i + 1);
      }, i * STAGGER_MS),
    );
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [inView, reduced]);

  return (
    <span
      ref={ref}
      className="hmw-avatars"
      data-visible={inView || undefined}
      data-open={arrived > 0 || undefined}
      aria-hidden
      style={
        {
          '--open': OPEN_WIDTH[arrived],
          '--avatar-pop': `${POP_MS}ms`,
          '--avatar-stagger': `${STAGGER_MS}ms`,
        } as React.CSSProperties
      }
    >
      {AVATARS.map((avatar, i) => (
        <img
          key={avatar.src}
          className="hmw-avatars__face"
          src={avatar.src}
          alt=""
          width={160}
          height={160}
          style={{ '--i': i, '--left': avatar.left } as React.CSSProperties}
        />
      ))}
    </span>
  );
}
