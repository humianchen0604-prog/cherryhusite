'use client';

import { useEffect, useRef, useState } from 'react';
import PixelBlast from './PixelBlast';

/*
 * One cycle, strictly in sequence — the mark and the video are never on screen
 * together:
 *   logo     the mark is on screen at 92% from the first frame and grows to 100%
 *            (it never starts from nothing) and holds
 *   toVideo  the mark fades out, quickly; nothing is shown
 *   video    the flow video fades in and plays through to its last frame
 *   toLogo   the video fades out; nothing is shown, then the mark grows in again
 */
type Phase = 'logo' | 'toVideo' | 'video' | 'toLogo';
const DURATIONS: Record<Phase, number> = {
  logo: 2000,
  toVideo: 220, // a hair longer than the mark's 180ms exit, so it is fully gone
  // Not a real length: the video runs until it ends (onEnded below). This is only
  // a backstop in case it stalls and never reports the end.
  video: 45000,
  toLogo: 290, // the video's 280ms exit; the mark takes over the moment it is gone
};
const NEXT: Record<Phase, Phase> = { logo: 'toVideo', toVideo: 'video', video: 'toLogo', toLogo: 'logo' };
const VIDEO_FADE_MS = 280;

/**
 * The loop on the card: the TikTok mark, then the flow video filling the frame,
 * played all the way through, then back, forever (see the sequence above). It only runs while the card is on
 * screen, and reduced motion gets the still mark. The video opts out of the
 * page-level <VideoAutoplay> (data-manual-controls) — this owns its play/pause so
 * the clip always starts from frame 0.
 */
function TikTokLoop() {
  const rootRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [phase, setPhase] = useState<Phase>('logo');
  // False for the first frames of the logo phase: the mark sits at 92% first,
  // then this flips and it grows to 100%.
  const [grown, setGrown] = useState(false);
  const [inView, setInView] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Fetch the clip only once the card is seen, so the home page does not pull
  // ~10MB up front.
  useEffect(() => {
    const v = videoRef.current;
    if (inView && !reduced && v && v.preload !== 'auto') {
      v.preload = 'auto';
      v.load();
    }
  }, [inView, reduced]);

  useEffect(() => {
    if (!inView || reduced) {
      setPhase('logo');
      return;
    }
    const id = window.setTimeout(() => setPhase(NEXT[phase]), DURATIONS[phase]);
    return () => window.clearTimeout(id);
  }, [phase, inView, reduced]);

  useEffect(() => {
    if (phase !== 'logo' || !inView || reduced) {
      setGrown(false);
      return;
    }
    const id = window.setTimeout(() => setGrown(true), 40);
    return () => window.clearTimeout(id);
  }, [phase, inView, reduced]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (phase === 'video') {
      v.currentTime = 0;
      // If playback is refused there is nothing to show, so skip the video
      // rather than sitting on an empty frame.
      v.play().catch(() => setPhase('toLogo'));
      return;
    }
    // Let it finish fading out before it stops.
    const id = window.setTimeout(() => v.pause(), VIDEO_FADE_MS);
    return () => window.clearTimeout(id);
  }, [phase]);

  const logoState = reduced
    ? 'on'
    : phase === 'logo'
      ? grown
        ? 'on'
        : 'start'
      : phase === 'toVideo'
        ? 'out'
        : 'hidden';

  return (
    <div ref={rootRef} className="tiktok-loop">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="tiktok-loop__logo"
        data-state={logoState}
        src="/assets/tiktok/tiktok-logo-black.png"
        alt="TikTok"
        draggable={false}
      />
      <video
        ref={videoRef}
        className="tiktok-loop__video"
        data-on={phase === 'video'}
        data-manual-controls
        onEnded={() => setPhase((p) => (p === 'video' ? 'toLogo' : p))}
        src="/assets/tiktok/tiktok-project-01.mp4"
        poster="/assets/tiktok/posters/tiktok-project-01.jpg"
        muted
        playsInline
        preload="none"
        aria-hidden
      />
    </div>
  );
}

/**
 * Homepage TikTok project-card preview: edge to edge on #fafafa, no inset —
 * the mark, then the flow video, on a loop (see TikTokLoop). PixelBlast only
 * while the card is hovered — unmounted the moment hover ends so it never loops
 * in the background.
 */
export default function TikTokProjectCover({
  hovered,
}: {
  hovered: boolean;
  /** Kept for ProjectCard call sites; cover no longer plays this clip. */
  video?: string;
}) {
  return (
    <div className="project-card__media project-card__media--tiktok">
      <div className="project-card__tiktok-stage">
        <TikTokLoop />
        {hovered ? (
          <PixelBlast
            className=""
            style={{}}
            variant="circle"
            pixelSize={6}
            color="#3a3a3a"
            patternScale={3}
            patternDensity={1.2}
            pixelSizeJitter={0.5}
            enableRipples
            rippleSpeed={0.4}
            rippleThickness={0.12}
            rippleIntensityScale={1.5}
            liquid
            liquidStrength={0.12}
            liquidRadius={1.2}
            liquidWobbleSpeed={5}
            speed={0.6}
            edgeFade={0.25}
            transparent
          />
        ) : null}
      </div>
    </div>
  );
}
