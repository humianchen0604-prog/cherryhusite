'use client';

import {
  useEffect,
  useImperativeHandle,
  useRef,
  type KeyboardEvent,
  type PointerEvent,
  type Ref,
} from 'react';
import './wallRecordPlayer.css';

/**
 * A wall-mounted record player — the MUJI CD player shape — with a pull cord.
 * Built in `_playground/cd-player/` first; this is that page as a component.
 *
 * At rest the record is still. Pulling the cord (or `tug()`, which the sticker
 * board calls on a plain click) starts "Vultures" and spins the record up to
 * 33⅓ rpm; pulling again fades it out and lets the record coast to a stop.
 * Hover can't start it on its own — browsers only allow sound after a click.
 *
 * Everything is sized in `cqw` against the root's width (100cqw = the player's
 * width), so it scales from whatever box it's dropped into. The root is
 * 1 : 2 — the square body on top, the cord hanging in the bottom half.
 */

/* Apple's official 30s preview of "Vultures" (Continuum, 2006), from the
   iTunes Search API. Swap for a file in /public for the full track. */
const SONG_SRC =
  'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/fd/0b/12/fd0b12d3-337c-8a2c-2462-7b5359b0cd8b/mzaf_10173282892537328649.plus.aac.p.m4a';
const SONG_TITLE = 'Vultures by John Mayer';

const ART = '/assets/about-board';

/* Geometry, in units of the player's width (100 = full width). The viewBox
   height below (200) must match the root's aspect-ratio in the CSS. */
const ANCHOR = { x: 50, y: 99 }; // where the cord leaves the body
const REST_LEN = 84; // cord length to the bead at rest
const TAIL = 12; // stub of cord below the bead
const PULL_TRIGGER = 13; // pull this far and the switch clicks
const PULL_MAX = 30; // rubber-bands beyond this

const SPIN_DEG_PER_S = 200; // 33⅓ rpm
/* Playback level, applied through a Web Audio gain node (see the effect) so it
   holds on every platform — iOS ignores `audio.volume`. 0.8 → 0.48 → 0.288,
   two 40% cuts. */
const VOLUME = 0.288;

export type WallRecordPlayerHandle = {
  /** Pull the cord for the viewer: toggles play/pause with the cord bouncing. */
  tug: () => void;
};

/**
 * Speaker grille — concentric rings of dots between the well and the body's
 * rounded edge. One <path> of tiny circles rather than thousands of nodes.
 * Dots are kept at least ~3.4px apart on screen so the grille still reads as
 * holes (not grey haze) when the player is small.
 */
function grillePath(widthPx: number) {
  const perPx = 100 / Math.max(widthPx, 1);
  const STEP = Math.max(1.55, 3.4 * perPx);
  const DOT = Math.max(0.36, 0.62 * perPx);
  const INNER = 39.6;
  const INSET = 3.6;
  const CORNER = 10;
  const inRoundedRect = (x: number, y: number) => {
    const lo = INSET;
    const hi = 100 - INSET;
    if (x < lo || x > hi || y < lo || y > hi) return false;
    const cx = Math.min(Math.max(x, lo + CORNER), hi - CORNER);
    const cy = Math.min(Math.max(y, lo + CORNER), hi - CORNER);
    return (x - cx) ** 2 + (y - cy) ** 2 <= CORNER ** 2;
  };
  let d = '';
  for (let r = INNER + DOT, ring = 0; r < 72; r += STEP, ring++) {
    const n = Math.round((2 * Math.PI * r) / STEP);
    const shift = (ring % 2) * 0.5;
    for (let i = 0; i < n; i++) {
      const a = ((i + shift) / n) * Math.PI * 2;
      const x = 50 + r * Math.cos(a);
      const y = 50 + r * Math.sin(a);
      if (!inRoundedRect(x, y)) continue;
      d += `M${(x - DOT).toFixed(2)} ${y.toFixed(2)}a${DOT.toFixed(2)} ${DOT.toFixed(2)} 0 1 0 ${(DOT * 2).toFixed(2)} 0a${DOT.toFixed(2)} ${DOT.toFixed(2)} 0 1 0 ${(-DOT * 2).toFixed(2)} 0`;
    }
  }
  return d;
}

