'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * The Grumble highlight reel — autoplays muted once it scrolls into view
 * (like every other Grumble video, via the same in/out-of-view convention as
 * VideoAutoplay), but carries its own custom controls instead of being fully
 * hands-off: click to pause/resume, a hover-revealed scrubber, and a
 * hover-revealed mute toggle that unmutes to 30% volume rather than 100% —
 * this plays inline in a case study someone is reading, not a dedicated
 * video page, so full volume would be jarring.
 *
 * Kept outside VideoAutoplay's blanket handling (data-manual-controls) since
 * that component force-mutes every video on every scroll-into-view, which
 * would silently undo a viewer's own unmute choice each time this scrolls
 * back into range.
 */

const UNMUTED_VOLUME = 0.3;

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">
      <path d="M7 5.5v13a1 1 0 0 0 1.53.848l10.4-6.5a1 1 0 0 0 0-1.696l-10.4-6.5A1 1 0 0 0 7 5.5Z" fill="currentColor" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">
      <rect x="6.5" y="5" width="4" height="14" rx="1" fill="currentColor" />
      <rect x="13.5" y="5" width="4" height="14" rx="1" fill="currentColor" />
    </svg>
  );
}

function VolumeOnIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true">
      <path d="M4 9.5v5a1 1 0 0 0 1 1h2.79l4.5 3.6a1 1 0 0 0 1.62-.78V5.68a1 1 0 0 0-1.62-.78L7.79 8.5H5a1 1 0 0 0-1 1Z" fill="currentColor" />
      <path d="M16.2 8.2a5.5 5.5 0 0 1 0 7.6M18.6 5.8a9 9 0 0 1 0 12.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function VolumeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true">
      <path d="M4 9.5v5a1 1 0 0 0 1 1h2.79l4.5 3.6a1 1 0 0 0 1.62-.78V5.68a1 1 0 0 0-1.62-.78L7.79 8.5H5a1 1 0 0 0-1 1Z" fill="currentColor" />
      <path d="M16.5 9.5 20.5 14.5M20.5 9.5 16.5 14.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export default function GrumbleReel() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const userPausedRef = useRef(false);

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [scrubbing, setScrubbing] = useState(false);

  // Autoplay muted once in view, matching every other Grumble video — but
  // only until the viewer touches play/pause themselves, after which their
  // choice is respected instead of being overridden on the next scroll-in.
  useEffect(() => {
    const v = videoRef.current;
    const el = wrapRef.current;
    if (!v || !el) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            if (userPausedRef.current) continue;
            v.play().catch(() => {});
          } else if (!userPausedRef.current) {
            v.pause();
          }
        }
      },
      { rootMargin: '200px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onTime = () => {
      if (!scrubbing) setCurrentTime(v.currentTime);
    };
    const onMeta = () => setDuration(v.duration || 0);
    // readyState can already be >= HAVE_METADATA by the time this effect runs
    // (a cached video resolves metadata near-instantly), in which case
    // 'loadedmetadata' already fired and never reaches a listener attached
    // this late — read it directly too, not just via the event.
    if (v.readyState >= 1) onMeta();
    v.addEventListener('play', onPlay);
    v.addEventListener('pause', onPause);
    v.addEventListener('timeupdate', onTime);
    v.addEventListener('loadedmetadata', onMeta);
    return () => {
      v.removeEventListener('play', onPlay);
      v.removeEventListener('pause', onPause);
      v.removeEventListener('timeupdate', onTime);
      v.removeEventListener('loadedmetadata', onMeta);
    };
  }, [scrubbing]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      userPausedRef.current = false;
      v.play().catch(() => {});
    } else {
      userPausedRef.current = true;
      v.pause();
    }
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    const next = !muted;
    v.muted = next;
    v.volume = next ? v.volume || UNMUTED_VOLUME : UNMUTED_VOLUME;
    setMuted(next);
  };

  const seek = (value: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = value;
    setCurrentTime(value);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="grumble-reel" ref={wrapRef}>
      <button
        type="button"
        className="grumble-reel__hit"
        onClick={togglePlay}
        aria-label={playing ? 'Pause reel' : 'Play reel'}
      >
        <video
          ref={videoRef}
          className="grumble-reel__video"
          src="/assets/grumble/GrumbleReel/GrumbleVideo/GrumbleVideo.mp4"
          poster="/assets/grumble/GrumbleReel/GrumbleVideo/GrumbleVideo-Cover.jpg"
          muted
          loop
          playsInline
          preload="metadata"
          data-manual-controls=""
          aria-label="Grumble highlight reel"
        />
        <span className={`grumble-reel__playstate${playing ? '' : ' grumble-reel__playstate--show'}`}>
          {playing ? <PauseIcon /> : <PlayIcon />}
        </span>
      </button>

      <div className="grumble-reel__top">
        <button
          type="button"
          className="grumble-reel__mute"
          onClick={(e) => {
            e.stopPropagation();
            toggleMute();
          }}
          aria-label={muted ? 'Play sound' : 'Mute'}
          aria-pressed={!muted}
        >
          {muted ? <VolumeOffIcon /> : <VolumeOnIcon />}
        </button>
      </div>

      <div className="grumble-reel__scrub" onClick={(e) => e.stopPropagation()}>
        <span className="grumble-reel__time">{formatTime(currentTime)}</span>
        <div className="grumble-reel__track">
          <div className="grumble-reel__track-fill" style={{ width: `${progress}%` }} />
          <input
            type="range"
            className="grumble-reel__range"
            min={0}
            max={duration || 0}
            step={0.01}
            value={currentTime}
            onChange={(e) => seek(Number(e.target.value))}
            onPointerDown={() => setScrubbing(true)}
            onPointerUp={() => setScrubbing(false)}
            aria-label="Seek"
          />
        </div>
        <span className="grumble-reel__time">{formatTime(duration)}</span>
      </div>
    </div>
  );
}
