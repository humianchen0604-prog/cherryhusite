'use client';

import { useEffect, useRef } from 'react';
import './heroDeco.css';
import { TULIP_DOTS, TULIP_H, TULIP_W } from './heroTulipDots';

/**
 * The pixel tulip beside the hero copy.
 *
 * Landing (once, when the tulip first scrolls into view):
 *   empty → grey pixels sparkle in → colour washes up from the root
 *         → both heads bloom and breathe once → fade back to grey
 *
 * Hover (any time after):
 *   grey → Twinkle (pixels flicker on in Blush) while both heads bloom open
 *        → petals breathe at full colour for as long as the pointer stays
 *        → on leave, fade back to grey while the petals close
 *
 * Hovering during the landing lets it run on and then holds at full colour
 * instead of fading out. On touch, a tap toggles it. Prototyped in _playground/tulip-dots (the
 * "03 Twinkle" variant). Drawn on a canvas so every pixel can move and
 * recolour on its own; the bottom-up fade is a CSS mask on the wrapper
 * (see heroDeco.css).
 */

// ---------- timing (ms) ----------
const TW_SPREAD = 220; // window over which pixels start twinkling
const TW_LEN = 180; // one pixel's flicker before it settles (spread + len = 0.4s)
const TW_STEPS = 4; // on/off flickers per pixel
const BLOOM_IN = 900; // petals opening, starts with the twinkle
const BREATHE = 2800; // one slow breath while held open
const OUT = 700; // fade back to grey while the petals close

// Landing timeline, from when the tulip first scrolls into view
const L_DELAY = 600; // let the intro copy start fading in first
const L_GREY_SPREAD = 480; // grey pixels start sparkling in across this window (done by ~740ms)
const L_GREY_LEN = 260; // one grey pixel's sparkle before it settles
const L_GREY_STEPS = 4;
const L_COL_AT = 750; // colour starts washing in, right as the grey has settled
const L_COL_SPREAD = 1000; // bottom-up, root first, heads last
const L_COL_LEN = 700; // one pixel's grey → colour crossfade
const L_BLOOM_AT = 2050; // heads open as the colour reaches them
const L_HOLD = 1500; // full colour after the bloom has opened
const L_OUT_AT = L_BLOOM_AT + BLOOM_IN + L_HOLD;
const L_OUT = 900; // fade back to grey, petals closing
const L_END = L_OUT_AT + L_OUT;

const PAD = 16; // room for the bloom to flare past the traced bounds
const VW = TULIP_W + PAD * 2;
const VH = TULIP_H + PAD * 2;
const GHOST = 0.2; // grey left behind while colour twinkles in
const CORNER = 1; // pixel corner radius, in CSS px

type RGB = [number, number, number];

