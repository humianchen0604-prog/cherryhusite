'use client';

import { useEffect, useState } from 'react';
import { CursorFollowPill, useCursorFollowPill } from '@/components/casestudy/CursorFollowPill';
import { CASE_STUDY_UNLOCK_EVENT } from '@/components/casestudy/caseStudyPassword';

const LOCKED_PILL = 'Reach out to unlock metrics';

export default function ImpactStats({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState(false);
  const { mounted, on, pillRef, pillHandlers } = useCursorFollowPill();

  useEffect(() => {
    const unlock = () => setUnlocked(true);
    window.addEventListener(CASE_STUDY_UNLOCK_EVENT, unlock);
    return () => window.removeEventListener(CASE_STUDY_UNLOCK_EVENT, unlock);
  }, []);

  return (
    <>
      <div
        className={`impact-stats${unlocked ? ' is-unlocked' : ''}`}
        {...(unlocked ? {} : pillHandlers)}
      >
        {children}
      </div>
      {mounted && !unlocked ? (
        <CursorFollowPill pillRef={pillRef} on={on} label={LOCKED_PILL} />
      ) : null}
    </>
  );
}
