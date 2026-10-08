'use client';

import { CursorFollowPill, useCursorFollowPill } from '@/components/casestudy/CursorFollowPill';

const HREF = 'https://www.lemon8-app.com';

export default function Lemon8Highlight() {
  const { mounted, on, pillRef, pillHandlers } = useCursorFollowPill();

  return (
    <>
      <a
        className="lemon8-highlight"
        href={HREF}
        target="_blank"
        rel="noopener noreferrer"
        {...pillHandlers}
      >
        Lemon8
      </a>
      {mounted ? <CursorFollowPill pillRef={pillRef} on={on} label="Open site" /> : null}
    </>
  );
}
