'use client';

import { CursorFollowPill, useCursorFollowPill } from '@/components/casestudy/CursorFollowPill';

/**
 * Hovering the wordmark crossfades it into the same avatar clip that plays in
 * the About sticker board (AboutStickerBoard.tsx's "portrait" sticker) — a
 * little wave hello from the top-left corner. The wordmark box itself never
 * resizes; the video draws as a small circle centred inside it instead of
 * filling the whole (wide) box, so nothing stretches. Reverses the same way
 * on mouseleave. A cursor-follow pill (same primitive as "Open project" /
 * "Copy email" elsewhere) labels the hover "Hi, this is me".
 */
const AVATAR_SRC = '/assets/about-board/avatar.mp4';
const AVATAR_POSTER = '/assets/about-board/avatar-poster.jpg';

export default function Logo() {
  const { mounted, on, pillRef, pillHandlers } = useCursorFollowPill();

  return (
    <div className="ssr-variant">
      <div className="framer-igw7h1 logo-hover" data-framer-name="Logo" {...pillHandlers}>
        <div className="logo-hover__stage">
          <div className="logo-hover__face logo-hover__face--word" data-framer-background-image-wrapper="true">
            <img
              decoding="async"
              width="373"
              height="192"
              sizes="(min-width: 810px) 62px, 45px"
              src="/assets/images/cherry-hu-signature.png"
              alt="Cherry Hu"
              style={{ display: 'block', width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>
          <video
            className="logo-hover__face logo-hover__face--avatar"
            src={AVATAR_SRC}
            poster={AVATAR_POSTER}
            aria-label="Cherry, waving at the camera"
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
          />
        </div>
      </div>
      {mounted ? <CursorFollowPill pillRef={pillRef} on={on} label="Hi, this is me" /> : null}
    </div>
  );
}
