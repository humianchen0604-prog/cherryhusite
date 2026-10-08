'use client';

import { useEffect, useRef } from 'react';
import { MessageCircleMoreIcon, type MessageCircleMoreIconHandle } from '@/components/icons/MessageCircleMoreIcon';

// Original 1.5s pass, 25% slower, then another 75% slower on top.
const DURATION_S = 1.5 * 1.25 * 1.75;

/**
 * MessageCircleMoreIcon animates on hover elsewhere (see CaseStudyBody.tsx's
 * impact stat) — here it's the sole content of a note card with nothing to
 * hover, so this drives it on its own loop instead: fire it once on mount,
 * then again every DURATION_S (the animation's own duration) so each pass
 * starts right as the last one settles back to its resting state.
 */
export default function LoomNoteIcon() {
  const ref = useRef<MessageCircleMoreIconHandle>(null);

  useEffect(() => {
    ref.current?.startAnimation();
    const id = setInterval(() => ref.current?.startAnimation(), DURATION_S * 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="loom-note-card__icon">
      <MessageCircleMoreIcon ref={ref} size={22} duration={DURATION_S} />
    </div>
  );
}