const clamp = (v: number, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeInOut = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
const backOut = (k: number, s = 1.2) => 1 + (s + 1) * Math.pow(k - 1, 3) + s * Math.pow(k - 1, 2);
const hex = (h: string): RGB => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) as RGB;
const mix = (a: RGB, b: RGB, t: number): RGB => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const rgb = (c: RGB) => `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;
const WHITE: RGB = [255, 255, 255];

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Blush: [deep, light] per region
const BLUSH = { r: ['#F4A3BA', '#FCD9E3'], l: ['#F7B399', '#FDE0D2'], g: ['#8CC79A', '#D2EDCB'] };

// How far the petals open at full bloom. Widest reach stays inside PAD, so
// nothing clips at the canvas edge.
const BLOOM_SPREAD = 0.8; // sideways flare at the petal tips, × distance from the axis
const BLOOM_INNER = 0.2; // flare on the side facing the other head, so they don't collide
const BLOOM_LIFT = 0.1; // lift along the head's axis, × distance from the base
const BLOOM_GROW = 0.15; // extra pixel size at the tips

// Each head opens around its base, fanning out along its own axis.
const HEADS = [
  { base: { x: 190, y: 152 }, tip: { x: 192, y: 28 }, mid: { x: 195, y: 90 } }, // right, upright
  { base: { x: 108, y: 214 }, tip: { x: 52, y: 118 }, mid: { x: 80, y: 165 } }, // left, tilted
];

type Dot = {
  x: number;
  y: number;
  h: number; // half-side of the square: same area as the traced dot (r·√π/2)
  col: RGB;
  cs: string;
  bx: number; // bloom offset at full open
  by: number;
  br: number; // bloom size factor at full open
};

const DOTS: Dot[] = (() => {
  const rand = mulberry32(11);
  return TULIP_DOTS.map(([x, y, r, reg]) => {
    const j = rand();
    let t: number;
    if (reg === 2) t = 1 - clamp((y - 150) / 250); // greens deepen toward the root
    else t = clamp(Math.hypot(x - HEADS[reg].base.x, y - HEADS[reg].base.y) / (reg ? 135 : 125));
    t = clamp(t + (j - 0.5) * 0.3);
    const pair = [BLUSH.r, BLUSH.l, BLUSH.g][reg];
    const col = mix(hex(pair[0]), hex(pair[1]), t);

    // Petals flare sideways more toward the tips, like a tulip cup opening,
    // and lift a touch along the head's axis.
    let bx = 0;
    let by = 0;
    let br = 1;
    if (reg !== 2) {
      const { base, tip } = HEADS[reg];
      const len = Math.hypot(tip.x - base.x, tip.y - base.y);
      const ux = (tip.x - base.x) / len;
      const uy = (tip.y - base.y) / len;
      const nx = -uy;
      const ny = ux;
      const vx = x - base.x;
      const vy = y - base.y;
      const along = Math.max(0, vx * ux + vy * uy);
      const lat = vx * nx + vy * ny;
      const reach = clamp(along / len);
      // Petals on the side facing the other head open only a little.
      const other = HEADS[1 - reg].mid;
      const self = HEADS[reg].mid;
      const facing = lat * (nx * (other.x - self.x) + ny * (other.y - self.y)) > 0;
      const flare = (facing ? BLOOM_INNER : BLOOM_SPREAD) * reach;
      bx = nx * lat * flare + ux * along * BLOOM_LIFT;
      by = ny * lat * flare + uy * along * BLOOM_LIFT;
      br = 1 + BLOOM_GROW * reach;
    }
    return { x, y, h: (r * Math.sqrt(Math.PI)) / 2, col, cs: rgb(col), bx, by, br };
  });
})();

// Bloom amount for time since the twinkle began: opens with a soft overshoot,
// then breathes between ~88% and 100% open.
function bloomAt(tb: number) {
  const open = backOut(clamp(tb / BLOOM_IN));
  const breath = tb > BLOOM_IN ? (1 - Math.cos(((tb - BLOOM_IN) / BREATHE) * Math.PI * 2)) / 2 : 0;
  return open - 0.12 * breath;
}

export default function HeroTulip() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!wrap || !canvas || !ctx) return;

    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const N = DOTS.length;
    const starts = new Float32Array(N);
    const phases = new Uint8Array(N);
    const greyStarts = new Float32Array(N);
    const colStarts = new Float32Array(N);

    let scale = 0;
    let corner = 1;
    let grey = '#c8c8c8';
    // pre (empty) → land (once) → rest (grey)
    // rest → in (twinkle) → hold (full colour, breathing) → out → rest
    let phase: 'pre' | 'land' | 'rest' | 'in' | 'hold' | 'out' = 'pre';
    let hovered = false;
    let landTimer = 0;
    let t0 = 0;
    let playT0 = 0;
    let frozenT = 0;
    let frozenB = 0;
    let raf = 0;
    let visible = true;

    const readGrey = () => {
      grey = getComputedStyle(wrap).getPropertyValue('--hero-tulip-grey').trim() || grey;
    };

    const square = (x: number, y: number, h: number) => {
      const rad = Math.min(corner, h * 0.4);
      if (ctx.roundRect) ctx.roundRect(x - h, y - h, h * 2, h * 2, rad);
      else ctx.rect(x - h, y - h, h * 2, h * 2);
    };

    const drawDot = (d: Dot, fill: string, a: number, s: number, b: number) => {
      ctx.globalAlpha = a;
      ctx.fillStyle = fill;
      ctx.beginPath();
      square(d.x + d.bx * b, d.y + d.by * b, d.h * s * lerp(1, d.br, b));
      ctx.fill();
    };

    const paint = (now: number) => {
      if (!scale) return;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(scale, 0, 0, scale, PAD * scale, PAD * scale);
      ctx.globalAlpha = 1;

      if (phase === 'pre') return;
      if (phase === 'land') return paintLanding(now - t0);

      if (phase === 'rest') {
        ctx.fillStyle = grey;
        ctx.beginPath();
        for (const d of DOTS) square(d.x, d.y, d.h);
        ctx.fill();
        return;
      }

      if (phase === 'hold') {
        // Reduced motion jumps straight to the open flower and holds still.
        const b = reduced.matches ? 1 : bloomAt(now - playT0);
        for (const d of DOTS) drawDot(d, d.cs, 1, 1, b);
        ctx.globalAlpha = 1;
        return;
      }

      // "in" plays the twinkle; "out" freezes it and crossfades to grey
      const inPhase = phase === 'in';
      const t = inPhase ? now - t0 : frozenT;
      const e = inPhase ? 0 : easeInOut(clamp((now - t0) / OUT));
      const b = inPhase ? bloomAt(t) : frozenB * (1 - e);
      const dim = lerp(1, GHOST, clamp(t / 120));
      for (let i = 0; i < N; i++) {
        const d = DOTS[i];
        let a = 0;
        let s = 1;
        let c: RGB | null = null;
        const k = clamp((t - starts[i]) / TW_LEN);
        if (k > 0.8) a = 1;
        else if (k > 0) {
          const on = (Math.floor(k * TW_STEPS) + phases[i]) % 2 === 0;
          a = on ? 0.45 + 0.55 * k : 0.1;
          s = on ? 1.1 : 0.7;
          c = mix(d.col, WHITE, 0.45 * (1 - k));
        }
        const g0 = dim * (1 - a);
        const g = g0 + (1 - g0) * e;
        if (g > 0.003) {
          ctx.globalAlpha = g;
          ctx.fillStyle = grey;
          ctx.beginPath();
          square(d.x, d.y, d.h);
          ctx.fill();
        }
        const ca = a * (1 - e);
        if (ca > 0.003) drawDot(d, c ? rgb(c) : d.cs, ca, lerp(s, 1, e), b);
      }
      ctx.globalAlpha = 1;
    };

    const paintLanding = (t: number) => {
      const e = easeInOut(clamp((t - L_OUT_AT) / L_OUT));
      const b = t < L_BLOOM_AT ? 0 : bloomAt(t - L_BLOOM_AT) * (1 - e);
      for (let i = 0; i < N; i++) {
        const d = DOTS[i];
        // Grey sparkles in: flickers on/off a few times, then settles.
        const gk = clamp((t - greyStarts[i]) / L_GREY_LEN);
        let ga = 0;
        let gs = 1;
        if (gk >= 0.8) ga = 1;
        else if (gk > 0) {
          const on = (Math.floor(gk * L_GREY_STEPS) + phases[i]) % 2 === 0;
          ga = on ? 0.5 + 0.5 * gk : 0.12;
          gs = on ? 1.12 : 0.75;
        }
        // Then crossfades to colour, and back to grey at the end.
        const ck = easeInOut(clamp((t - L_COL_AT - colStarts[i]) / L_COL_LEN)) * (1 - e);
        const x = d.x + d.bx * b;
        const y = d.y + d.by * b;
        const h = d.h * lerp(1, d.br, b);
        const g = ga * (1 - ck);
        if (g > 0.003) {
          ctx.globalAlpha = g;
          ctx.fillStyle = grey;
          ctx.beginPath();
          square(x, y, h * gs);
          ctx.fill();
        }
        if (ck > 0.003) {
          ctx.globalAlpha = ck;
          ctx.fillStyle = d.cs;
          ctx.beginPath();
          square(x, y, h);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    };

    const startLanding = () => {
      if (phase !== 'pre') return;
      if (reduced.matches) {
        phase = hovered ? 'hold' : 'rest';
        paint(performance.now());
        return;
      }
      for (let i = 0; i < N; i++) {
        const d = DOTS[i];
        greyStarts[i] = Math.random() * L_GREY_SPREAD;
        phases[i] = (Math.random() * 3) | 0;
        colStarts[i] = ((TULIP_H - d.y) / TULIP_H) * 0.7 * L_COL_SPREAD + Math.random() * 0.3 * L_COL_SPREAD;
      }
      phase = 'land';
      t0 = performance.now();
      sync();
    };

    const tick = (now: number) => {
      const t = now - t0;
      if (phase === 'in' && t >= TW_SPREAD + TW_LEN) {
        phase = 'hold';
        t0 = now;
      } else if (phase === 'out' && t >= OUT) {
        phase = 'rest';
        t0 = now;
      } else if (phase === 'land' && hovered && t >= L_OUT_AT) {
        // Still hovered when the landing would fade: stay open, keep breathing.
        phase = 'hold';
        playT0 = t0 + L_BLOOM_AT;
        t0 = now;
      } else if (phase === 'land' && t >= L_END) {
        phase = 'rest';
        t0 = now;
      }
      paint(now);
    };

    // Frames only while something moves: never at rest, and not at all under
    // reduced motion. Also paused while scrolled away or the tab is hidden.
    const running = () =>
      phase !== 'rest' && phase !== 'pre' && !reduced.matches && visible && !document.hidden;
    const frame = (now: number) => {
      raf = 0;
      tick(now);
      if (running()) raf = requestAnimationFrame(frame);
    };
    const sync = () => {
      if (running()) {
        if (!raf) raf = requestAnimationFrame(frame);
      } else if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    const bloom = () => {
      hovered = true;
      if (phase === 'pre') {
        clearTimeout(landTimer);
        return startLanding();
      }
      const now = performance.now();
      // Mid-landing it's already on its way to colour; let it run on (tick
      // holds it open). Only once it has started fading does hover take over.
      if (phase === 'land' && now - t0 < L_OUT_AT) return;
      if (phase === 'in' || phase === 'hold') return;
      for (let i = 0; i < N; i++) {
        starts[i] = Math.random() * TW_SPREAD;
        phases[i] = (Math.random() * 3) | 0;
      }
      phase = reduced.matches ? 'hold' : 'in';
      t0 = playT0 = now;
      paint(now);
      sync();
    };

    const wilt = () => {
      hovered = false;
      if (phase === 'rest' || phase === 'out' || phase === 'pre' || phase === 'land') return;
      const now = performance.now();
      if (reduced.matches) {
        phase = 'rest';
        paint(now);
        return;
      }
      frozenT = phase === 'in' ? now - t0 : TW_SPREAD + TW_LEN;
      frozenB = bloomAt(now - playT0);
      phase = 'out';
      t0 = now;
      sync();
    };

    // Mouse and pen hover; touch has no hover, so a tap toggles instead.
    const onEnter = (e: PointerEvent) => {
      if (e.pointerType !== 'touch') bloom();
    };
    const onLeave = (e: PointerEvent) => {
      if (e.pointerType !== 'touch') wilt();
    };
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== 'touch') return;
      if (phase === 'in' || phase === 'hold' || (phase === 'land' && hovered)) wilt();
      else bloom();
    };
    wrap.addEventListener('pointerenter', onEnter);
    wrap.addEventListener('pointerleave', onLeave);
    wrap.addEventListener('pointerdown', onDown);

    const resize = () => {
      const w = canvas.clientWidth;
      if (!w) return;
      const dpr = Math.min(3, window.devicePixelRatio || 1);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(((w * VH) / VW) * dpr);
      scale = (w / VW) * dpr;
      corner = (CORNER * VW) / w;
      paint(performance.now());
    };

    readGrey();
    // Reduced motion skips the landing and starts on the plain grey tulip.
    if (reduced.matches) phase = 'rest';
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      // The landing plays the first time the tulip is actually on screen.
      if (visible && phase === 'pre' && !landTimer) landTimer = window.setTimeout(startLanding, L_DELAY);
      sync();
    });
    io.observe(wrap);

    const themeObserver = new MutationObserver(() => {
      readGrey();
      paint(performance.now());
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    const onReducedChange = () => {
      paint(performance.now());
      sync();
    };
    document.addEventListener('visibilitychange', sync);
    reduced.addEventListener('change', onReducedChange);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      clearTimeout(landTimer);
      wrap.removeEventListener('pointerenter', onEnter);
      wrap.removeEventListener('pointerleave', onLeave);
      wrap.removeEventListener('pointerdown', onDown);
      ro.disconnect();
      io.disconnect();
      themeObserver.disconnect();
      document.removeEventListener('visibilitychange', sync);
      reduced.removeEventListener('change', onReducedChange);
    };
  }, []);

  return (
    <div ref={wrapRef} className="hero-tulip" aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  );
}
