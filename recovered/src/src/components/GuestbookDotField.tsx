'use client';

import { useEffect, useRef } from 'react';

/**
 * The footer's dot grid, with a few dots beside the guestbook that morph into
 * small shapes (heart, sparkle, plus, circle, square, diamond) and back.
 *
 * It plays as a composition, not at random: 3–4 shapes on one side of the book
 * and 2–3 on the other, laid out as triangles or diagonals. The composition
 * forms, holds, returns to dots, then plays again mirrored (sides swapped),
 * then a new one is dealt. Nothing reacts to the pointer.
 *
 * The book is found through `anchorSelector` (the guestbook slot) and read
 * with offsetLeft/Top — layout values, so the footer's scroll reveal, which
 * translates the stage, never shifts where the shapes land. The slot's offset
 * parent (.footer_book_pin) overlays the stage exactly.
 *
 * Tuned in _playground/footer-dots; the defaults below are the chosen settings.
 */
type GuestbookDotFieldProps = {
  /** Resting dot radius, px. */
  dotRadius?: number;
  /** Grid spacing, px. */
  dotSpacing?: number;
  /** Resting dot color as `r, g, b`. */
  rgb?: string;
  /** Resting dot alpha (0–1). */
  alpha?: number;
  /** Element the shapes gather around. */
  anchorSelector?: string;
  /** Closest any shape may sit to the book's side, px. */
  bookPad?: number;
  /** How far the layout fans out beyond the padding (×). */
  spread?: number;
  /** Random nudge on each layout point, as a fraction of the book's size. */
  jitter?: number;
  /** Largest shape (heart / sparkle), px. */
  shapeSize?: number;
  /** Dot -> shape duration, ms. */
  morphMs?: number;
  /** Shape -> dot runs at this fraction of morphMs — exits are quicker. */
  exitRatio?: number;
  /** Delay between shapes in one composition, ms. */
  staggerMs?: number;
  /** How long a composition stays formed, ms. */
  holdMs?: number;
  /** Plain dots between compositions, ms. */
  restMs?: number;
  className?: string;
};

/**
 * Fired on window each time a composition starts forming, so other footer
 * pieces (the "Click to sign" arrow) can move in step with the shapes. Times
 * are on the performance.now() clock, which is also the WAAPI timeline.
 */
export const DOTS_PLAY_EVENT = 'guestbook-dots:play';
export type DotsPlayDetail = {
  /** First shape starts forming. */
  start: number;
  /** Dot -> shape duration, ms. */
  enter: number;
  /** First shape starts returning to a dot. */
  outAt: number;
  /** Shape -> dot duration, ms. */
  exit: number;
};

type Vec = [number, number];
export type ShapeName = 'circle' | 'square' | 'diamond' | 'plus' | 'sparkle' | 'heart';
type Item = { side: 0 | 1; uv: Vec; shape: ShapeName; rgb: number[]; tilt: number };
type Placed = Item & { x: number; y: number; cell: number; inAt: number; outAt: number };
type Play = { placed: Placed[]; enter: number; exit: number; end: number };

export const PALETTE = ['#fb42e9', '#e7508b', '#eb70da', '#eab9dc', '#fcde1d', '#f8ff66', '#b5ecff', '#179ef9', '#69f353'];
/** Relative size of each shape so they read as one family optically. */
export const SHAPE_SCALE: Record<ShapeName, number> = { circle: 0.66, square: 0.64, diamond: 0.8, plus: 0.9, heart: 1, sparkle: 1 };

const TAU = Math.PI * 2;
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const pick = <T,>(arr: readonly T[]): T => arr[(Math.random() * arr.length) | 0];
const shuffle = <T,>(arr: T[]): T[] => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};
const hexRgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

