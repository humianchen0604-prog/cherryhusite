'use client';

import { CursorFollowPill, useCursorFollowPill } from '@/components/casestudy/CursorFollowPill';

/** Writing rows + "View all writings" — same cursor-follow pill as the vault. */
export default function WritingLink({
  children,
  ...props
}: React.ComponentProps<'a'>) {
  const { mounted, on, pillRef, pillHandlers } = useCursorFollowPill();

  return (
    <>
      <a target="_blank" rel="noopener noreferrer" {...props} {...pillHandlers}>
        {children}
      </a>
      {mounted ? (
        <CursorFollowPill pillRef={pillRef} on={on} label="Open writing" />
      ) : null}
    </>
  );
}
