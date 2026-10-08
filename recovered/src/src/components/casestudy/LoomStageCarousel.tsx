'use client';

import { useCallback, useRef, useState } from 'react';

export type LoomCarouselStage = {
  num: string;
  label: string;
  mediaLabel: string;
  videoSrc?: string;
  /** A static still instead of a clip — e.g. a single frame like the conflict
   *  panel's alert state, where there's no motion worth a video for. */
  imageSrc?: string;
};

/**
 * Iteration 01's before/in-progress/after panels as a horizontal, snap-scrolled
 * carousel instead of a static row: each slide is 85% of the track's width, so
 * the next one always peeks at the edge, and the dot bar below tracks whichever
 * slide is currently snapped into view. Media placeholder is a plain
 * <MediaSlot>-shaped block — swap it for <LoomVideo> per stage once the panel
 * recordings exist.
 *
 * The slide ratio (17 / 10) is chosen so an 85%-width slide renders at exactly
 * the same height as the flat "three states side by side" MediaSlot further
 * down this section (ratio 2400 / 1200 = 2 — 17/10 is that ratio × 0.85), so
 * the two placeholders read as the same size even though this one is
 * narrower. Keep this ratio in lockstep with .loom-carousel__slide's
 * flex-basis in loom.css — both derive from the same width fraction.
 */
export default function LoomStageCarousel({ stages }: { stages: LoomCarouselStage[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  /* offsetLeft is relative to the nearest POSITIONED ancestor, not to the
     scrolling track — since neither the track nor its slides set `position`,
     that ancestor is something far up the page, unrelated to track.scrollLeft.
     Comparing the two was comparing numbers from two different coordinate
     spaces, which desynced the active dot from whatever slide was actually
     snapped into view. getBoundingClientRect() diffs are always relative to
     the viewport, so track-relative position is just (child - track), valid
     regardless of what's positioned above either of them. */
  const childOffsetInTrack = (track: HTMLElement, child: HTMLElement) =>
    child.getBoundingClientRect().left - track.getBoundingClientRect().left + track.scrollLeft;

  const handleScroll = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const trackLeft = track.getBoundingClientRect().left;
    let closest = 0;
    let closestDist = Infinity;
    Array.from(track.children).forEach((child, i) => {
      const dist = Math.abs((child as HTMLElement).getBoundingClientRect().left - trackLeft);
      if (dist < closestDist) {
        closestDist = dist;
        closest = i;
      }
    });
    setActive(closest);
  }, []);

  const scrollToIndex = (i: number) => {
    const track = trackRef.current;
    const child = track?.children[i] as HTMLElement | undefined;
    if (track && child) track.scrollTo({ left: childOffsetInTrack(track, child), behavior: 'smooth' });
  };

  return (
    <div className="loom-carousel">
      <div className="loom-carousel__track" ref={trackRef} onScroll={handleScroll}>
        {stages.map((s) => (
          <div className="loom-carousel__slide" key={s.num}>
            {s.videoSrc ? (
              <div className="loom-carousel__media loom-carousel__media--fill" style={{ aspectRatio: '17 / 10' }}>
                <video src={s.videoSrc} loop muted playsInline preload="none" />
              </div>
            ) : s.imageSrc ? (
              <div className="loom-carousel__media loom-carousel__media--fill" style={{ aspectRatio: '17 / 10' }}>
                <img src={s.imageSrc} alt={s.mediaLabel} />
              </div>
            ) : (
              <div className="loom-slot loom-carousel__media" style={{ aspectRatio: '17 / 10' }}>
                <div className="loom-slot__inner">
                  <span className="loom-slot__kind">{'Video'}</span>
                  <span className="loom-slot__label">{s.mediaLabel}</span>
                </div>
              </div>
            )}
            <div className="loom-carousel__caption">
              <span className="loom-step__num">{s.num}</span>
              <span className="loom-step__label">{s.label}</span>
            </div>
          </div>
        ))}
      </div>

      <nav className="loom-carousel__dots" aria-label="Carousel progress">
        {stages.map((s, i) => (
          <button
            key={s.num}
            type="button"
            className={`loom-carousel__dot${active === i ? ' loom-carousel__dot--active' : ''}`}
            aria-label={`Go to slide ${i + 1}`}
            aria-current={active === i ? 'step' : undefined}
            onClick={() => scrollToIndex(i)}
          />
        ))}
      </nav>
    </div>
  );
}
