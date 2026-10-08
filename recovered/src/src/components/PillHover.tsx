'use client';

import { CursorFollowPill, useCursorFollowPill } from '@/components/casestudy/CursorFollowPill';

/** A plain (non-link) block that names itself in the cursor-follow pill on
 *  hover — same pill as VaultLink / the project cards. */
export default function PillHover({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  const { mounted, on, pillRef, pillHandlers } = useCursorFollowPill();

  return (
    <>
      <div className={className} {...pillHandlers}>
        {children}
      </div>
      {mounted ? <CursorFollowPill pillRef={pillRef} on={on} label={label} /> : null}
    </>
  );
}
