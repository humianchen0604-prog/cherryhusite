'use client';

import { useEffect, useRef } from 'react';
import {
  PALETTE,
  SHAPE_SCALE,
  OUTLINE_POINTS as N,
  easeEnter,
  easeExit,
  getOutlines,
  type ShapeName as FooterShape,
} from '@/components/GuestbookDotField';
import { measureWave, waveSpots } from './heroWave';
import './heroDeco.css';

/**
 * Small shapes that morph in beside the hero copy — the landing page's take on
 * the footer's guestbook shapes (GuestbookDotField). There's no dot grid here,
 * so each shape grows out of a point instead of out of a grid dot, holds, and
 * shrinks back. 5–7 shapes form left to right along a wavy line to the right
 * of the text (see heroWave.ts), then a fresh composition after a rest.
 */

type Vec = [number, number];
type ShapeName = FooterShape | 'clover' | 'moon' | 'flower' | 'star';

// ---------- timing (ms), matching the footer ----------
const MORPH = 600; // point -> shape
const EXIT = MORPH * 0.6; // shape -> point
const STAGGER = 70;
const HOLD = 1000;
const REST = 700;
const START_DELAY = 800; // let the intro copy start fading in first
const SHAPE_SIZE = 12; // largest shape, px

const TAU = Math.PI * 2;
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const hexRgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const shuffle = <T,>(arr: T[]): T[] => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

/* ---------------------------------------------------------------------------
 * Extra outlines, built the same way as the footer's: N points at equal arc
 * length, starting at the top and running clockwise, fitted to a 1 × 1 box.
 * ------------------------------------------------------------------------- */
const radial = (r: (th: number) => number): Vec[] =>
  Array.from({ length: 720 }, (_, k) => {
    const th = (k / 720) * TAU;
    const d = r(th);
    return [Math.sin(th) * d, -Math.cos(th) * d];
  });

/** Crescent: a disc with an offset disc cut out of it. */
function crescent(): Vec[] {
  const R = 1;
  const c = { x: 0.52, y: -0.3 };
  const r = 0.86;
  const inside2 = (x: number, y: number) => Math.hypot(x - c.x, y - c.y) < r;
  const outer: Vec[] = [];
  for (let k = 0; k < 720; k++) {
    const th = (k / 720) * TAU;
    const x = Math.sin(th) * R, y = -Math.cos(th) * R;
    if (!inside2(x, y)) outer.push([x, y]);
  }
  // The outer arc is contiguous once rotated to start just after the cut.
  let start = 0;
  for (let k = 0; k < outer.length; k++) {
    const [ax, ay] = outer[k], [bx, by] = outer[(k + 1) % outer.length];
    if (Math.hypot(bx - ax, by - ay) > 0.05) { start = (k + 1) % outer.length; break; }
  }
  const arc = [...outer.slice(start), ...outer.slice(0, start)];
  // Inner edge: the cutting disc's arc inside the outer disc, walked back.
  const inner: Vec[] = [];
  for (let k = 0; k < 720; k++) {
    const th = (k / 720) * TAU;
    const x = c.x + Math.sin(th) * r, y = c.y - Math.cos(th) * r;
    if (Math.hypot(x, y) < R) inner.push([x, y]);
  }
  const a0 = arc[arc.length - 1];
  const nearest = inner.reduce((best, p, i) => (Math.hypot(p[0] - a0[0], p[1] - a0[1]) < Math.hypot(inner[best][0] - a0[0], inner[best][1] - a0[1]) ? i : best), 0);
  const ordered = [...inner.slice(nearest), ...inner.slice(0, nearest)];
  // Walk whichever direction continues the outline instead of doubling back.
  const fwd = Math.hypot(ordered[ordered.length - 1][0] - arc[0][0], ordered[ordered.length - 1][1] - arc[0][1]);
  const back = [ordered[0], ...ordered.slice(1).reverse()];
  const bwd = Math.hypot(back[back.length - 1][0] - arc[0][0], back[back.length - 1][1] - arc[0][1]);
  return [...arc, ...(fwd < bwd ? ordered : back)];
}

