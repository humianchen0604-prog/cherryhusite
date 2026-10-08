'use client';

import { useEffect } from 'react';

const END_HOLD_ATTR = 'data-end-hold-ms';

/**
 * Framer ships every project video with `preload="none"` and starts it only once
 * it scrolls into view, pausing again on the way out. This reproduces that so the
 * page doesn't fetch ~68MB of video up front.
 *
 * Videos with `data-end-hold-ms` skip native looping: after the last frame they
 * sit there for that many milliseconds, then replay from the start.
 */
export default function VideoAutoplay() {
  useEffect(() => {
    // data-manual-controls opts a video out: it drives its own play/pause and
    // mute state, so this shouldn't force-mute it back to muted on every
    // scroll-into-view and undo a viewer's own unmute choice.
    const videos = Array.from(
      document.querySelectorAll<HTMLVideoElement>('video:not([data-manual-controls])'),
    );
    if (!videos.length) return;

    const inView = new Set<HTMLVideoElement>();
    const holdTimers = new WeakMap<HTMLVideoElement, number>();

    const clearHold = (v: HTMLVideoElement) => {
      const id = holdTimers.get(v);
      if (id == null) return;
      window.clearTimeout(id);
      holdTimers.delete(v);
    };

    const playFromStart = (v: HTMLVideoElement) => {
      v.currentTime = 0;
      v.play().catch(() => {
        /* autoplay can still be refused (e.g. reduced-data mode); leave the poster frame */
      });
    };

    const onEnded = (e: Event) => {
      const v = e.currentTarget as HTMLVideoElement;
      const holdMs = Number(v.getAttribute(END_HOLD_ATTR));
      if (!Number.isFinite(holdMs) || holdMs <= 0) return;
      if (!inView.has(v)) return;
      clearHold(v);
      holdTimers.set(
        v,
        window.setTimeout(() => {
          holdTimers.delete(v);
          if (inView.has(v)) playFromStart(v);
        }, holdMs)
      );
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const v = entry.target as HTMLVideoElement;
          if (entry.isIntersecting) {
            inView.add(v);
            if (v.preload !== 'auto') v.preload = 'auto';
            v.muted = true;
            if (v.ended) {
              playFromStart(v);
            } else {
              v.play().catch(() => {
                /* autoplay can still be refused (e.g. reduced-data mode); leave the poster frame */
              });
            }
          } else {
            inView.delete(v);
            clearHold(v);
            if (!v.paused) v.pause();
          }
        }
      },
      { rootMargin: '80px 0px' }
    );

    videos.forEach((v) => {
      if (v.hasAttribute(END_HOLD_ATTR)) {
        v.loop = false;
        v.addEventListener('ended', onEnded);
      }
      io.observe(v);
    });

    return () => {
      videos.forEach((v) => {
        v.removeEventListener('ended', onEnded);
        clearHold(v);
      });
      io.disconnect();
    };
  }, []);

  return null;
}