/** CSS-style cubic-bezier(x1, y1, x2, y2) as a function of t in 0..1. */
function bezier(x1: number, y1: number, x2: number, y2: number) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sx = (u: number) => ((ax * u + bx) * u + cx) * u;
  const sy = (u: number) => ((ay * u + by) * u + cy) * u;
  return (t: number) => {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    let lo = 0, hi = 1, u = t;
    for (let i = 0; i < 24; i++) {
      const x = sx(u);
      if (Math.abs(x - t) < 1e-5) break;
      if (x < t) lo = u; else hi = u;
      u = (lo + hi) / 2;
    }
    return sy(u);
  };
}
// Forming is an entrance: strong ease-out, so the change starts immediately.
export const easeEnter = bezier(0.23, 1, 0.32, 1);
// Returning is an on-screen morph: strong ease-in-out.
export const easeExit = bezier(0.77, 0, 0.175, 1);

/* ---------------------------------------------------------------------------
 * Outlines. Every shape — and the dot itself — is the same list of N points,
 * resampled at equal arc length, starting at the top and running clockwise.
 * Morphing is then point i of the dot sliding to point i of the shape, so the
 * dot's edge genuinely bends into a heart / star / plus and back. Each outline
 * fits a 1 × 1 box centred on the origin.
 * ------------------------------------------------------------------------- */
const N = 96;
/** Points per outline, for callers of getOutlines(). */
export const OUTLINE_POINTS = N;

/** Radial outline: r(θ) with θ = 0 pointing up, clockwise on screen. */
const radial = (r: (th: number) => number): Vec[] =>
  Array.from({ length: 720 }, (_, k) => {
    const th = (k / 720) * TAU;
    const d = r(th);
    return [Math.sin(th) * d, -Math.cos(th) * d];
  });
/** Superellipse radius: p = 2 circle, p > 2 squircle, p < 1 concave star. */
const superR = (p: number) => (th: number) =>
  1 / Math.pow(Math.pow(Math.abs(Math.cos(th)), p) + Math.pow(Math.abs(Math.sin(th)), p), 1 / p);
/** Ray from the centre to the edge of a centred a × b rectangle. */
const rectR = (a: number, b: number, th: number) =>
  Math.min(a / (Math.abs(Math.sin(th)) || 1e-9), b / (Math.abs(Math.cos(th)) || 1e-9));

function normalise(pts: Vec[]): Vec[] {
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const [x, y] of pts) {
    x0 = Math.min(x0, x); x1 = Math.max(x1, x);
    y0 = Math.min(y0, y); y1 = Math.max(y1, y);
  }
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, s = Math.max(x1 - x0, y1 - y0);
  return pts.map(([x, y]) => [(x - cx) / s, (y - cy) / s]);
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
/** Built on first use, then shared by every instance. */
export function getOutlines() {
  if (outlines) return outlines;
  const raw: Record<ShapeName, Vec[]> = {
    circle: radial(() => 1),
    square: radial(superR(7)),
    diamond: radial((th) => superR(6)(th + Math.PI / 4)),
    plus: radial((th) => Math.max(rectR(1, 0.36, th), rectR(0.36, 1, th))),
    sparkle: radial(superR(0.62)),
    // Classic parametric heart; t = 0 is the dip between the lobes (top-centre).
    heart: Array.from({ length: 720 }, (_, k): Vec => {
      const t = (k / 720) * TAU;
      return [
        16 * Math.pow(Math.sin(t), 3),
        -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)),
      ];
    }),
  };
  const built = {} as Record<ShapeName, Float32Array>;
  for (const k of Object.keys(raw) as ShapeName[]) built[k] = resample(normalise(raw[k]));
  outlines = built;
  return built;
}

/* ---------------------------------------------------------------------------
 * Layout templates, hand-placed around the guestbook.
 * Each point is [u, v]:
 *   u = distance out from the book's side, in book widths
 *   v = height, as a fraction of the book's height from its top
 * so a template reads the same on either side of the book. Everything sits in
 * the book's middle band (v ≈ 0.3–0.72).
 * ------------------------------------------------------------------------- */