function normalise(pts: Vec[]): Vec[] {
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const [x, y] of pts) {
    x0 = Math.min(x0, x); x1 = Math.max(x1, x);
    y0 = Math.min(y0, y); y1 = Math.max(y1, y);
  }
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, s = Math.max(x1 - x0, y1 - y0);
  return pts.map(([x, y]) => [(x - cx) / s, (y - cy) / s]);
}

/** Clockwise on screen, starting from the topmost point — so it lines up with the dot. */
function orient(pts: Vec[]): Vec[] {
  let area = 0;
  for (let i = 0; i < pts.length; i++) {
    const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length];
    area += ax * by - bx * ay;
  }
  const cw = area > 0 ? pts : [...pts].reverse();
  let top = 0;
  for (let i = 1; i < cw.length; i++) if (cw[i][1] < cw[top][1]) top = i;
  return [...cw.slice(top), ...cw.slice(0, top)];
}

function resample(pts: Vec[]): Float32Array {
  const len = [0];
  for (let i = 1; i <= pts.length; i++) {
    const [ax, ay] = pts[i - 1], [bx, by] = pts[i % pts.length];
    len.push(len[i - 1] + Math.hypot(bx - ax, by - ay));
  }
  const total = len[len.length - 1];
  const out = new Float32Array(N * 2);
  let seg = 0;
  for (let k = 0; k < N; k++) {
    const target = (k / N) * total;
    while (len[seg + 1] < target) seg++;
    const t = (target - len[seg]) / (len[seg + 1] - len[seg] || 1);
    const [ax, ay] = pts[seg], [bx, by] = pts[(seg + 1) % pts.length];
    out[k * 2] = lerp(ax, bx, t);
    out[k * 2 + 1] = lerp(ay, by, t);
  }
  return out;
}

let outlines: Record<ShapeName, Float32Array> | null = null;
function getAllOutlines() {
  if (outlines) return outlines;
  const extra: Record<'clover' | 'moon' | 'flower' | 'star', Vec[]> = {
    // Four heart-shaped leaves: eight bumps, with the notches between leaves
    // cut deeper than the notch in the middle of each leaf.
    clover: radial((th) => (0.78 + 0.22 * Math.pow(Math.abs(Math.sin(4 * th)), 0.45)) * (1 - 0.58 * Math.pow(Math.abs(Math.cos(2 * th)), 4))),
    moon: crescent(),
    // Five fat, rounded petals, one pointing up.
    flower: radial((th) => 0.5 + 0.5 * Math.pow(Math.abs(Math.cos(2.5 * th)), 0.7)),
    // Five soft points.
    star: radial((th) => 0.46 + 0.54 * Math.pow(Math.abs(Math.cos(2.5 * th)), 3)),
  };
  const built = { ...getOutlines() } as Record<ShapeName, Float32Array>;
  for (const k of Object.keys(extra) as (keyof typeof extra)[]) built[k] = resample(orient(normalise(extra[k])));
  outlines = built;
  return built;
}

const SCALE: Record<ShapeName, number> = { ...SHAPE_SCALE, clover: 1, moon: 0.95, flower: 1, star: 1 };

// Shapes with an obvious colour keep it; everything else is dealt from the palette.
const FIXED: Partial<Record<ShapeName, string>> = { clover: '#69f353', moon: '#fcde1d' };

type Placed = { x: number; y: number; shape: ShapeName; rgb: number[]; tilt: number; inAt: number; outAt: number };
type Play = { placed: Placed[]; end: number };

