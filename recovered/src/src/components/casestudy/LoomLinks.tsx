'use client';

import { useRef } from 'react';
import { useReducedMotion } from 'motion/react';
import { ArrowUpRightIcon, type ArrowUpRightIconHandle } from '@/components/icons/ArrowUpRightIcon';
import { CursorFollowPill, useCursorFollowPill } from '@/components/casestudy/CursorFollowPill';

/**
 * Overview link row — same pill pair Grumble uses: one outbound link that
 * carries a cursor-following "Open link" pill, one in-page jump that doesn't
 * (nothing opens, so there's nothing to promise).
 */
export default function LoomLinks({ prototypeUrl }: { prototypeUrl: string }) {
  const prototypeIcon = useRef<ArrowUpRightIconHandle>(null);
  const skipIcon = useRef<ArrowUpRightIconHandle>(null);
  const reduced = useReducedMotion();
  const { mounted, on, pillRef, pillHandlers } = useCursorFollowPill();

  return (
    <div className="loom-links">
      <a
        className="loom-pill loom-pill--filled"
        href={prototypeUrl}
        target="_blank"
        rel="noreferrer noopener"
        onMouseEnter={(e) => {
          pillHandlers.onMouseEnter(e);
          if (!reduced) prototypeIcon.current?.startAnimation();
        }}
        onMouseMove={pillHandlers.onMouseMove}
        onMouseLeave={() => {
          pillHandlers.onMouseLeave();
          if (!reduced) prototypeIcon.current?.stopAnimation();
        }}
      >
        {'Open prototype (desktop only)'}
        <ArrowUpRightIcon
          ref={prototypeIcon}
          size={12}
          className="loom-pill__arrow"
          aria-hidden="true"
        />
      </a>
      {mounted ? <CursorFollowPill pillRef={pillRef} on={on} label="Open link" /> : null}
      <a
        className="loom-pill"
        href="#solution"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById('solution')?.scrollIntoView({
            behavior: reduced ? 'auto' : 'smooth',
            block: 'start',
          });
        }}
        onMouseEnter={() => {
          if (!reduced) skipIcon.current?.startAnimation();
        }}
        onMouseLeave={() => {
          if (!reduced) skipIcon.current?.stopAnimation();
        }}
      >
        {'Skip to solution'}
        <ArrowUpRightIcon
          ref={skipIcon}
          size={12}
          className="loom-pill__arrow"
          aria-hidden="true"
        />
      </a>
    </div>
  );
}