const U_MIN = 0.34;
const TEMPLATES: Record<'tri' | 'quad' | 'pair', Vec[][]> = {
  // 3-point scalene triangles
  tri: [
    [[0.58, 0.34], [0.74, 0.48], [0.45, 0.59]],
    [[0.42, 0.36], [0.70, 0.55], [0.36, 0.68]],
  ],
  // 4-point spreads: a kite and a diagonal pair of triangles
  quad: [
    [[0.52, 0.33], [0.89, 0.55], [0.34, 0.55], [0.52, 0.72]],
    [[0.58, 0.30], [0.37, 0.47], [0.91, 0.39], [0.73, 0.58]],
  ],
  // 2-point diagonals
  pair: [
    [[0.66, 0.40], [0.51, 0.61]],
    [[0.46, 0.55], [0.76, 0.41]],
    [[0.68, 0.35], [0.45, 0.54]],
    [[0.92, 0.45], [0.43, 0.36]],
  ],
};

export default function GuestbookDotField({
  dotRadius = 1.485,
  dotSpacing = 21,
  rgb = '48, 48, 48',
  alpha = 0.365,
  anchorSelector = '.footer_book',
  bookPad = 30,
  spread = 1,
  jitter = 0.03,
  shapeSize = 12,
  morphMs = 600,
  exitRatio = 0.6,
  staggerMs = 70,
  holdMs = 1000,
  restMs = 300,
  className,
}: GuestbookDotFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Colour flips with the theme; read through a ref so a theme change recolours
  // the next frame instead of restarting the choreography.
  const dotColor = useRef({ rgb: [48, 48, 48], a: alpha });
  dotColor.current = { rgb: rgb.split(',').map((n) => Number(n.trim())), a: alpha };

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !parent || !ctx) return;

    const OUTLINE = getOutlines();
    const DOT = OUTLINE.circle;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let W = 0, H = 0, cols = 0, rows = 0;
    let book = { x: 0, y: 0, w: 0, h: 0 };
    // Keep-out box for the "Click to sign" copy + arrow (.guestbook_hint), in the
    // same layout space as `book`, so shapes never form on top of the hint.
    let exclude: { x: number; y: number; w: number; h: number } | null = null;
    let play: Play | null = null;
    let composition: Item[] | null = null;
    let mirrored = false;
    let firstSide = 0; // which side of the book group 0 lands on (0 = left)

    const measureBook = () => {
      const el = document.querySelector<HTMLElement>(anchorSelector);
      if (!el || !el.offsetWidth) return false;
      book = { x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight };
      measureExclusion(el);
      return true;
    };

    /**
     * The hint ("Click to sign" + arrow) is placed by a CSS transform, so its
     * offsetLeft/Top don't reflect where it actually sits. Instead read both the
     * hint and the book with getBoundingClientRect and take their difference:
     * both share the footer's reveal transform, so it cancels out and leaves the
     * true layout offset between them, which maps straight onto `book`'s space.
     */
    const measureExclusion = (bookEl: HTMLElement) => {
      const hintEl = document.querySelector<HTMLElement>('.guestbook_hint');
      if (!hintEl) { exclude = null; return; }
      const hb = hintEl.getBoundingClientRect();
      const bb = bookEl.getBoundingClientRect();
      if (!hb.width || !bb.width) { exclude = null; return; }
      // A dot of breathing room so a shape's body (bigger than a dot) can't
      // creep under the copy or the arrow either.
      const pad = dotSpacing;
      exclude = {
        x: book.x + (hb.left - bb.left) - pad,
        y: book.y + (hb.top - bb.top) - pad,
        w: hb.width + pad * 2,
        h: hb.height + pad * 2,
      };
    };

    const resize = () => {
      const rect = parent.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = rect.width;
      H = rect.height;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(W / dotSpacing) + 1;
      rows = Math.ceil(H / dotSpacing) + 1;
      measureBook();
      // Start a fresh composition on the new layout.
      play = null;
      composition = null;
    };

    /**
     * Book-relative [u, v] -> a grid dot on one side (0 = left, 1 = right).
     * Snaps outward, away from the book, so snapping never eats the padding.
     */
    const toCell = ([u, v]: Vec, side: number) => {
      const out = bookPad + (u - U_MIN) * book.w * spread;
      const x = side === 0 ? book.x - out : book.x + book.w + out;
      const y = book.y + v * book.h;
      const c = side === 0 ? Math.floor(x / dotSpacing) : Math.ceil(x / dotSpacing);
      const r = Math.round(y / dotSpacing);
      if (c < 1 || c > cols - 2 || r < 1 || r > rows - 2) return null;
      // Reject any dot that snaps inside the "Click to sign" hint / arrow box, so
      // shapes can't form over it.
      if (exclude) {
        const px = c * dotSpacing, py = r * dotSpacing;
        if (px >= exclude.x && px <= exclude.x + exclude.w && py >= exclude.y && py <= exclude.y + exclude.h) return null;
      }
      return { c, r };
    };

    /** A template, randomly flipped top-to-bottom and nudged by the jitter. */
    const vary = (tpl: Vec[]): Vec[] => {
      const flipV = Math.random() < 0.5;
      return tpl.map(([u, v]) => [
        Math.max(U_MIN, u + (Math.random() * 2 - 1) * jitter),
        (flipV ? 1 - v : v) + (Math.random() * 2 - 1) * jitter,
      ]);
    };

    /** Every point lands on its own dot, at least ~2 dots from the others. */
    const fits = (pts: Vec[]) => {
      for (const side of [0, 1]) {
        const cells = pts.map((p) => toCell(p, side));
        if (cells.some((q) => !q)) return false;
        for (let i = 0; i < cells.length; i++)
          for (let k = i + 1; k < cells.length; k++)
            if (Math.hypot(cells[i]!.c - cells[k]!.c, cells[i]!.r - cells[k]!.r) < 1.9) return false;
      }
      return true;
    };

    const group = (pool: Vec[][]) => {
      const tpl = pick(pool);
      for (let tries = 0; tries < 12; tries++) {
        const pts = vary(tpl);
        if (fits(pts)) return { tpl, pts };
      }
      return { tpl, pts: tpl.map((p): Vec => [p[0], p[1]]) };
    };

    /**
     * 3–4 shapes on one side, 2–3 on the other. Shapes and colours are dealt
     * without repeats so a composition never shows two of the same.
     */
    const makeComposition = (): Item[] => {
      const big = group(Math.random() < 0.5 ? TEMPLATES.tri : TEMPLATES.quad);
      let small = group(Math.random() < 0.6 ? TEMPLATES.pair : TEMPLATES.tri);
      while (small.tpl === big.tpl) small = group(TEMPLATES.pair);
      const shapes = shuffle(Object.keys(OUTLINE) as ShapeName[]);
      const colors = shuffle(PALETTE.slice());
      const items: Item[] = [];
      const add = (pts: Vec[], side: 0 | 1) => pts.forEach((uv) => {
        const k = items.length;
        items.push({
          side,
          uv,
          shape: shapes[k % shapes.length],
          rgb: hexRgb(colors[k % colors.length]),
          tilt: (Math.random() - 0.5) * 0.4,
        });
      });
      add(big.pts, 0);
      add(small.pts, 1);
      return items;
    };

    /**
     * The loop: play a composition, rest, play its mirror (sides swapped, tilts
     * reversed), rest, then deal a new composition and repeat.
     */
    const nextPlay = (now: number): Play | null => {
      if (!book.w && !measureBook()) return null;
      if (!composition || mirrored) {
        composition = makeComposition();
        mirrored = false;
        firstSide = Math.random() < 0.5 ? 0 : 1;
      } else {
        mirrored = true;
      }

      const placed: Placed[] = [];
      for (const it of composition) {
        const side = mirrored ? 1 - (it.side ^ firstSide) : it.side ^ firstSide;
        const cell = toCell(it.uv, side);
        if (!cell) continue; // too narrow for this point — skip it
        placed.push({
          ...it,
          x: cell.c * dotSpacing,
          y: cell.r * dotSpacing,
          cell: cell.r * cols + cell.c,
          tilt: mirrored ? -it.tilt : it.tilt,
          inAt: 0,
          outAt: 0,
        });
      }
      // Form top-to-bottom, so each group sweeps along its own diagonal.
      placed.sort((p, q) => p.y - q.y || p.x - q.x);

      const n = placed.length;
      const exit = morphMs * exitRatio;
      const outAt = now + (n - 1) * staggerMs + morphMs + holdMs;
      placed.forEach((p, i) => {
        p.inAt = now + i * staggerMs;
        p.outAt = outAt + i * staggerMs;
      });
      if (n && !reduced) {
        const detail: DotsPlayDetail = { start: now, enter: morphMs, outAt, exit };
        window.dispatchEvent(new CustomEvent(DOTS_PLAY_EVENT, { detail }));
      }
      return { placed, enter: morphMs, exit, end: outAt + (n - 1) * staggerMs + exit + restMs };
    };

    const baseDot = (x: number, y: number, a: number) => {
      const { rgb: c } = dotColor.current;
      ctx.fillStyle = `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${a})`;
      ctx.beginPath();
      ctx.arc(x, y, dotRadius, 0, TAU);
      ctx.fill();
    };

    const tracePath = (p: Placed, e: number) => {
      const target = OUTLINE[p.shape];
      const size = lerp(dotRadius * 2, shapeSize * SHAPE_SCALE[p.shape], e);
      const cos = Math.cos(p.tilt * e), sin = Math.sin(p.tilt * e);
      ctx.beginPath();
      for (let k = 0; k < N; k++) {
        const px = lerp(DOT[k * 2], target[k * 2], e) * size;
        const py = lerp(DOT[k * 2 + 1], target[k * 2 + 1], e) * size;
        const x = p.x + px * cos - py * sin;
        const y = p.y + px * sin + py * cos;
        if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
    };

    /** Fill the traced shape flat in its colour — no glow, no soft edge. */
    const fillFlat = (rgb: number[], alpha: number) => {
      const [r, g, b] = rgb.map(Math.round);
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
      ctx.fill();
    };

    /**
     * One cell at eased progress e: 0 = its dot, 1 = its shape. Outline, size,
     * tilt and colour ride the same curve, so it reads as the dot itself
     * changing form. Under reduced motion there's no change of form — the dot
     * and the finished shape crossfade in place.
     */
    const drawMorph = (p: Placed, e: number) => {
      const { rgb: c, a } = dotColor.current;
      if (reduced) {
        baseDot(p.x, p.y, a * (1 - e));
        tracePath(p, 1);
        fillFlat(p.rgb, e);
        return;
      }
      const rgb = [lerp(c[0], p.rgb[0], e), lerp(c[1], p.rgb[1], e), lerp(c[2], p.rgb[2], e)];
      tracePath(p, e);
      fillFlat(rgb, lerp(a, 1, e));
    };

    let raf = 0;
    let running = false;

    const frame = (now: number) => {
      ctx.clearRect(0, 0, W, H);
      // A fresh composition whenever the last one (and its rest) is over — also
      // what happens after the footer was off screen, so no catch-up burst.
      if (!play || now >= play.end) play = nextPlay(now);

      const active = new Map<number, { p: Placed; e: number }>();
      if (play) {
        for (const p of play.placed) {
          let e = 0;
          if (now >= p.outAt) e = 1 - easeExit(clamp((now - p.outAt) / play.exit));
          else if (now >= p.inAt) e = easeEnter(clamp((now - p.inAt) / play.enter));
          if (e > 0.001) active.set(p.cell, { p, e });
        }
      }

      const { a } = dotColor.current;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const hit = active.get(r * cols + c);
          if (hit) drawMorph(hit.p, hit.e);
          else baseDot(c * dotSpacing, r * dotSpacing, a);
        }
      }

      if (running) raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    // Only animate while the footer is on screen.
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) start(); else stop();
    });
    io.observe(parent);
    const ro = new ResizeObserver(resize);
    ro.observe(parent);
    resize();

    return () => {
      io.disconnect();
      ro.disconnect();
      stop();
    };
  }, [dotRadius, dotSpacing, anchorSelector, bookPad, spread, jitter, shapeSize, morphMs, exitRatio, staggerMs, holdMs, restMs]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', display: 'block' }}
    />
  );
}