export default function HeroShapes() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const OUTLINE = getAllOutlines();
    const DOT = OUTLINE.circle;
    const SHAPES = Object.keys(OUTLINE) as ShapeName[];
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');

    let W = 0, H = 0;
    let play: Play | null = null;
    let started = false;
    let visible = false;
    let raf = 0;
    let startTimer = 0;

    const measure = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      W = canvas.clientWidth;
      H = canvas.clientHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      play = null;
    };

    const nextPlay = (now: number): Play | null => {
      const band = measureWave(canvas);
      if (!band) return null;
      const light = document.documentElement.dataset.theme !== 'dark';
      // The clover's green and the moon's yellow stay theirs, so no other shape
      // is mistaken for a second clover or moon. The palest footer colours
      // vanish on the white hero; keep them for night.
      const reserved = Object.values(FIXED);
      const colors = shuffle(
        PALETTE.filter((c) => !reserved.includes(c) && (!light || !['#eab9dc', '#f8ff66', '#b5ecff'].includes(c))),
      );
      const shapes = shuffle(SHAPES.slice());
      const spots = waveSpots(5 + ((Math.random() * 3) | 0), band);
      // Spots come left to right, so the shapes form along the line.
      const placed: Placed[] = spots.map(([x, y], i) => {
        const shape = shapes[i % shapes.length];
        return {
          x,
          y,
          shape,
          rgb: hexRgb(FIXED[shape] ?? colors[i % colors.length]),
          tilt: (Math.random() - 0.5) * 0.5,
          inAt: 0,
          outAt: 0,
        };
      });
      const n = placed.length;
      const outAt = now + (n - 1) * STAGGER + MORPH + HOLD;
      placed.forEach((p, i) => {
        p.inAt = now + i * STAGGER;
        p.outAt = outAt + i * STAGGER;
      });
      return { placed, end: outAt + (n - 1) * STAGGER + EXIT + REST };
    };

    /** e = 0 is a point, 1 the finished shape; outline, size, tilt and opacity share the curve. */
    const drawShape = (p: Placed, e: number) => {
      const target = OUTLINE[p.shape];
      const size = SHAPE_SIZE * SCALE[p.shape] * e;
      const cos = Math.cos(p.tilt * e), sin = Math.sin(p.tilt * e);
      ctx.globalAlpha = clamp(e * 1.6);
      ctx.fillStyle = `rgb(${p.rgb[0]}, ${p.rgb[1]}, ${p.rgb[2]})`;
      ctx.beginPath();
      for (let k = 0; k < N; k++) {
        const px = lerp(DOT[k * 2], target[k * 2], e) * size;
        const py = lerp(DOT[k * 2 + 1], target[k * 2 + 1], e) * size;
        const x = p.x + px * cos - py * sin;
        const y = p.y + px * sin + py * cos;
        if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
    };

    const paint = (now: number) => {
      ctx.clearRect(0, 0, W, H);
      if (!started || !W) return;
      if (!play || now >= play.end) play = nextPlay(now);
      if (!play) return;
      for (const p of play.placed) {
        let e = 0;
        if (reduced.matches) e = 1; // one still composition, no morphing
        else if (now >= p.outAt) e = 1 - easeExit(clamp((now - p.outAt) / EXIT));
        else if (now >= p.inAt) e = easeEnter(clamp((now - p.inAt) / MORPH));
        if (e > 0.001) drawShape(p, e);
      }
      ctx.globalAlpha = 1;
    };

    const running = () => started && visible && !document.hidden && !reduced.matches;
    const frame = (now: number) => {
      raf = 0;
      paint(now);
      if (running()) raf = requestAnimationFrame(frame);
    };
    const sync = () => {
      if (running()) {
        if (!raf) raf = requestAnimationFrame(frame);
      } else {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        paint(performance.now());
      }
    };

    // Plays the first time it's on screen (hidden variants report not visible).
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !started && !startTimer)
        startTimer = window.setTimeout(() => {
          started = true;
          sync();
        }, START_DELAY);
      // Coming back into view deals a fresh composition rather than resuming.
      if (visible) play = null;
      sync();
    });
    io.observe(canvas);

    const ro = new ResizeObserver(() => {
      measure();
      paint(performance.now());
    });
    ro.observe(canvas);

    document.addEventListener('visibilitychange', sync);
    reduced.addEventListener('change', sync);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.clearTimeout(startTimer);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener('visibilitychange', sync);
      reduced.removeEventListener('change', sync);
    };
  }, []);

  return <canvas ref={canvasRef} className="hero-deco hero-shapes" aria-hidden="true" />;
}