export default function WallRecordPlayer({
  ref,
  onPlayingChange,
}: {
  ref?: Ref<WallRecordPlayerHandle>;
  onPlayingChange?: (playing: boolean) => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const discRef = useRef<HTMLDivElement>(null);
  const grilleRef = useRef<SVGPathElement>(null);
  const cordLineRef = useRef<SVGPathElement>(null);
  const cordEdgeRef = useRef<SVGPathElement>(null);
  const cordShadowRef = useRef<SVGPathElement>(null);
  const beadRef = useRef<SVGGElement>(null);

  /* Everything the animation loop touches lives in one mutable ref — it runs
     every frame, so none of it goes through React state. */
  const sim = useRef({
    playing: false,
    volTarget: 0,
    cord: { x: 0, y: 0, vx: 0, vy: 0 }, // bead offset from rest
    angle: 0,
    speed: 0,
    pull: null as null | { id: number; sx: number; sy: number; fired: boolean; moved: number },
    raf: 0,
    last: 0,
    /** Bead scale — grows when the player is small so it stays grabbable. */
    beadScale: 1,
  });
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const onChangeRef = useRef(onPlayingChange);
  onChangeRef.current = onPlayingChange;

  /* Set up by the effect; the handlers below call through these. */
  const api = useRef({ toggle: () => {}, wake: () => {} });

  useEffect(() => {
    const s = sim.current;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    const audio = new Audio();
    audio.preload = 'none';
    // Needed to route it through Web Audio: a cross-origin source without CORS
    // plays as silence there. The preview host sends `Access-Control-Allow-
    // Origin: *`, so an anonymous request is allowed.
    audio.crossOrigin = 'anonymous';
    audio.src = SONG_SRC;
    audio.volume = 0;
    audioRef.current = audio;

    /*
     * Loudness goes through a gain node rather than `audio.volume`: iOS treats
     * `volume` as read-only (always full), so that alone couldn't make the song
     * quieter there. The graph is built on the first play, inside the click or
     * pull that starts it — browsers only let an AudioContext run from a user
     * gesture. Once it exists the element plays at full volume into the gain,
     * which does both the level and the fades. Without Web Audio, `volume`
     * still does the job where it can.
     */
    let ctx: AudioContext | null = null;
    let gain: GainNode | null = null;
    const ensureGain = () => {
      if (gain) return;
      const AC =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      try {
        ctx = new AC();
        const node = ctx.createGain();
        node.gain.value = audio.volume;
        ctx.createMediaElementSource(audio).connect(node).connect(ctx.destination);
        gain = node;
        audio.volume = 1;
      } catch {
        gain = null;
      }
    };
    const getLevel = () => (gain ? gain.gain.value : audio.volume);
    const setLevel = (v: number) => {
      if (gain) {
        gain.gain.value = v;
        return;
      }
      try {
        audio.volume = v; // read-only on iOS; there the fallback can't fade
      } catch {
        /* ignore */
      }
    };

    const syncState = () => {
      const body = bodyRef.current;
      if (body) {
        body.setAttribute('aria-pressed', String(s.playing));
        body.setAttribute('aria-label', `${s.playing ? 'Pause' : 'Play'} ${SONG_TITLE}`);
      }
      onChangeRef.current?.(s.playing);
    };

    const setPlaying = (next: boolean) => {
      if (next === s.playing) return;
      s.playing = next;
      syncState();
      wake();
      if (next) {
        s.volTarget = VOLUME;
        ensureGain();
        if (ctx?.state === 'suspended') ctx.resume().catch(() => {});
        audio.play().catch(() => {
          s.playing = false;
          s.volTarget = 0;
          syncState();
        });
      } else {
        s.volTarget = 0; // fades out, then pauses in the loop
      }
    };

    const onEnded = () => {
      audio.currentTime = 0;
      setPlaying(false);
    };
    audio.addEventListener('ended', onEnded);

    function drawCord() {
      const { cord } = s;
      const bx = ANCHOR.x + cord.x;
      const by = ANCHOR.y + REST_LEN + cord.y;
      // Pushed up past rest -> the cord goes slack and bows out to one side.
      const slack = Math.max(0, -cord.y) * 0.9;
      const cx = ANCHOR.x + cord.x * 0.25 + slack * (cord.x >= 0 ? -1 : 1);
      const cy = (ANCHOR.y + by) / 2;
      const d = `M${ANCHOR.x} ${ANCHOR.y}Q${cx.toFixed(2)} ${cy.toFixed(2)} ${bx.toFixed(2)} ${by.toFixed(2)}`;
      cordLineRef.current?.setAttribute('d', d);
      cordEdgeRef.current?.setAttribute('d', d);
      cordShadowRef.current?.setAttribute(
        'd',
        `M${ANCHOR.x + 1.2} ${ANCHOR.y + 2}Q${(cx + 1.2).toFixed(2)} ${(cy + 1.6).toFixed(2)} ${(bx + 1.2).toFixed(2)} ${(by + 1.6).toFixed(2)}`,
      );
      // The bead hangs along the cord's last segment.
      const tilt = (Math.atan2(bx - cx, by - cy) * -180) / Math.PI;
      beadRef.current?.setAttribute(
        'transform',
        `translate(${bx.toFixed(2)} ${by.toFixed(2)}) rotate(${tilt.toFixed(2)}) scale(${s.beadScale.toFixed(3)})`,
      );
    }

    function tick(now: number) {
      const dt = Math.min(0.05, (now - s.last) / 1000);
      s.last = now;
      const still = reduceMotion.matches;
      const { cord } = s;

      // Record: spins up quickly, coasts down slowly like a real platter.
      const target = s.playing && !still ? SPIN_DEG_PER_S : 0;
      const tau = target > s.speed ? 0.45 : 1.3;
      s.speed += (target - s.speed) * (1 - Math.exp(-dt / tau));
      if (s.speed < 0.5 && target === 0) s.speed = 0;
      s.angle = (s.angle + s.speed * dt) % 360;
      if (discRef.current) discRef.current.style.transform = `rotate(${s.angle}deg)`;

      // Cord: a damped spring back to rest unless it's being held.
      if (!s.pull) {
        const k = 190;
        const c = still ? 40 : 11;
        // Sideways is a softer, slower spring, so a nudge swings like a
        // pendulum rather than twanging back.
        const kx = 60;
        const cx = still ? 40 : 4;
        cord.vx += (-kx * cord.x - cx * cord.vx) * dt;
        cord.vy += (-k * cord.y - c * cord.vy) * dt;
        cord.x += cord.vx * dt;
        cord.y += cord.vy * dt;
      }
      drawCord();

      // Volume: fades in over 0.5s and out over 0.35s, whatever VOLUME is.
      const v = getLevel();
      const step = (dt / (s.volTarget > v ? 0.5 : 0.35)) * VOLUME;
      const nv = s.volTarget > v ? Math.min(s.volTarget, v + step) : Math.max(s.volTarget, v - step);
      setLevel(nv);
      if (nv === 0 && !s.playing && !audio.paused) audio.pause();

      const cordAtRest =
        !s.pull && Math.abs(cord.x) + Math.abs(cord.y) + Math.abs(cord.vx) + Math.abs(cord.vy) < 0.02;
      const discAtRest = s.speed === 0 && target === 0;
      if (cordAtRest && discAtRest && nv === s.volTarget) {
        cord.x = cord.y = cord.vx = cord.vy = 0;
        drawCord();
        s.raf = 0;
        return;
      }
      s.raf = requestAnimationFrame(tick);
    }

    function wake() {
      if (s.raf) return;
      s.last = performance.now();
      s.raf = requestAnimationFrame(tick);
    }

    api.current = { toggle: () => setPlaying(!s.playing), wake };
    drawCord();

    // Grille density follows the rendered size (see grillePath).
    const root = rootRef.current;
    let lastW = 0;
    const ro = new ResizeObserver(([entry]) => {
      const w = Math.round(entry.contentRect.width / 8) * 8;
      if (w === lastW) return;
      lastW = w;
      grilleRef.current?.setAttribute('d', grillePath(w));
      // Keep the bead at least ~6 x 16px on screen (it's 3.6 x 9.5 units).
      s.beadScale = Math.max(1, 170 / Math.max(w, 1));
      drawCord();
    });
    if (root) ro.observe(root);

    return () => {
      ro.disconnect();
      cancelAnimationFrame(s.raf);
      s.raf = 0;
      audio.removeEventListener('ended', onEnded);
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      ctx?.close().catch(() => {});
      audioRef.current = null;
      s.playing = false;
    };
  }, []);

  function tug() {
    const { cord } = sim.current;
    cord.vy = 240;
    cord.vx += (Math.random() - 0.5) * 30;
    api.current.toggle();
    api.current.wake();
  }

  useImperativeHandle(ref, () => ({ tug }), []);

  /* ── pulling the cord ─────────────────────────────────────────────────── */
  const unitsPerPx = () => 100 / (rootRef.current?.getBoundingClientRect().width || 100);

  function onBeadDown(e: PointerEvent<SVGRectElement>) {
    if (e.button !== 0) return;
    // The cord is its own control — don't let the sticker board start a drag.
    e.stopPropagation();
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* no capture; moves still arrive while over the bead */
    }
    const s = sim.current;
    s.pull = { id: e.pointerId, sx: e.clientX, sy: e.clientY, fired: false, moved: 0 };
    s.cord.vx = s.cord.vy = 0;
    rootRef.current?.setAttribute('data-pulling', '');
    api.current.wake();
  }

  function onBeadMove(e: PointerEvent<SVGRectElement>) {
    const s = sim.current;
    const p = s.pull;
    if (!p || p.id !== e.pointerId) return;
    const u = unitsPerPx();
    const dx = (e.clientX - p.sx) * u;
    const dy = (e.clientY - p.sy) * u;
    p.moved = Math.max(p.moved, Math.hypot(dx, dy));
    // A taut cord mostly moves down; sideways it swings on a short leash.
    s.cord.x = dx * 0.35;
    s.cord.y = dy <= PULL_MAX ? dy : PULL_MAX + (dy - PULL_MAX) * 0.2;
    if (s.cord.y < -8) s.cord.y = -8 + (s.cord.y + 8) * 0.3;
    if (!p.fired && s.cord.y >= PULL_TRIGGER) {
      p.fired = true;
      api.current.toggle();
    }
  }

  function onBeadUp(e: PointerEvent<SVGRectElement>) {
    const s = sim.current;
    const p = s.pull;
    if (!p || p.id !== e.pointerId) return;
    e.stopPropagation();
    const tap = !p.fired && p.moved < 2;
    s.pull = null;
    rootRef.current?.removeAttribute('data-pulling');
    if (tap) tug();
    api.current.wake();
  }

  /* Hover: a very slight left-right sway away from the pointer — no pull
     down, just enough to show the cord is loose and can be tugged. */
  function onEnter(e: PointerEvent<HTMLElement | SVGElement>) {
    if (e.pointerType !== 'mouse') return;
    const s = sim.current;
    if (s.pull || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const from = e.relatedTarget;
    if (from instanceof Node && rootRef.current?.contains(from)) return;
    const body = bodyRef.current;
    const mid = body ? body.getBoundingClientRect().left + body.offsetWidth / 2 : e.clientX;
    s.cord.vx += 18 * (e.clientX < mid ? 1 : -1);
    api.current.wake();
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      tug();
    }
  }

  return (
    <div className="wrp" ref={rootRef}>
      <svg className="wrp-cord" viewBox="0 0 100 200" aria-hidden="true">
        <defs>
          <linearGradient id="wrp-bead-fill" x1="0" x2="1">
            <stop offset="0" stopColor="#e9e9e6" />
            <stop offset=".45" stopColor="#ffffff" />
            <stop offset="1" stopColor="#dededa" />
          </linearGradient>
        </defs>
        <path ref={cordShadowRef} className="wrp-cord-shadow" />
        <path ref={cordEdgeRef} className="wrp-cord-edge" />
        <path ref={cordLineRef} className="wrp-cord-line" />
        <g ref={beadRef}>
          <rect className="wrp-bead-shadow" x="-0.4" y="-2.4" width="3.6" height="9.5" rx="1.6" />
          <path className="wrp-cord-edge" d={`M0 4.5L0 ${4.5 + TAIL}`} />
          <path className="wrp-cord-line" d={`M0 4.5L0 ${4.5 + TAIL}`} />
          <rect className="wrp-bead" x="-1.8" y="-4.5" width="3.6" height="9.5" rx="1.6" />
          <rect
            className="wrp-bead-hit"
            x="-9"
            y="-12"
            width="18"
            height="26"
            onPointerDown={onBeadDown}
            onPointerMove={onBeadMove}
            onPointerUp={onBeadUp}
            onPointerCancel={onBeadUp}
            onPointerEnter={onEnter}
          />
        </g>
      </svg>

      <div
        ref={bodyRef}
        className="wrp-body"
        role="button"
        tabIndex={0}
        aria-pressed="false"
        aria-label={`Play ${SONG_TITLE}`}
        onKeyDown={onKeyDown}
        onPointerEnter={onEnter}
      >
        <svg className="wrp-grille" viewBox="0 0 100 100" aria-hidden="true">
          <path ref={grilleRef} />
        </svg>
        <div className="wrp-well" />
        <div className="wrp-disc-wrap">
          <div className="wrp-disc" ref={discRef}>
            <img className="wrp-vinyl" src={`${ART}/vinyl-disc.png`} alt="" draggable={false} />
            <div className="wrp-tint" />
            <img className="wrp-label" src={`${ART}/vinyl-label.png`} alt="" draggable={false} />
          </div>
          <div className="wrp-sheen" />
        </div>
        <div className="wrp-hub" />
      </div>
    </div>
  );
}
