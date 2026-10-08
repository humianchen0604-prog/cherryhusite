'use client';

import { useRef } from 'react';
import { useReducedMotion } from 'motion/react';
import { ArrowUpRightIcon, type ArrowUpRightIconHandle } from '@/components/icons/ArrowUpRightIcon';
import { CursorFollowPill, useCursorFollowPill } from '@/components/casestudy/CursorFollowPill';

export default function GrumbleLinks({ devpostUrl }: { devpostUrl: string }) {
  const devpostIcon = useRef<ArrowUpRightIconHandle>(null);
  const skipIcon = useRef<ArrowUpRightIconHandle>(null);
  const reduced = useReducedMotion();
  const { mounted, on, pillRef, pillHandlers } = useCursorFollowPill();

  return (
    <div className="grumble-links">
      <a
        className="grumble-pill"
        href={devpostUrl}
        target="_blank"
        rel="noreferrer noopener"
        onMouseEnter={(e) => {
          pillHandlers.onMouseEnter(e);
          if (!reduced) devpostIcon.current?.startAnimation();
        }}
        onMouseMove={pillHandlers.onMouseMove}
        onMouseLeave={() => {
          pillHandlers.onMouseLeave();
          if (!reduced) devpostIcon.current?.stopAnimation();
        }}
      >
        <svg className="grumble-pill__brand" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M6.002 1.61 0 12.004 6.002 22.39h11.996L24 12.004 17.998 1.61zm1.593 4.084h3.947c3.605 0 6.276 1.695 6.276 6.31 0 4.436-3.21 6.302-6.456 6.302H7.595zm2.517 2.449v7.714h1.241c2.646 0 3.862-1.55 3.862-3.861.017-2.467-1.169-3.853-3.65-3.853z"
          />
        </svg>
        {'Check out Dev Post'}
        <ArrowUpRightIcon
          ref={devpostIcon}
          size={12}
          className="grumble-pill__arrow"
          aria-hidden="true"
        />
      </a>
      {mounted ? <CursorFollowPill pillRef={pillRef} on={on} label="Open site" /> : null}
      <a
        className="grumble-pill"
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
          className="grumble-pill__arrow"
          aria-hidden="true"
        />
      </a>
    </div>
  );
}
